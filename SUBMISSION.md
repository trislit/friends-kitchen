# Submission: Friend's Kitchen

**Project name**
Friend's Kitchen

**Builder / contact**
Trislit · [@trislit](https://github.com/trislit)

**Category**
Economy Potential

**What did you build?**
An over-the-shoulder kitchen. Your Rare Friend cooks for customers who arrive in waves, including an occasional lunch rush. You plate dishes at a prep table, carry them to a shop counter, and spend the RF they pay on ingredients and counter gear. A wrong or slow plate pays too little to restock, so the kitchen only stays open if you keep spending well.

**How does it use Rare Friends and $RAREFRIENDS?**
You play as your own hardwired Generations NFT. The SDK checks ownership and draws that Friend with its original artwork.

The preview till is simulated, as the vibeathon asks for an MVP. Nothing is burned and no wallet is charged. The loop is still an RF spend loop:

- The fridge starts with one of each ingredient and 0 RF. After that first plate, every restock is a purchase.
- Bread, butter, tea, and vegetables cost 0.50 RF. Broth, noodles, spice, and rice cost 1 RF.
- A correct fresh dish pays its full tab, from 1 RF for Toast to 12 RF for the Signature Special. Served correctly and fresh, the average order is 2.52 RF.
- A wrong plate pays a quarter of the tab. Toast's bread and butter cost 1 RF to replace and a wrong Toast pays 0.25 RF, so a bad plate can leave a dish you can no longer cook.
- A dish pays half from 45 seconds on the pass and nothing after 75 seconds.
- A heat lamp costs 2 RF, up to two. Each one adds 30 seconds before a dish turns and before it spoils.
- A tip jar costs 2 RF, once. It raises a quick correct tip from 45% to 60%, and a late tip from 15% to 25%.

That is the promotion: RF is what keeps the cafe open. You earn it by serving your Friend's customers, then you spend it on food and gear. Holding it does nothing. Spending it is the game.

In a live version, those same prices would spend RF from the player's wallet or the Friend's wallet. Ingredient orders, heat lamps, and the tip jar are the natural fee events. Following the protocol split, half of each purchase can burn and half can fund rewards, so kitchen traffic pays active Friends. Dish tabs can pay the cooking Friend's own wallet. The preview does not do that. Token Activity is not claimed. Organizers have not said how simulated spending will be scored for that category.

**Source code**
This project, FriendSDK v0.1.4. A public repository is not published yet.

**Playable demo / how to run**
A hosted preview is not published yet. With Node.js 22+:

```sh
npm ci
npm run dev
```

Open the printed URL, normally `http://127.0.0.1:4173`. You need a browser wallet holding a hardwired Generations NFT, generation 1 or higher, on Robinhood mainnet (chain 4663). No RF funding or transaction signature is needed for the preview.

**How do you play?**
Left and right, or A and D, move between the refrigerator, prep table, menu book, serving counter, and order computer. E, Up, or a tap uses the station. Customers come in groups of 2 or 3. About one wave in five is a lunch rush of 5. After a group leaves, the counter stays quiet for 20, 28, or 36 seconds. Each customer has a name, calls out a dish, and keeps their own timer. A finished dish that matches an order is handed to that person. The order computer sells ingredients, heat lamps, and the tip jar from the till.

**Costs and rewards**
All of the amounts above are simulated and labeled in the game. Customer payments depend on the plate, not on a chance roll. The `game.json` supply crate is the SDK chance-game shell. Service does not buy that crate.

**What have you tested?**
`npm test`, `npm run typecheck`, `npm run check:games`, and `npm run check:browser` pass. Browser checks cover a desktop width and a phone width with the SDK's mocked wallet, including cook, serve, pay, restock, mute, and reduced motion. A real-wallet playthrough is still outstanding.

**Known limitations**
Progress resets when the session ends. No live contracts, burns, trading, wearable NFTs, or creator fees. The public repo and hosted preview still need to be added before this letter can be filed. Production publication needs a separate Rare Friends review.

**Credits**
Kitchen surfaces, customers, the notebook, the computer, the counters, and the music loop are original. The Friend uses canonical Generations sprites. Cue sounds are the FriendSDK v0.1.4 kit. See `NOTICE.md`.
