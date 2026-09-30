# Friend's Kitchen

Your Rare Friend runs a kitchen: a line of customers orders, you finish dishes on the prep counter, and you carry them to service before they spoil.

**Builder:** [Trislit / @trislit](https://github.com/trislit) · **Category:** Economy Potential · **SDK:** FriendSDK v0.1.4

You play as your own Generations NFT, using its original character artwork. Connect a wallet, choose your Friend, and cook. Supply orders spend simulated $RAREFRIENDS. Customer payments are simulated and depend on whether the dish was made correctly. [Menu](game/game.json) · [Asset notices](NOTICE.md)

## Run it

Use Node.js 22+ and a browser wallet holding a hardwired Rare Friends Generations NFT (generation ≥ 1) on Robinhood mainnet (chain 4663).

```sh
npm ci
npm run dev
```

Open the printed URL (normally `http://127.0.0.1:4173`), connect your wallet, and select your Friend. The SDK verifies ownership before play. No RF funding or transaction signature is needed for this simulated preview.

Source: [github.com/trislit/friends-kitchen](https://github.com/trislit/friends-kitchen). Playable preview: [trislit.github.io/friends-kitchen](https://trislit.github.io/friends-kitchen/).

## Play

You look over your Friend's shoulder. They stand behind the counters, facing the room. Customers come in waves. Most groups are two or three people. About one wave in five is a lunch rush of five. After a group clears, the counter stays quiet for a short stretch before the next one walks in. They sway, call out a dish, and each keeps a different timer. They encourage you at first. The bar turns red and the complaints start if you take too long. Then they say they're out and leave. Each one has a name, with the order listed under it. A finished dish that matches an order is handed to that person. Move with the left and right arrow keys, A and D, or tap a station. Press E or Up, or tap the station, to use it.

The **menu book** lists every recipe. The **prep counter** on the left does not. Set out as many ingredients as you want, then choose which ones go into each dish. You can have more than one dish going, and leftovers stay on the counter. Finish a dish only when its ingredients match a recipe. If someone ordered it, it goes to them. Anything else waits on the **serving counter**. A fresh match pays the full simulated tab. A different dish pays one quarter. A quick correct plate often gets a tip of half the tab, and any paying customer can tip a quarter of the tab on a whim. After 45 seconds on the pass the pay is cut in half, and after 75 seconds the dish is spoiled and pays nothing. The **order computer** sells ingredients one at a time, and only for that cash. You can buy as many of each as you can afford. The same till buys counter gear: a heat lamp for 2 RF, up to two, each adding 30 seconds before a dish turns and before it spoils, and a tip jar for 2 RF that makes tips more common.

Sound starts on, with a quiet original loop under the kitchen cues. Walking between stations, plating, a finished dish, a correct serve, a tip, a walk-out, and a purchase each play a FriendSDK cue. Settings mutes the loop and the cues together, and reduced motion is there too. Everything stays inside the SDK's 960 × 640 container.

## Rules and rewards

**All dish payments and ingredient orders are simulated.** Cash starts at 0 RF. The refrigerator starts with one of each ingredient, enough for the first order. After that, replacements are bought from cash customers have already paid. There is no stock limit.

Customer payments are not a chance roll. The weights below are how often that dish is ordered. The RF amount is the full tab for a fresh match. A different dish pays that amount divided by 4, rounded down. From 45 seconds to 75 seconds on the pass, that pay is halved. After 75 seconds the dish is spoiled and pays nothing. Each heat lamp adds 30 seconds to both marks. The tip jar raises the fast-tip chance from 45% to 60% and the lucky-tip chance from 15% to 25%.

| Dish | How often | Ingredients | Full tab | Wrong plate |
|---|---:|---|---:|---:|
| Toast | 28% | Bread, butter | 1 RF | 0.25 RF |
| Garden Tea | 22% | Tea | 1.50 RF | 0.375 RF |
| Miso Soup | 16% | Broth, vegetables | 2 RF | 0.50 RF |
| Friend Sandwich | 12% | Bread, butter, vegetables | 3 RF | 0.75 RF |
| Night Noodles | 10% | Noodles, broth | 4 RF | 1 RF |
| Curry | 7% | Rice, vegetables, spice | 5 RF | 1.25 RF |
| Banquet | 3% | Bread, broth, noodles, vegetables, rice | 8 RF | 2 RF |
| Signature Special | 2% | One of every ingredient | 12 RF | 3 RF |

If every order were plated correctly and served fresh, the average full tab would be **2.52 RF**. A wrong fresh plate pays a quarter, which is often less than replacing the ingredients it used.

| Ingredient | Price for one |
|---|---:|
| Bread, butter, tea, vegetables | 0.50 RF |
| Broth, noodles, spice, rice | 1 RF |

Example: Toast uses bread and butter (1 RF together) and pays 1 RF when correct, or 0.25 RF when wrong. The wrong payment cannot buy either ingredient back. If you also run out of everything else, that dish waits until you can pay. Preview progress resets when the runtime session ends.

## Checks, credits, and limitations

Run `npm test`, `npm run typecheck`, `npm run check:games`, and `npm run build`. For desktop and mobile browser checks, run `npx playwright install chromium` then `npm run check:browser`.

The kitchen surfaces, customers, and ingredient markers are original CSS. The Friend uses canonical Generations sprites and the SDK sound kit. See [notices](NOTICE.md). No trading, wearable NFTs, creator fees, or live economy is included. Token Activity metrics are not claimed. Production publication needs a separate Rare Friends review.

Browser checks use the SDK's mocked wallet. A real-wallet playthrough is still outstanding. Ingredient orders do not send a preview purchase, because they spend dish cash rather than the SDK chance-game balance.
