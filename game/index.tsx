"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { GameComponentProps } from "@rarefriends/friendsdk/runtime";
import { GameMenu } from "@rarefriends/friendsdk/frame";
import { formatGameAmount } from "@rarefriends/friendsdk/ui";
import { type GameSnapshot } from "@rarefriends/friendsdk/game";
import { createFriendSoundKit, type FriendSoundKit, type FriendSoundCue } from "@rarefriends/friendsdk/sounds";
import { createKitchenMusic, type KitchenMusic } from "./music.mjs";
import { createFriendReader, spriteFrame } from "@rarefriends/friendsdk/sprites";
import "@rarefriends/friendsdk/frame.css";
import "./style.css";
import { breakFor, buyIngredient, buyUpgrade, countStock, createCustomer, customerForDish, customerLine, customerMood, EXIT_MS, freshness, holdTimes, INGREDIENTS, priceOf, RECIPES, recipeFromPlate, rollTip, servePay, SHOP, STARTER, tipValue, waveSize, type Customer, type Freshness, type IngredientId, type Mood, type Owned, type Stock, type TipKind } from "./service.mjs";

const stations = ["fridge", "prep", "book", "serve", "computer"] as const;
type Station = typeof stations[number];
type Menu = Station | "ticket" | "settings" | null;
type Dish = { id: number; name: string; madeAt: number };
type Draft = { id: number; items: IngredientId[] };
type Ticket = { correct: boolean; amount: bigint; tip: bigint; tipKind: TipKind; name: string; state: Freshness; dish: string };

function makeWave(now: number, startId: number, taken: string[] = []) {
  const plan = waveSize(Math.floor(Math.random() * 100));
  const names = [...taken];
  const people: Customer[] = [];
  for (let index = 0; index < plan.size; index += 1) {
    const person = createCustomer(Math.floor(Math.random() * 100), startId + index, startId + index, now, names);
    names.push(person.name);
    people.push(person);
  }
  return { people, nextId: startId + plan.size, rush: plan.rush };
}

function tally(items: readonly IngredientId[]) {
  const ids = items.filter((id, index) => items.indexOf(id) === index);
  return ids.map(id => ({ id, name: ingredientName(id), count: items.filter(item => item === id).length }));
}

function ticketLine(ticket: Ticket) {
  if (ticket.state === "spoiled") return "It had gone bad.";
  if (!ticket.correct) return "That was not the order.";
  if (ticket.state === "turning") return "It was getting old.";
  return "Prepared correctly.";
}
const rf = (value: bigint) => `${formatGameAmount(value, 18)} RF`;
const ingredientName = (id: string) => INGREDIENTS.find(item => item.id === id)?.name ?? id;

function drawFriend(canvas: HTMLCanvasElement, rows: readonly string[]) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;
  const pixels = rows.flatMap((row, y) => [...row].flatMap((pixel, x) => pixel === "#" ? [[x, y] as const] : []));
  context.fillStyle = "#fff";
  for (const [x, y] of pixels) context.fillRect(x * 4 - 1, y * 4 - 1, 6, 6);
  context.fillStyle = "#111";
  for (const [x, y] of pixels) context.fillRect(x * 4, y * 4, 4, 4);
}

/** Kitchen service for the selected owned Friend. The SDK runtime owns wallet, ownership, and purchase confirmations. */
export default function FriendsKitchen({ friendId, client, paused }: GameComponentProps) {
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [station, setStation] = useState<Station>("serve");
  const [stock, setStock] = useState<Stock>(STARTER);
  const [prep, setPrep] = useState<{ pile: IngredientId[]; drafts: Draft[] }>({ pile: [], drafts: [{ id: 1, items: [] }] });
  const opening = useRef<ReturnType<typeof makeWave> | null>(null);
  if (!opening.current) opening.current = makeWave(0, 1);
  const [queue, setQueue] = useState<Customer[]>(opening.current.people);
  const [nextWaveAt, setNextWaveAt] = useState<number | null>(null);
  const [ready, setReady] = useState<Dish[]>([]);
  const [now, setNow] = useState(0);
  const [cash, setCash] = useState(0n);
  const [owned, setOwned] = useState<Owned>({ lamp: 0, jar: 0 });
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [artRows, setArtRows] = useState<readonly string[] | null>(null);
  const [artFailed, setArtFailed] = useState(false);
  const [artAttempt, setArtAttempt] = useState(0);
  const sound = useRef<FriendSoundKit | null>(null);
  const music = useRef<KitchenMusic | null>(null);
  const ownedRef = useRef(owned);
  ownedRef.current = owned;
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const locked = useRef(false);
  const epoch = useRef(0);
  const nextCustomerId = useRef(opening.current.nextId);
  const nextDishId = useRef(1);
  const nextDraftId = useRef(2);
  const finishedDrafts = useRef(new Set<number>());
  const sentDishes = useRef(new Set<number>());
  const prepRef = useRef(prep);
  const stockRef = useRef(stock);
  const queueRef = useRef(queue);
  prepRef.current = prep;
  stockRef.current = stock;
  queueRef.current = queue;
  const definition = client.definition;

  useEffect(() => {
    const version = ++epoch.current;
    sound.current = createFriendSoundKit({ volume: 0.7 });
    music.current = createKitchenMusic();
    setSnapshot(null);
    setMenu(null);
    setError("");
    setMessage("");
    setBusy(false);
    setMuted(false);
    locked.current = false;
    void client.read().then(value => {
      if (version === epoch.current) setSnapshot(value);
    }).catch(cause => {
      if (version === epoch.current) setError(cause instanceof Error ? cause.message : "Could not load the preview.");
    });
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => {
      epoch.current++;
      sound.current?.dispose();
      sound.current = null;
      music.current?.dispose();
      music.current = null;
      preference.removeEventListener("change", update);
    };
  }, [client, friendId]);

  useEffect(() => {
    const reader = createFriendReader();
    let cancel = false;
    setArtRows(null);
    setArtFailed(false);
    void reader.read(friendId).then(sprites => {
      if (!cancel) setArtRows(spriteFrame(sprites, "up", false, 0, "right").frame.rows);
    }).catch(() => { if (!cancel) setArtFailed(true); });
    return () => { cancel = true; reader.clear(); };
  }, [friendId, artAttempt]);

  useEffect(() => {
    const canvas = friendCanvas.current;
    if (canvas && artRows) drawFriend(canvas, artRows);
  }, [artRows]);

  const hear = (cue: FriendSoundCue) => {
    const kit = sound.current;
    if (!kit || kit.state.muted) return;
    void music.current?.unlock();
    if (kit.state.status === "ready") {
      kit.play(cue);
      return;
    }
    void kit.unlock().then(ready => { if (ready) sound.current?.play(cue); });
  };

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setNow(value => value + 1000), 1000);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (paused) return;
    const staying = queueRef.current.filter(person => now - person.arrivedAt < person.patienceMs + EXIT_MS);
    if (staying.length === queueRef.current.length) return;
    const left = queueRef.current.filter(person => now - person.arrivedAt >= person.patienceMs + EXIT_MS);
    queueRef.current = staying;
    setQueue(staying);
    hear("impact");
    if (staying.length === 0) {
      setNextWaveAt(now + breakFor(Math.floor(Math.random() * 100)));
      setMessage(left.length === 1 ? `${left[0].name} left. The counter is quiet for a bit.` : `The group left. The counter is quiet for a bit.`);
    } else {
      setMessage(left.length === 1 ? `${left[0].name} said "I'm outta here. You're too slow."` : `${left.length} customers left. They said you were too slow.`);
    }
  }, [now, paused]);

  useEffect(() => {
    if (paused || nextWaveAt === null || now < nextWaveAt || queueRef.current.length > 0) return;
    const wave = makeWave(now, nextCustomerId.current);
    nextCustomerId.current = wave.nextId;
    queueRef.current = wave.people;
    setQueue(wave.people);
    setNextWaveAt(null);
    setMessage(wave.rush ? "Lunch rush. Five customers just walked in." : `A group of ${wave.people.length} just walked in.`);
    hear("action-start");
  }, [now, paused, nextWaveAt]);

  async function act(work: () => Promise<void>, cue?: FriendSoundCue, after?: () => void) {
    if (locked.current || paused) return;
    const version = epoch.current;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    void sound.current?.unlock();
    try {
      await work();
      const value = await client.read();
      if (version === epoch.current) {
        setSnapshot(value);
        if (cue) hear(cue);
        after?.();
      }
    } catch (cause) {
      if (version === epoch.current) setError(cause instanceof Error ? cause.message : "The preview action failed.");
    } finally {
      if (version === epoch.current) {
        locked.current = false;
        setBusy(false);
      }
    }
  }

  const navigate = (next: Menu) => {
    if (busy || paused) return;
    setMenu(next);
    setError("");
    setMessage("");
    hear("select");
  };

  const moveTo = (next: Station, open = false) => {
    if (busy || paused || menu) return;
    setStation(next);
    if (open) navigate(next);
    else hear("select");
  };

  const shift = (direction: -1 | 1) => {
    const index = stations.indexOf(station);
    moveTo(stations[(index + direction + stations.length) % stations.length]);
  };

  const addIngredient = (id: IngredientId) => {
    if (busy || paused || ticket || countStock(stockRef.current, id) < 1) return;
    const nextStock = { ...stockRef.current, [id]: countStock(stockRef.current, id) - 1 };
    const nextPrep = { ...prepRef.current, pile: [...prepRef.current.pile, id] };
    stockRef.current = nextStock;
    prepRef.current = nextPrep;
    setStock(nextStock);
    setPrep(nextPrep);
    hear("select");
  };

  const returnToFridge = (id: IngredientId) => {
    if (busy || paused || ticket) return;
    const index = prepRef.current.pile.indexOf(id);
    if (index < 0) return;
    const nextPrep = { ...prepRef.current, pile: prepRef.current.pile.filter((_, item) => item !== index) };
    const nextStock = { ...stockRef.current, [id]: countStock(stockRef.current, id) + 1 };
    prepRef.current = nextPrep;
    stockRef.current = nextStock;
    setPrep(nextPrep);
    setStock(nextStock);
    hear("select");
  };

  const useFor = (draftId: number, id: IngredientId) => {
    if (busy || paused || ticket) return;
    const index = prepRef.current.pile.indexOf(id);
    if (index < 0 || !prepRef.current.drafts.some(draft => draft.id === draftId)) return;
    const nextPrep = {
      pile: prepRef.current.pile.filter((_, item) => item !== index),
      drafts: prepRef.current.drafts.map(draft => draft.id === draftId ? { ...draft, items: [...draft.items, id] } : draft),
    };
    prepRef.current = nextPrep;
    setPrep(nextPrep);
    hear("select");
  };

  const putBack = (draftId: number, index: number) => {
    if (busy || paused || ticket) return;
    const draft = prepRef.current.drafts.find(item => item.id === draftId);
    const id = draft?.items[index];
    if (!id) return;
    const nextPrep = {
      pile: [...prepRef.current.pile, id],
      drafts: prepRef.current.drafts.map(item => item.id === draftId ? { ...item, items: item.items.filter((_, place) => place !== index) } : item),
    };
    prepRef.current = nextPrep;
    setPrep(nextPrep);
    hear("select");
  };

  const startDraft = () => {
    if (busy || paused || ticket) return;
    const id = nextDraftId.current++;
    const nextPrep = { ...prepRef.current, drafts: [...prepRef.current.drafts, { id, items: [] }] };
    prepRef.current = nextPrep;
    setPrep(nextPrep);
    hear("select");
  };

  const cancelDraft = (draftId: number) => {
    if (busy || paused || ticket || prepRef.current.drafts.length < 2) return;
    const draft = prepRef.current.drafts.find(item => item.id === draftId);
    if (!draft) return;
    const nextPrep = { pile: [...prepRef.current.pile, ...draft.items], drafts: prepRef.current.drafts.filter(item => item.id !== draftId) };
    prepRef.current = nextPrep;
    setPrep(nextPrep);
    hear("select");
  };

  const finishDraft = (draftId: number) => {
    if (busy || paused || ticket || finishedDrafts.current.has(draftId)) return;
    const draft = prepRef.current.drafts.find(item => item.id === draftId);
    const recipe = draft ? recipeFromPlate(draft.items) : null;
    if (!draft || !recipe) {
      hear("impact");
      setMessage("That plate is not on the menu.");
      return;
    }
    finishedDrafts.current.add(draftId);
    const made: Dish = { id: nextDishId.current++, name: recipe.name, madeAt: now };
    const replacement = nextDraftId.current++;
    const rest = prepRef.current.drafts.filter(item => item.id !== draftId);
    const nextPrep = { pile: prepRef.current.pile, drafts: rest.length > 0 ? rest : [{ id: replacement, items: [] }] };
    prepRef.current = nextPrep;
    setPrep(nextPrep);
    setReady(current => [...current, made]);
    hear("action-ready");
    setMessage(`${recipe.name} is on the pass. Anything still on the counter can make another dish. Carry finished dishes to the serving counter before they spoil.`);
  };

  const serveDish = (dishId: number, customerId: number) => {
    if (busy || paused || ticket || sentDishes.current.has(dishId)) return;
    const dish = ready.find(item => item.id === dishId);
    const person = queueRef.current.find(item => item.id === customerId);
    if (!dish || !person) return;
    sentDishes.current.add(dishId);
    const state = freshness(Math.max(0, now - dish.madeAt), ownedRef.current.lamp ?? 0);
    const result = servePay(dish.name, person.order.name, state);
    const mood = customerMood(Math.max(0, now - person.arrivedAt), person.patienceMs);
    const tipKind = rollTip(Math.floor(Math.random() * 10000), { correct: result.correct, state, mood }, (ownedRef.current.jar ?? 0) > 0);
    const tip = tipValue(result.amount, tipKind);
    const staying = queueRef.current.filter(item => item.id !== customerId);
    queueRef.current = staying;
    setCash(current => current + result.amount + tip);
    setReady(current => current.filter(item => item.id !== dishId));
    setQueue(staying);
    if (staying.length === 0) setNextWaveAt(now + breakFor(Math.floor(Math.random() * 100)));
    setTicket({ correct: result.correct, amount: result.amount, tip, tipKind, name: person.name, state, dish: dish.name });
    setMessage("");
    hear(tip > 0n ? "reward" : result.correct && state === "fresh" ? "reveal-common" : "impact");
    setMenu("ticket");
  };

  useEffect(() => {
    if (paused || ticket) return;
    const dish = ready.find(item => freshness(Math.max(0, now - item.madeAt), ownedRef.current.lamp ?? 0) !== "spoiled" && customerForDish(queue, item.name, now));
    if (!dish) return;
    const person = customerForDish(queue, dish.name, now);
    if (person) serveDish(dish.id, person.id);
  }, [ready, queue, now, paused, ticket]);

  const discard = (dishId: number) => {
    if (busy || paused || ticket) return;
    setReady(current => current.filter(item => item.id !== dishId));
    hear("impact");
    setMessage("That dish went in the bin.");
  };

  const closeTicket = () => {
    if (busy || paused) return;
    setTicket(null);
    setMenu(null);
    setMessage("");
    hear("select");
  };

  const feedback = <p role={error ? "alert" : "status"}>{error || message || (busy ? "Waiting for preview confirmation…" : "Finish a dish on the left counter, then carry it to service. Waiting dishes spoil.")}</p>;

  const orderIngredient = (id: IngredientId) => {
    if (paused || busy) return;
    const result = buyIngredient(cash, stock, id);
    if (!result.ok) return;
    setCash(result.cash);
    stockRef.current = result.stock;
    setStock(result.stock);
    hear("purchase");
    setMessage(`One ${ingredientName(id)} is in the refrigerator.`);
  };

  const orderUpgrade = (id: "lamp" | "jar") => {
    if (paused || busy) return;
    const result = buyUpgrade(cash, owned, id);
    if (!result.ok) return;
    setCash(result.cash);
    setOwned(result.owned);
    hear("purchase");
    setMessage(id === "lamp" ? "A heat lamp is warming the pass. Dishes last longer." : "The tip jar is on the counter.");
  };

  if (!snapshot) {
    return <div className="kitchen-loading" role={error ? "alert" : "status"}>{error || "Opening the kitchen…"}
      {error && <button type="button" disabled={busy || paused} onClick={() => void act(async () => {})}>Retry</button>}
    </div>;
  }
  if (snapshot.friendId !== friendId) return <p role="alert">This game session does not match the selected Friend.</p>;

  const { pile, drafts } = prep;
  const title = menu === "fridge" ? "Refrigerator" : menu === "book" ? "Menu book" : menu === "prep" ? "Prep counter" : menu === "serve" ? "Serving counter" : menu === "computer" ? "Order computer" : menu === "ticket" ? "Ticket" : "Settings";
  const dishState = (dish: Dish): Freshness => freshness(Math.max(0, now - dish.madeAt), owned.lamp ?? 0);
  const hold = holdTimes(owned.lamp ?? 0);
  const serveName = (dish: Dish, person: Customer) => {
    const state = dishState(dish);
    const word = state === "fresh" ? "fresh" : state === "turning" ? "turning" : "spoiled";
    const sameDish = ready.filter(item => item.name === dish.name && dishState(item) === state);
    const dishPlace = sameDish.findIndex(item => item.id === dish.id) + 1;
    const dishLabel = sameDish.length > 1 ? `${word} ${dish.name} ${dishPlace}` : `${word} ${dish.name}`;
    const sameName = queue.filter(item => item.name === person.name);
    const whoPlace = sameName.findIndex(item => item.id === person.id) + 1;
    const who = sameName.length > 1 ? `${person.name} ${whoPlace}` : person.name;
    return `Serve ${dishLabel} to ${who}`;
  };

  return <section className={`kitchen-game${reducedMotion ? " kitchen-reduced" : ""}`} aria-label={definition.name} aria-busy={busy}>
    <div className="kitchen-room" tabIndex={0} inert={Boolean(menu) || paused || undefined}
      onKeyDown={event => {
        if (menu || paused || busy) return;
        if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") { event.preventDefault(); shift(-1); }
        if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") { event.preventDefault(); shift(1); }
        if (event.key === "ArrowUp" || event.key === "w" || event.key === "W" || event.key.toLowerCase() === "e") { event.preventDefault(); navigate(station); }
      }}>
      <div className="kitchen-wall" aria-hidden="true" />
      <div className="kitchen-floor" aria-hidden="true" />
      <div className="kitchen-door" aria-hidden="true"><span>In</span></div>
      <div className="kitchen-hud">
        <span><span className="cash-long">Cash {rf(cash)} · simulated dish sales</span><span className="cash-short">Cash {rf(cash)}</span></span>
        <h1 className="cafe-sign">{definition.name}</h1>
        <button type="button" onClick={() => navigate("settings")}>Settings</button>
      </div>
      <div className="customer-lane">
        {queue.length === 0 && nextWaveAt !== null && <p className="counter-quiet">Quiet stretch. Next group in {Math.max(1, Math.ceil((nextWaveAt - now) / 1000))}s.</p>}
        {queue.map((person, index) => {
          const waited = Math.max(0, now - person.arrivedAt);
          const feeling = customerMood(waited, person.patienceMs);
          const speaking: Mood = feeling === "gone" ? "leaving" : feeling;
          const remaining = speaking === "leaving" ? 0 : Math.max(0, 1 - waited / person.patienceMs);
          const line = customerLine(person.order.name, speaking, Math.floor(now / 5000) + person.id);
          return <div key={person.id} className={`customer wave-${queue.length} spot-${index}${speaking === "annoyed" ? " is-annoyed" : ""}${speaking === "leaving" ? " is-leaving" : ""}${index === queue.length - 1 ? " is-arriving" : ""}`} data-order={index === 0 ? person.order.name : undefined} aria-label={`${person.name}, ordering ${person.order.name}. ${line}`} style={{ "--shirt": person.look.shirt, "--skin": person.look.skin, "--hair": person.look.hair } as CSSProperties}>
            <p className="order-bubble"><span className="customer-name">{person.name}</span>{line}</p>
            <span className="patience" aria-hidden="true"><i style={{ width: `${remaining * 100}%` }} /></span>
            <span className="customer-body" aria-hidden="true">
              <i className="person-hair" /><i className="person-head" /><i className="person-arm person-arm-left" /><i className="person-torso" /><i className="person-arm person-arm-right" /><i className="person-leg person-leg-left" /><i className="person-leg person-leg-right" />
            </span>
          </div>;
        })}
      </div>
      <button type="button" className={`appliance fridge${station === "fridge" ? " is-here" : ""}`} aria-label="Refrigerator" onClick={() => moveTo("fridge", true)}>
        <span className="appliance-face" aria-hidden="true" />
        <span className="full-label">Refrigerator</span><span className="short-label">Fridge</span>
      </button>
      <button type="button" className={`book${station === "book" ? " is-here" : ""}`} aria-label="Menu book" onClick={() => moveTo("book", true)}>
        <span className="notebook" aria-hidden="true">
          <span className="spiral"><i /><i /><i /><i /><i /><i /></span>
          <span className="notebook-page"><span className="notebook-margin" /></span>
          <span className="pencil" />
        </span>
        <span className="full-label">Menu book</span><span className="short-label">Book</span>
      </button>
      <div className={`counter prep${station === "prep" ? " is-here" : ""}`}>
        <span className="steel-legs" aria-hidden="true"><i /><i /><i /><i /><span className="steel-shelf" /></span>
        <button type="button" className="counter-top" aria-label="Prep counter" onClick={() => moveTo("prep", true)}>
          <span className="steel-lip" aria-hidden="true" />
          <span className="full-label">Prep counter</span><span className="short-label">Prep</span>
        </button>
        <ul className="plated" aria-label="Ingredients on the prep counter">
          {pile.map((id, index) => <li key={`pile-${id}-${index}`} className={`bit bit-${id}`}>{ingredientName(id)}</li>)}
          {drafts.flatMap(draft => draft.items.map((id, index) => <li key={`draft-${draft.id}-${index}`} className={`bit bit-${id} is-held`}>{ingredientName(id)}</li>))}
        </ul>
      </div>
      <div className={`counter serve${station === "serve" ? " is-here" : ""}`}>
        {(owned.lamp ?? 0) > 0 && <span className="heat-lamps" aria-hidden="true">{Array.from({ length: owned.lamp ?? 0 }, (_, index) => <i key={index} className="heat-lamp" />)}</span>}
        {(owned.jar ?? 0) > 0 && <span className="tip-jar" aria-hidden="true" />}
        <button type="button" className="counter-top" aria-label="Serving counter" onClick={() => moveTo("serve", true)}>
          <span className="store-face" aria-hidden="true"><span className="store-panel" /></span>
          <span className="store-bell" aria-hidden="true" />
          <span className="full-label">Serving counter</span><span className="short-label">Serve</span>
        </button>
        <span className="store-base" aria-hidden="true"><i /><i /><i /></span>
        <ul className="pass" aria-label="Finished dishes">
          {ready.map(dish => <li key={dish.id} className={`pass-dish is-${dishState(dish)}`}>{dish.name}</li>)}
        </ul>
      </div>
      <button type="button" className={`appliance computer${station === "computer" ? " is-here" : ""}`} aria-label="Order computer" onClick={() => moveTo("computer", true)}>
        <span className="pc" aria-hidden="true">
          <span className="pc-monitor">
            <span className="pc-screen"><b>ORDERS</b><i /><i /><i /></span>
            <span className="pc-led" />
          </span>
          <span className="pc-neck" />
          <span className="pc-base" />
          <span className="pc-keyboard" />
        </span>
        <span className="full-label">Order computer</span><span className="short-label">Orders</span>
      </button>
      <div className={`kitchen-friend at-${station}`} data-x={stations.indexOf(station)}>
        <canvas ref={friendCanvas} width={64} height={64} aria-label="Your Rare Friend, using its original artwork" />
        {artFailed && <button type="button" onClick={() => setArtAttempt(value => value + 1)}>Retry artwork</button>}
        {!artRows && !artFailed && <p role="status">Loading your Friend…</p>}
      </div>
      <p className="kitchen-hint">
        <span className="kitchen-desktop-hint">Left and right move behind the counters · E opens the fridge, prep counter, menu book, serving counter, or computer</span>
        <span className="kitchen-mobile-hint">Tap the fridge, prep counter, book, serving counter, or computer</span>
      </p>
    </div>
    {menu && <GameMenu title={title} onClose={busy ? undefined : () => navigate(null)}>
      {menu === "fridge" ? <>
        <p>Move ingredients onto the prep counter. Set out enough for more than one dish. The menu book lists each recipe. One click moves one item.</p>
        <ul className="stock-list">
          {INGREDIENTS.map(item => <li key={item.id}>
            <span className={`bit bit-${item.id}`} aria-hidden="true" />
            <span>{item.name} · {countStock(stock, item.id)}</span>
            <button type="button" disabled={busy || paused || countStock(stock, item.id) < 1 || Boolean(ticket)} onClick={() => addIngredient(item.id)}>Add {item.name}</button>
          </li>)}
        </ul>
      </> : menu === "book" ? <>
        <p>Look up the dish here. This book does not plate food.</p>
        <table>
          <thead><tr><th>Dish</th><th>Ingredients</th><th>Full tab</th></tr></thead>
          <tbody>{RECIPES.map(recipe => <tr key={recipe.id}><td>{recipe.name}</td><td>{recipe.ingredients.map(ingredientName).join(", ")}</td><td>{rf(recipe.pay)}</td></tr>)}</tbody>
        </table>
        <p>A matching dish pays the full tab. A different dish pays a quarter. After {hold.freshMs / 1000} seconds on the pass that pay is cut in half, and after {hold.spoilMs / 1000} seconds it pays nothing.{(owned.lamp ?? 0) > 0 ? ` The heat lamp${(owned.lamp ?? 0) > 1 ? "s are" : " is"} holding dishes longer.` : ""}</p>
      </> : menu === "prep" ? <>
        <p>Set out as many ingredients as you want. Choose what goes into each dish. The recipe is only in the menu book. Finish a dish and the rest stays, so you can make another at the same time.</p>
        <h3>On the counter</h3>
        {pile.length === 0 ? <p>Nothing is waiting. Gather ingredients from the refrigerator.</p> : <ul className="stock-list">
          {tally(pile).map(item => <li key={item.id}>
            <span className={`bit bit-${item.id}`} aria-hidden="true" />
            <span>{item.name} · {item.count}</span>
            {drafts.map((draft, position) => <button key={draft.id} type="button" disabled={busy || paused || Boolean(ticket)} onClick={() => useFor(draft.id, item.id)}>{drafts.length === 1 ? `Use ${item.name}` : `Use ${item.name} for dish ${position + 1}`}</button>)}
            <button type="button" disabled={busy || paused || Boolean(ticket)} onClick={() => returnToFridge(item.id)}>Return {item.name}</button>
          </li>)}
        </ul>}
        {drafts.map((draft, position) => <div key={draft.id}>
          <h3>{drafts.length === 1 ? "This dish" : `Dish ${position + 1}`}</h3>
          {draft.items.length === 0 ? <p>Choose ingredients from the counter.</p> : <ul className="stock-list">
            {draft.items.map((id, index) => {
              const name = ingredientName(id);
              const copies = draft.items.filter(item => item === id).length;
              const place = draft.items.slice(0, index + 1).filter(item => item === id).length;
              return <li key={`${draft.id}-${index}`}>
                <span className={`bit bit-${id}`} aria-hidden="true" />
                <span>{name}</span>
                <button type="button" disabled={busy || paused || Boolean(ticket)} onClick={() => putBack(draft.id, index)}>{copies > 1 ? `Put back ${name} ${place}` : `Put back ${name}`}</button>
              </li>;
            })}
          </ul>}
          <button type="button" className="rf-frame-primary" disabled={busy || paused || Boolean(ticket) || draft.items.length === 0} onClick={() => finishDraft(draft.id)}>{drafts.length === 1 ? "Finish the dish" : `Finish dish ${position + 1}`}</button>
          {drafts.length > 1 && <button type="button" disabled={busy || paused || Boolean(ticket)} onClick={() => cancelDraft(draft.id)}>Cancel dish {position + 1}</button>}
        </div>)}
        <button type="button" disabled={busy || paused || Boolean(ticket)} onClick={startDraft}>Start another dish</button>
      </> : menu === "serve" ? <>
        <p>A finished dish that matches an order is handed to that customer. What is left here did not match. The name is on top and the order is underneath.</p>
        <ul className="stock-list">
          {queue.map(person => <li key={person.id}>
            <span className="guest-card"><strong>{person.name}</strong><span>{person.order.name}</span></span>
            {ready.map(dish => <button key={dish.id} type="button" disabled={busy || paused || Boolean(ticket)} onClick={() => serveDish(dish.id, person.id)}>{serveName(dish, person)}</button>)}
          </li>)}
        </ul>
        {ready.length === 0 ? <p>Nothing is waiting on the pass.</p> : ready.map(dish => <button key={dish.id} type="button" disabled={busy || paused || Boolean(ticket)} onClick={() => discard(dish.id)}>Discard {dish.name}</button>)}
      </> : menu === "computer" ? <>
        <p>Buy one ingredient at a time. Cash is only what customers have paid you. You can stock as many as you can afford. All of this is simulated.</p>
        <h3>For the counter</h3>
        <ul className="stock-list">
          {SHOP.map(item => {
            const count = owned[item.id] ?? 0;
            const full = count >= item.max;
            return <li key={item.id}>
              <span>{item.name} · {count} of {item.max} · {item.blurb}</span>
              <button type="button" disabled={busy || paused || full || cash < item.price} onClick={() => orderUpgrade(item.id)}>{full ? `${item.name} owned` : `Buy ${item.name} · ${rf(item.price)}`}</button>
            </li>;
          })}
        </ul>
        <ul className="stock-list">
          {INGREDIENTS.map(item => {
            const price = priceOf(item.id);
            const affordable = cash >= price;
            return <li key={item.id}>
              <span className={`bit bit-${item.id}`} aria-hidden="true" />
              <span>{item.name} · {countStock(stock, item.id)} in the fridge · {rf(price)}</span>
              <button type="button" disabled={busy || paused || !affordable} onClick={() => orderIngredient(item.id)}>Buy {item.name} · {rf(price)}</button>
            </li>;
          })}
        </ul>
        <p>If you run out of one ingredient and the till cannot cover it, that dish has to wait.</p>
      </> : menu === "ticket" && ticket ? <div className="kitchen-ticket">
        <h3>{ticket.dish} for {ticket.name}</h3>
        <p>{ticketLine(ticket)}</p>
        <p data-base={ticket.amount.toString()}>The customer paid {rf(ticket.amount)}.</p>
        {ticket.tip > 0n && <p data-tip={ticket.tip.toString()}>{ticket.tipKind === "fast" ? `Quick plate. They tipped ${rf(ticket.tip)}.` : `They tipped ${rf(ticket.tip)} on a whim.`}</p>}
        <button type="button" className="rf-frame-primary" disabled={busy || paused} onClick={closeTicket}>Next customer</button>
      </div> : menu === "settings" ? <>
        <button type="button" aria-pressed={!muted} onClick={() => { const next = !muted; setMuted(next); sound.current?.setMuted(next); music.current?.setMuted(next); if (!next) { void sound.current?.unlock(); void music.current?.unlock(); } }}>{muted ? "Sound off" : "Sound on"}</button>
        <label><input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)} /> Reduce motion</label>
        <p>Dish payments and ingredient orders are simulated. A wrong dish pays a quarter of the tab, turning dishes pay half, and spoiled dishes pay nothing. A fast correct plate often earns a tip, and any paying customer might tip on a whim. Customers leave when their own timer runs out. Reloading resets this kitchen.</p>
      </> : null}{feedback}
    </GameMenu>}
  </section>;
}
