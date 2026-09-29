# Friend's Kitchen

Your Rare Friend runs a kitchen: a line of customers orders, you finish dishes on the prep counter, and you carry them to service before they spoil.

**Builder:** [Trislit / @trislit](https://github.com/trislit) · **Category:** Character Spotlight · **SDK:** FriendSDK v0.1.4

You play as your own Generations NFT, using its original character artwork. The SDK runtime connects the wallet and checks that the selected Friend is a hardwired Generations NFT (generation ≥ 1) on Robinhood mainnet. Supply orders use the fixed preview client. Customer payments are decided in the kitchen, not by a chance roll. [Rules file](game.json) · [Notices](../NOTICE.md)

## Run it

From the project root, with Node.js 22+:

```sh
npm ci
npm run dev
```

Open the printed URL, normally `http://127.0.0.1:4173`. No RF funding or transaction signature is needed for the simulated preview. Players still need a browser wallet holding an eligible Friend.

## Play

You look over your Friend's shoulder from behind the counters. Left and right arrows, or A and D, move between the **refrigerator**, **prep counter**, **menu book**, **serving counter**, and **order computer**. E, Up, or a tap uses the station. Customers arrive in waves of 2 or 3. About 20% of waves are a lunch rush of 5. After the counter clears, it stays quiet for 20, 28, or 36 seconds. They sway, call out a dish, and each has a different patience, from 70 seconds to 160 seconds. They encourage you at first, complain when the wait runs long, then say they're out. Each customer has a name, and the order sits under that name. A finished dish that matches an order is handed to that person. The menu book has the recipes. The prep counter does not. Set out as many ingredients as you want, choose what goes into each dish, and finish more than one before you leave the counter. Carry each finished dish to the serving counter. A fresh matching dish pays the full simulated tab. A different dish pays one quarter. A dish left on the pass for 45 seconds pays half, and after 75 seconds it is spoiled and pays nothing. Each heat lamp, bought at the order computer for 2 RF, adds 30 seconds to both of those times. Two is the most. A tip jar, also 2 RF, makes a quick plate tip more often and gives a late plate more lucky tips. The order computer sells one ingredient at a time for that cash.

## Rules and rewards

**All dish payments and ingredient orders are simulated.** Cash starts at 0. The fridge starts with one of each ingredient. Bread, butter, tea, and vegetables cost 0.50 RF each. Broth, noodles, spice, and rice cost 1 RF each. You can buy any amount you can afford.

| Dish | How often | Full tab | Wrong plate |
|---|---:|---:|---:|
| Toast | 28% / 2,800 bps | 1 RF | 0.25 RF |
| Garden Tea | 22% / 2,200 bps | 1.50 RF | 0.375 RF |
| Miso Soup | 16% / 1,600 bps | 2 RF | 0.50 RF |
| Friend Sandwich | 12% / 1,200 bps | 3 RF | 0.75 RF |
| Night Noodles | 10% / 1,000 bps | 4 RF | 1 RF |
| Curry | 7% / 700 bps | 5 RF | 1.25 RF |
| Banquet | 3% / 300 bps | 8 RF | 2 RF |
| Signature Special | 2% / 200 bps | 12 RF | 3 RF |

The average full tab is **2.52 RF** (`2520000000000000000` base units) if every plate is correct and served fresh. A correct fresh plate served before the customer complains has a 45% chance of a tip worth half the tab, or 60% with the tip jar. A correct plate that is late or getting old has a 15% chance of a tip worth a quarter of what they paid, or 25% with the tip jar. Wrong plates, spoiled dishes, and walk-offs do not tip. A wrong dish pays the full tab divided by 4, rounded down. From 45 seconds to 75 seconds that amount is halved again. After 75 seconds the dish pays 0 RF. You can discard a spoiled dish from the serving counter. Replacing Toast's bread and butter costs 1 RF, and a wrong fresh Toast pays 0.25 RF, so a bad plate can leave you unable to restock.

## Credits and limitations

From the project root, `npm test`, `npm run typecheck`, `npm run check:games`, and `npm run check:browser` passed. Browser checks cover desktop and a phone-sized frame with a mocked wallet. A real-wallet playthrough is still outstanding.

Kitchen surfaces and customers are original CSS. The menu is a spiral notebook and the order station is a desktop computer. Generations sprites and the sound kit are from FriendSDK v0.1.4. Sound starts on: a quiet original music loop, select for movement and prep, a ready cue when a dish is finished, a reveal or reward when it is served, purchase when something is ordered, and an impact when someone walks out. Mute turns off the loop and the cues together. Progress resets when the session ends. No live contracts, trading, wearables, or creator fees.
