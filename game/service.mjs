const RF = 10n ** 18n;

export const INGREDIENTS = Object.freeze([
  Object.freeze({ id: "bread", name: "Bread" }),
  Object.freeze({ id: "butter", name: "Butter" }),
  Object.freeze({ id: "tea", name: "Tea" }),
  Object.freeze({ id: "broth", name: "Broth" }),
  Object.freeze({ id: "noodles", name: "Noodles" }),
  Object.freeze({ id: "vegetables", name: "Vegetables" }),
  Object.freeze({ id: "spice", name: "Spice" }),
  Object.freeze({ id: "rice", name: "Rice" }),
]);

const recipe = (id, name, ingredients, pay) => Object.freeze({ id, name, ingredients: Object.freeze(ingredients), pay });

/** Full tab if the plate matches. A wrong plate pays one quarter, rounded down. */
export const RECIPES = Object.freeze([
  recipe("toast", "Toast", ["bread", "butter"], RF),
  recipe("tea", "Garden Tea", ["tea"], 3n * RF / 2n),
  recipe("soup", "Miso Soup", ["broth", "vegetables"], 2n * RF),
  recipe("sandwich", "Friend Sandwich", ["bread", "butter", "vegetables"], 3n * RF),
  recipe("noodles", "Night Noodles", ["noodles", "broth"], 4n * RF),
  recipe("curry", "Curry", ["rice", "vegetables", "spice"], 5n * RF),
  recipe("banquet", "Banquet", ["bread", "broth", "noodles", "vegetables", "rice"], 8n * RF),
  recipe("signature", "Signature Special", ["bread", "butter", "tea", "broth", "noodles", "vegetables", "spice", "rice"], 12n * RF),
]);

export const ORDER_WEIGHTS = Object.freeze([28, 22, 16, 12, 10, 7, 3, 2]);
/** One of each, so the first order can be plated. Replacements are bought with dish cash. */
export const STARTER = Object.freeze({ bread: 1, butter: 1, tea: 1, broth: 1, noodles: 1, vegetables: 1, spice: 1, rice: 1 });
/** Simulated price for one unit. A wrong plate often pays less than replacing what it used. */
export const PRICES = Object.freeze({
  bread: RF / 2n,
  butter: RF / 2n,
  tea: RF / 2n,
  vegetables: RF / 2n,
  broth: RF,
  noodles: RF,
  spice: RF,
  rice: RF,
});

const sorted = items => [...items].sort().join(",");

export function plateMatches(plate, ingredients) {
  return sorted(plate) === sorted(ingredients);
}

export function payment(plate, order) {
  const correct = plateMatches(plate, order.ingredients);
  return Object.freeze({ correct, amount: correct ? order.pay : order.pay / 4n });
}

export function recipeForRoll(roll) {
  if (!Number.isInteger(roll) || roll < 0 || roll >= 100) throw new RangeError("Order roll must be an integer from 0 to 99.");
  let boundary = 0;
  for (let index = 0; index < ORDER_WEIGHTS.length; index++) {
    boundary += ORDER_WEIGHTS[index];
    if (roll < boundary) return RECIPES[index];
  }
  throw new RangeError("Order weights must total 100.");
}

export function priceOf(id) {
  const price = PRICES[id];
  if (price === undefined) throw new RangeError("Unknown ingredient.");
  return price;
}

/** Buy one unit with dish cash. There is no stock cap. A short till leaves the pantry unchanged. */
export function buyIngredient(cash, stock, id) {
  const price = priceOf(id);
  if (cash < price) return Object.freeze({ ok: false, cash, stock });
  return Object.freeze({
    ok: true,
    cash: cash - price,
    stock: Object.freeze({ ...stock, [id]: (stock[id] ?? 0) + 1 }),
  });
}

export function countStock(stock, id) {
  return stock[id] ?? 0;
}

export function holdTimes(lamps) {
  if (!Number.isInteger(lamps) || lamps < 0 || lamps > LAMP_MAX) throw new RangeError("Heat lamps must be an integer from 0 to 2.");
  return Object.freeze({ freshMs: FRESH_MS + lamps * LAMP_BONUS_MS, spoilMs: SPOIL_MS + lamps * LAMP_BONUS_MS });
}

/** Buy one shop item with dish cash. A full slot or a short till changes nothing. */
export function buyUpgrade(cash, owned, id) {
  const item = SHOP.find(entry => entry.id === id);
  if (!item) throw new RangeError("Unknown shop item.");
  if (typeof cash !== "bigint" || cash < 0n) throw new RangeError("Cash must be a non-negative amount.");
  const count = owned?.[id] ?? 0;
  if (!Number.isInteger(count) || count < 0) throw new RangeError("Owned count must be a non-negative integer.");
  if (count >= item.max || cash < item.price) return Object.freeze({ ok: false, cash, owned });
  return Object.freeze({
    ok: true,
    cash: cash - item.price,
    owned: Object.freeze({ ...owned, [id]: count + 1 }),
  });
}

export const FRESH_MS = 45_000;
export const SPOIL_MS = 75_000;
/** Each heat lamp pushes both timers out by this much. Two is the cap. */
export const LAMP_BONUS_MS = 30_000;
export const LAMP_MAX = 2;
export const JAR_FAST_BONUS_BPS = 1_500;
export const JAR_LUCKY_BONUS_BPS = 1_000;
export const SHOP = Object.freeze([
  Object.freeze({ id: "lamp", name: "Heat lamp", price: 2n * RF, max: LAMP_MAX, blurb: "Each lamp adds 30 seconds before a dish turns, and 30 seconds before it spoils." }),
  Object.freeze({ id: "jar", name: "Tip jar", price: 2n * RF, max: 1, blurb: "Customers tip more often: a quick plate, and a late one on a whim." }),
]);
export const QUEUE_SIZE = 5;
/** How long each customer waits before leaving. The index picks a different timer. */
export const PATIENCE_MS = Object.freeze([70_000, 90_000, 105_000, 120_000, 160_000, 80_000, 110_000, 140_000]);
/** Quiet time after a group clears, before the next one walks in. */
export const BREAK_MS = Object.freeze([20_000, 28_000, 36_000]);
export const ANNOYED_MS = 20_000;
/** How long the walk-off line stays up before the customer is gone. */
export const EXIT_MS = 3_000;

export const LOOKS = Object.freeze([
  Object.freeze({ shirt: "#3d6b8a", skin: "#f3d2b5", hair: "#2b2118" }),
  Object.freeze({ shirt: "#c0392b", skin: "#e8c4a0", hair: "#f4d35e" }),
  Object.freeze({ shirt: "#1e8449", skin: "#c68642", hair: "#1a1a1a" }),
  Object.freeze({ shirt: "#6c3483", skin: "#f6d5c3", hair: "#7b3f00" }),
  Object.freeze({ shirt: "#1a5276", skin: "#8d5524", hair: "#111111" }),
  Object.freeze({ shirt: "#b9770e", skin: "#ffdfc4", hair: "#4a3728" }),
  Object.freeze({ shirt: "#1abc9c", skin: "#d4a574", hair: "#f4f1ea" }),
  Object.freeze({ shirt: "#922b21", skin: "#f1c27d", hair: "#2c1810" }),
]);

/** 20% lunch rush of 5. Otherwise a group of 2 or 3. Roll is 0–99. */
export function waveSize(roll) {
  if (!Number.isInteger(roll) || roll < 0 || roll >= 100) throw new RangeError("Wave roll must be an integer from 0 to 99.");
  if (roll < 20) return Object.freeze({ size: 5, rush: true });
  return Object.freeze({ size: roll < 60 ? 2 : 3, rush: false });
}

export function breakFor(roll) {
  if (!Number.isInteger(roll) || roll < 0 || roll >= 100) throw new RangeError("Break roll must be an integer from 0 to 99.");
  return BREAK_MS[roll % BREAK_MS.length];
}

export function patienceFor(index) {
  if (!Number.isInteger(index)) throw new RangeError("Patience index must be an integer.");
  return PATIENCE_MS[((index % PATIENCE_MS.length) + PATIENCE_MS.length) % PATIENCE_MS.length];
}

/** Waiting, annoyed in the last stretch, a short walk-off line, then gone. */
export function customerMood(waitedMs, patienceMs) {
  if (!Number.isFinite(waitedMs) || waitedMs < 0 || !Number.isFinite(patienceMs) || patienceMs <= 0) throw new RangeError("Wait and patience must be usable numbers.");
  if (waitedMs >= patienceMs + EXIT_MS) return "gone";
  if (waitedMs >= patienceMs) return "leaving";
  if (patienceMs - waitedMs <= ANNOYED_MS) return "annoyed";
  return "waiting";
}

const LINE = Object.freeze({
  waiting: Object.freeze([
    order => `I'll have the ${order}!`,
    order => `${order}, please!`,
    order => `Can't wait for that ${order}.`,
    order => `${order} sounds perfect.`,
  ]),
  annoyed: Object.freeze([
    order => `Where is my ${order}?`,
    order => `Still no ${order}?`,
    order => `${order}. Any day now.`,
    () => "This is taking forever.",
  ]),
  leaving: Object.freeze([
    () => "I'm outta here. You're too slow.",
    () => "Forget it. You're too slow.",
  ]),
});

/** Chance of an extra tip, in basis points. A fast plate is a correct fresh dish served before they complain. */
export const FAST_TIP_BPS = 4500;
export const LUCKY_TIP_BPS = 1500;

export function rollTip(roll, { correct, state, mood }, jar = false) {
  if (!Number.isInteger(roll) || roll < 0 || roll >= 10000) throw new RangeError("Tip roll must be an integer from 0 to 9999.");
  if (typeof jar !== "boolean") throw new TypeError("Tip jar must be a boolean.");
  if (!correct || state === "spoiled" || mood === "leaving" || mood === "gone") return "none";
  const fastLine = FAST_TIP_BPS + (jar ? JAR_FAST_BONUS_BPS : 0);
  const luckyLine = LUCKY_TIP_BPS + (jar ? JAR_LUCKY_BONUS_BPS : 0);
  if (mood === "waiting" && state === "fresh" && roll < fastLine) return "fast";
  if (roll < luckyLine) return "lucky";
  return "none";
}

/** Fast tip is half the tab. A lucky tip is a quarter. */
export function tipValue(pay, kind) {
  if (typeof pay !== "bigint" || pay < 0n) throw new RangeError("Pay must be a non-negative amount.");
  if (kind === "fast") return pay / 2n;
  if (kind === "lucky") return pay / 4n;
  if (kind === "none") return 0n;
  throw new RangeError("Unknown tip.");
}

/** What a customer says. Early lines name the dish. Complaints follow. The last line is the walk-off. */
export function customerLine(orderName, mood, lineIndex) {
  const bank = LINE[mood] ?? LINE.waiting;
  if (typeof orderName !== "string" || !orderName) throw new RangeError("Order name is required.");
  if (!Number.isInteger(lineIndex)) throw new RangeError("Line index must be an integer.");
  const index = ((lineIndex % bank.length) + bank.length) % bank.length;
  return bank[index](orderName);
}

export const CUSTOMER_NAMES = Object.freeze([
  "Ada", "Jules", "Noor", "Sam", "Rio", "Quinn", "Mina", "Ellis",
  "Haru", "Pilar", "Nico", "Sable", "Omar", "Luz", "Ren", "Imani",
  "Theo", "Yael", "Hana", "Marlow", "Suki", "Eden", "Bo", "Chris",
]);

export function customerName(id, taken = []) {
  if (!Number.isInteger(id)) throw new RangeError("Customer id must be an integer.");
  if (!Array.isArray(taken)) throw new RangeError("Taken names must be a list.");
  const start = ((id % CUSTOMER_NAMES.length) + CUSTOMER_NAMES.length) % CUSTOMER_NAMES.length;
  for (let step = 0; step < CUSTOMER_NAMES.length; step += 1) {
    const name = CUSTOMER_NAMES[(start + step) % CUSTOMER_NAMES.length];
    if (!taken.includes(name)) return name;
  }
  return `${CUSTOMER_NAMES[start]} ${id}`;
}

/** The customer who ordered this dish and has been waiting the longest. */
export function customerForDish(customers, dishName, now) {
  if (!Array.isArray(customers) || typeof dishName !== "string" || !dishName) throw new RangeError("Need customers and a dish.");
  if (!Number.isFinite(now)) throw new RangeError("Now must be a number.");
  return customers
    .filter(person => person.order.name === dishName && customerMood(Math.max(0, now - person.arrivedAt), person.patienceMs) !== "gone")
    .sort((a, b) => a.arrivedAt - b.arrivedAt || a.id - b.id)[0] ?? null;
}

export function createCustomer(roll, lookIndex, id, arrivedAt = 0, taken = []) {
  if (!Number.isFinite(arrivedAt) || arrivedAt < 0) throw new RangeError("Arrival time must be a non-negative number.");
  return Object.freeze({
    id,
    name: customerName(id, taken),
    order: recipeForRoll(roll),
    look: LOOKS[((lookIndex % LOOKS.length) + LOOKS.length) % LOOKS.length],
    arrivedAt,
    patienceMs: patienceFor(lookIndex),
  });
}

export function recipeFromPlate(plate) {
  return RECIPES.find(recipe => plateMatches(plate, recipe.ingredients)) ?? null;
}

export function freshness(ageMs, lamps = 0) {
  if (!Number.isFinite(ageMs) || ageMs < 0) throw new RangeError("Age must be a non-negative number.");
  const { freshMs, spoilMs } = holdTimes(lamps);
  if (ageMs < freshMs) return "fresh";
  if (ageMs < spoilMs) return "turning";
  return "spoiled";
}

/** Fresh matching dish pays the full tab. Turning halves that pay. Spoiled pays nothing. A wrong dish pays a quarter before spoilage. */
export function servePay(dishName, orderName, state) {
  const dish = RECIPES.find(item => item.name === dishName);
  const order = RECIPES.find(item => item.name === orderName);
  if (!dish || !order || !["fresh", "turning", "spoiled"].includes(state)) throw new RangeError("Unknown dish or freshness.");
  const correct = dish.id === order.id;
  if (state === "spoiled") return Object.freeze({ correct, state, amount: 0n });
  const base = correct ? order.pay : order.pay / 4n;
  return Object.freeze({ correct, state, amount: state === "turning" ? base / 2n : base });
}
