import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { testGame } from "@rarefriends/friendsdk/testing";
import { formatGameAmount } from "@rarefriends/friendsdk/ui";
import { INGREDIENTS, RECIPES, priceOf, servePay } from "../game/service.mjs";

const gameDirectory = fileURLToPath(new URL("../game", import.meta.url));
const rf = value => `${formatGameAmount(value, 18)} RF`;

async function playKitchen({ page, game, width }) {
  const button = name => game.getByRole("button", { name, exact: true });
  const friend = game.locator(".kitchen-friend");
  await friend.waitFor();
  assert.equal(await friend.getAttribute("data-x"), "3");
  await game.locator(".kitchen-room").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await friend.getAttribute("data-x"), "4", "The Friend moves to the order computer");
  assert.equal(await game.locator("[data-order]").count(), 1);
  const crowd = await game.locator(".customer").count();
  assert.ok(crowd === 2 || crowd === 3 || crowd === 5, `A wave should be 2, 3, or 5 customers, got ${crowd}`);
  const orderName = await game.locator("[data-order]").getAttribute("data-order");
  const order = RECIPES.find(recipe => recipe.name === orderName);
  assert.ok(order, `Unknown order ${orderName}`);
  await button("Menu book").click();
  const recipeLine = order.ingredients.map(id => INGREDIENTS.find(ingredient => ingredient.id === id).name).join(", ");
  await game.getByRole("cell", { name: recipeLine, exact: true }).waitFor();
  await button("Close Menu book").click();
  if (width < 500) {
    await button("Refrigerator").click();
    assert.equal(await friend.getAttribute("data-x"), "0", "Tapping the refrigerator moves the Friend");
  } else {
    await button("Refrigerator").click();
  }
  for (const id of order.ingredients) {
    const item = INGREDIENTS.find(ingredient => ingredient.id === id);
    await button(`Add ${item.name}`).click();
  }
  await button("Close Refrigerator").click();
  await button("Prep counter").click();
  await game.getByText("The recipe is only in the menu book.", { exact: false }).waitFor();
  for (const id of order.ingredients) {
    const item = INGREDIENTS.find(ingredient => ingredient.id === id);
    await button(`Use ${item.name}`).click();
  }
  await button("Finish the dish").click();
  const paid = servePay(order.name, order.name, "fresh");
  await game.getByText(`The customer paid ${rf(paid.amount)}.`, { exact: true }).waitFor();
  await game.getByText("Prepared correctly.", { exact: true }).waitFor();
  const base = BigInt(await game.locator("[data-base]").getAttribute("data-base"));
  assert.equal(base, paid.amount);
  const tipNode = game.locator("[data-tip]");
  const tip = await tipNode.count() ? BigInt(await tipNode.getAttribute("data-tip")) : 0n;
  await button("Next customer").click();

  await button("Order computer").click();
  const restockId = order.ingredients[0];
  const restock = INGREDIENTS.find(ingredient => ingredient.id === restockId);
  await button(`Buy ${restock.name} · ${rf(priceOf(restockId))}`).click();
  await game.getByText(`One ${restock.name} is in the refrigerator.`, { exact: true }).waitFor();
  await button("Close Order computer").click();
  const left = rf(base + tip - priceOf(restockId)).replaceAll(".", "\\.");
  assert.match(await game.locator(".kitchen-hud").textContent(), new RegExp(`Cash ${left}`));

  await button("Settings").click();
  assert.equal(await game.getByLabel("Reduce motion").isChecked(), true);
  await button("Sound on").click();
  await button("Sound off").waitFor();
  await button("Sound off").click();
  await button("Sound on").waitFor();
  await game.getByLabel("Reduce motion").uncheck();
  assert.equal(await game.getByLabel("Reduce motion").isChecked(), false);
  await button("Close Settings").click();
}

for (const width of [1100, 360]) {
  await testGame(gameDirectory, {
    width,
    height: 800,
    check: session => playKitchen({ ...session, width }),
  });
  console.log(`PASS Friend's Kitchen ${width}px: gather, serve, customer pay, restock, keyboard${width < 500 ? "/touch" : ""}, mute, reduced motion.`);
}
