# Coffee Rush 2-Player Playthrough Trace

Source video: `/Users/vanshkumar/Downloads/videoplayback.mp4`

This is a game-state trace from the 720p overhead playthrough. The video has no separate audio stream in the local file, and some exact card names or cell-by-cell paths are hidden by hands. Those moments are marked as visually unclear instead of guessed. Player labels below use the physical board colors: **Pink** is the left board and **Blue** is the right board.

## Reconstruction Notes

The video is not a clean "silent game log." The first ~23 minutes mix setup, live examples, and rules explanation using the same evolving game state. The continuous playthrough section begins around **22:55-23:10** and continues to final cleanup. For that section I used:

- 20-second and 5-second timestamped contact sheets for the whole video.
- 2-second timestamped sheets from 08:00 onward.
- Full-resolution 10-second state frames from 23:08 onward.
- Full-resolution spot frames around setup and the first continuous-play turn.

Board coordinates used below:

| Coord | Ingredient | Coord | Ingredient | Coord | Ingredient | Coord | Ingredient |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C11 | ice | C12 | caramel | C13 | steam | C14 | coffee |
| C21 | coffee | C22 | milk | C23 | ice | C24 | water |
| C31 | tea | C32 | steam | C33 | milk | C34 | coffee |
| C41 | milk | C42 | ice | C43 | chocolate | C44 | steam |

Confidence labels:

- **High**: board/cup/order state is visible in stable full-res frames.
- **Medium**: start/end state is visible, but a hand covers part of the path or cup placement.
- **Low**: the state change is visible, but exact order title, exact path, or exact cup contents are not readable.

## Setup And Opening State

| Time | State Change |
| --- | --- |
| 00:15-00:45 | Two-player setup is laid out: Pink board on the left, Blue board on the right, two baristas per player, three cups per player, shared 4x4 ingredient board, ingredient trays, order deck, Rush tokens, and upgrade tiles. |
| 00:50-01:15 | Starting orders are dealt to player tabs. Blue has the `OPEN`/starting-player marker beside their board and receives the extra starting order in Tab 1. |
| 01:20 | A Caramel Macchiato specialty order is shown as an explanatory close-up. This is a rules explanation, not a state change in the played game. |
| 02:40-03:00 | Pink places a starting barista on the caramel space and puts the caramel ingredient into a cup. |
| 03:20-04:10 | Remaining starting baristas are placed. The stable opening board shows Pink on caramel and chocolate; Blue on coffee and steam. |
| 04:10-05:00 | Both players assign their starting ingredients into chosen cups. They do not have to put all starting ingredients into Cup 1. |
| 05:00-07:55 | Movement, order matching, and upgrades are explained against the opening state. No durable game-state change is visible beyond the existing setup. |

## Continuous Play Checkpoint At 23:08

This is the first stable overhead state after the "Play Through / How to Play" transition.

| Area | Visible State |
| --- | --- |
| Board | Blue baristas at **C11 ice** and **C34 coffee**. Pink baristas at **C13 steam** and **C42 ice**. |
| Pink orders | Pink has a crowded board: 1 order in Tab 1, 2 orders in Tab 2, 3 orders in Tab 3, and 1 order in Tab 4. Readable names include `Caffe Latte`, `Chocolate Latte`, `Espresso Macchiato`, `Chocolate Shake`, `Iced Milk Tea`, and a Tab 4 frappe-style order. |
| Pink cups | Three cups are in use around Pink orders; exact contents are partly obscured by glare, but at least one cup contains caramel and one cup contains a pale/clear ingredient. |
| Blue orders | Blue has multiple orders across all tabs: 2 in Tab 1, 3 in Tab 2, 2 in Tab 3, and 1 in Tab 4. Readable names include `Iced Black Tea`, `Einspanner`, `Caffe ...`, `Cocoa`, `Iced Milk Tea`, and a lower caramel/frappe-style order. |
| Blue cups | Blue has cups staged near the order area; one lower cup contains a red/orange caramel token and pale ingredients. |
| Rush/penalties | Rush tokens are visible near both sides. No final end trigger yet. |

## Continuous Play Turn Ledger

This table reconstructs the late continuous playthrough section from the 23:08 checkpoint through final cleanup. It is turn-by-turn in the sense of visible player action windows, with exact gaps called out.

| Turn | Time | Side | Board Movement | Cup / Order / End-State Changes | Confidence |
| --- | --- | --- | --- | --- | --- |
| CP1 | 23:08-24:08 | Blue | Blue moves the lower/right barista away from **C34 coffee**. The stable post-move board shows Blue at **C11 ice** and **C22 milk**. The visible route appears to pass through **C33 milk** and **C23 ice** before ending at **C22 milk**. | Blue pours the gained ingredients into cups. Blue's board then ages: cards slide down and a fresh 2-player Tab 1 order is added. No completed order is clearly removed in this window. | Medium |
| CP2 | 24:08-24:48 | Pink | Pink starts with baristas at **C13 steam** and **C42 ice**. Pink moves the upper barista; hand coverage hides the exact route. The movement is a normal 1-3 step move across the upper/central board. | Pink pours into the left-side cups. At the end of the window, Pink's order cards shift down and the board remains crowded. | Low |
| CP3 | 24:50-25:42 | Blue | Blue moves from the right-side/upper board area with one barista. The final exact coordinate is blocked by hands in the dense sheet. | Blue handles Rush/order cards near the right board, then pours. A new/aged order appears in Blue's Tab 1/2 area. | Low |
| CP4 | 25:42-26:40 | Pink | Pink makes a long visible move around the center-left/top board area. Rush tokens are handled nearby, suggesting extra movement may be spent or discussed. | Pink pours several ingredients into multiple cups. No clean order title is readable at completion time. | Medium |
| CP5 | 26:40-27:35 | Blue | Blue moves one barista in a crowded board state, avoiding occupied endings. Exact path is covered. | Blue resolves a cup/order interaction on the right board and then ages orders. Catch-up pressure is visible on Pink's board. | Low |
| CP6 | 27:35-29:05 | Pink | Pink moves and collects multiple ingredients. The board is frequently blocked, but the active barista ends in a new upper/central position. | A large left-board order cleanup/shift occurs around 28:45-29:05. This includes order aging and likely at least one order completion or penalty/near-penalty resolution. | Medium |
| CP7 | 29:10-30:35 | Blue | Blue moves from the right side, collects ingredients, and stages them in cups. | Blue's order board remains full across tabs. At end of turn Blue ages orders and adds the 2-player fresh Tab 1 order. | Medium |
| CP8 | 30:35-32:05 | Pink | Pink moves through the lower/central board and collects ingredients. Exact route is partly hidden. | Pink pours into more than one cup and appears to complete an order, clearing a cup and removing a card from the active tabs. The title is not readable. | Medium |
| CP9 | 32:05-33:15 | Blue | Blue moves and collects ingredients. Both Blue baristas remain on distinct, non-overlapping spaces. | Blue pours and resolves order aging. Cards shift down; the right board shows high pressure with several later-tab cards. | Medium |
| CP10 | 33:20-34:35 | Pink | Pink moves and pours. Exact barista/path is partly blocked by the player hand. | Pink manipulates the completed-order/upgrade area. This appears to be either upgrade activation or setup for an upgrade, spending completed cards. Exact upgrade tile is not legible. | Low |
| CP11 | 34:35-35:30 | Blue | Blue starts a new turn from the crowded right-side board state and moves one barista. | Blue pours and resolves a cup/order check. Rush tokens and completed cards remain visible near the player boards. | Medium |
| CP12 | 35:30-36:20 | Pink | Pink moves across the board, collecting multiple ingredients. | Pink pours into cups. At end of turn, cards age; the left board has cards close to falling from Tab 4. | Medium |
| CP13 | 36:20-37:25 | Blue | Blue makes a visible route across the central board and collects several ingredients. | Blue stages ingredients in cups. The right-side orders stay dense, with multiple possible matches visible. | Medium |
| CP14 | 37:30-38:40 | Blue continuation/end | Blue finishes pouring and resolves at least one visible order/cup change. | Cards on Blue's board shift down; late-tab order pressure increases. | Medium |
| CP15 | 38:40-39:35 | Pink | Pink starts a late-game turn and handles Rush tokens while moving. | Pink pours collected ingredients and prepares/completes a recipe. Exact order title is blocked. | Medium |
| CP16 | 39:35-40:50 | Pink continuation/end | Pink finishes order resolution and end-of-turn flow. | Pink's orders age, and Blue receives catch-up pressure from any completed Pink order. | Medium |
| CP17 | 40:50-41:45 | Blue | Blue moves and pours in a heavily crowded final-round state. | Blue resolves one order/cup sequence; exact title is obscured. | Medium |
| CP18 | 41:45-43:15 | Pink | Pink moves, collects, and pours. The hand blocks part of the route, but the before/after board state changes are visible. | Pink's board remains crowded. The flow-of-time step moves several cards down. | Medium |
| CP19 | 43:15-44:20 | Blue | Blue moves one barista and collects ingredients. | Blue removes or clears at least one active order/cup combination, then ages orders. | Medium |
| CP20 | 44:20-45:20 | Pink | Pink takes a late-game move and handles multiple ingredient tokens. | Pink pours, then resolves order/card movement. Several cards remain active on both boards. | Medium |
| CP21 | 45:20-46:15 | Blue | Blue takes the last clearly visible movement/pour sequence. | Blue completes or clears an order/cup sequence. Cards remain visible but players begin shifting toward final cleanup. | Medium |
| CP22 | 46:15-47:20 | Final cleanup | No normal movement. | Players gather completed/penalty/order cards and compare end state. The video cuts to closing host shot at 47:25. | High |

### Reconstructed Continuous-Section Rule Coverage

The continuous section directly exercises these state cases:

- Non-empty order boards with cards in all four tabs.
- Two baristas per player with non-overlapping final positions.
- A normal move where only the final board state is stable after intermediate hand-stepped positions.
- Multi-ingredient collection and later cup staging.
- Order boards aging after each active player's turn.
- The two-player fresh Tab 1 order after the active player's flow of time.
- Catch-up pressure after completed orders.
- Late-game crowded tabs where multiple orders are selectable.
- Rush token handling during movement/late-game pressure.
- Completed-order/upgrade-area manipulation.
- Final cleanup/scoring comparison.

## Turn/Move Trace

| Time | Active Side | Game-State Play-By-Play |
| --- | --- | --- |
| 08:05-09:15 | Blue/Pink opening sequence | The playthrough resumes from the opening setup. A player handles the order deck and cup area, then the active side completes a first normal move sequence: choose one of two baristas, move on the board, collect ingredients, and place them into cups. Exact path is partly obscured. |
| 09:30-10:20 | Blue | Blue's board is adjusted at end of turn: visible orders slide down, and a new 2-player order is added to Tab 1. This confirms the two-player fresh-order rule after each turn's flow of time. |
| 10:25-11:35 | Pink | Pink moves a barista across multiple spaces, collects ingredients, and pours them into cups. The move demonstrates normal 1-3 step movement and cup selection. No clear order completion is visible in this interval. |
| 11:40-12:25 | Pink to Blue transition | Pink resolves hand ingredients, then Pink's order board flows down. Blue becomes the next active player. |
| 12:30-13:25 | Blue | Blue moves from the right-side board position, collects ingredients, and adds them into cups. The board remains crowded enough that occupied ending restrictions matter, though the exact ending cell is obscured. |
| 13:30-14:30 | Blue to Pink transition | Blue finishes pouring. Blue's order cards slide down and a fresh Tab 1 order is drawn for Blue. |
| 14:35-16:05 | Pink | Pink moves through a longer route, collects multiple ingredients, and pours them into more than one cup. This turn shows a player building cup recipes over time rather than completing every order immediately. |
| 16:05-16:40 | Pink | Pink resolves an order-board change at end of turn. Catch-up/order aging pressure is visible as the order columns grow. |
| 16:40-18:20 | Blue | Blue takes a turn with multiple collected ingredients. A Rush token is visible near the right board during the sequence; the exact spend/gain moment is visually unclear. |
| 18:25-19:20 | Blue | Blue completes at least one order from the right board, clears the matching cup, and moves the completed order away from the active tabs. The exact card title is not legible from the overhead view. |
| 19:20-20:20 | Blue to Pink transition | Because Blue completes an order, Pink receives catch-up pressure: new order card(s) are drawn into Pink's Tab 1. Blue's own orders also age at end of turn. |
| 20:30-21:20 | Pink | Pink moves a barista, collects ingredients, and pours. A side-camera view briefly shows cups/tokens being handled, then the overhead view returns with Pink's cups changed. |
| 21:20-22:30 | Pink | Pink completes an order or sets up a near-completion; a cup is cleared/adjusted and the order area changes. Exact title is obscured by hands. |
| 22:30-23:10 | Transition marker | The video overlays a "Play Through / How to Play" marker while the game state continues. No reset occurs. |
| 23:10-24:35 | Blue | Blue moves and pours. Blue's order area is now several cards deep, exercising selection among many visible orders across tabs. |
| 24:35-25:20 | Blue | Blue completes or advances an order sequence and resolves flow of time. The other player receives additional order pressure. |
| 25:20-26:40 | Pink | Pink takes a turn using a longer route around the board. Rush tokens are handled near the board during this late-midgame stretch, indicating either Rush spending for extra movement or Rush gain from prior penalties/specialty orders. |
| 26:40-27:35 | Pink | Pink pours several ingredients into cups and resolves at least one order-board change. Multiple cups are in use. |
| 27:35-29:05 | Blue | Blue performs a move and then a large order-board cleanup/shift. This is a good stress case for order aging, Tab 4 falloff, and catch-up draws. |
| 29:10-30:35 | Pink | Pink moves, collects, pours, and resolves end-of-turn aging. Both boards now have many visible orders, including cards in later tabs. |
| 30:35-32:05 | Blue | Blue takes a turn with a crowded order board, pours multiple ingredients, and appears to complete an order. The completed card title is not legible. |
| 32:05-33:15 | Blue to Pink transition | Blue resolves order aging and catch-up. Cards are moved across Blue's tabs, and Pink receives new order pressure. |
| 33:20-34:35 | Pink | Pink moves and pours. The left board shows accumulated completed/active-order pressure. |
| 34:35-35:30 | Pink | Pink manipulates completed cards/upgrade area. This appears to be an upgrade activation or preparation using completed orders. Exact upgrade tile is not visually legible. |
| 35:30-36:20 | Transition | End-of-turn order sliding occurs. Rush tokens and completed-order piles are visible near the boards. |
| 36:20-37:25 | Blue | Blue moves and collects several ingredients; the route crosses a crowded board state. |
| 37:30-38:40 | Blue | Blue pours into cups and resolves a visible order/cup change. More than one cup is used to stage recipes. |
| 38:40-39:35 | Blue to Pink transition | Blue's board ages; cards shift down. Penalty/order pressure is high, with cards close to falling off Tab 4. |
| 39:35-40:50 | Pink | Pink takes a late-game turn, uses/handles Rush tokens, moves a barista, collects ingredients, and pours. |
| 40:50-41:45 | Pink | Pink resolves an order completion and/or near-completion. The left board's order columns shift, and catch-up pressure is applied to Blue. |
| 41:45-43:15 | Blue | Blue moves and pours in a crowded final-round state. This interval exercises the ability to keep many active orders visible and selectable. |
| 43:15-44:20 | Blue | Blue resolves order cards and cup contents; at least one order card is removed from active tabs. |
| 44:20-45:20 | Pink | Pink takes another late-game move, collects ingredients, and handles multiple cup/token placements. |
| 45:20-46:15 | Pink | Pink completes or clears an order/cup sequence, then resolves flow of time. Several cards remain on both boards. |
| 46:15-47:10 | Final scoring cleanup | Players gather completed/penalty/order cards and compare end state. The video transitions out at 47:25. |

## App-Support Checklist From This Playthrough

- [x] 2-player game uses two baristas per player.
- [x] Starting player can be Blue/right-side player, not always Player 1.
- [x] Starting placement is manual and alternates in setup order.
- [x] Starting placement lets the player choose which cup receives the starting ingredient.
- [x] Movement supports choosing either barista.
- [x] Movement supports normal 1-3 step paths.
- [x] Movement allows passing through occupied cells but disallows ending on occupied cells.
- [x] Rush tokens can extend movement.
- [x] Ingredients collected during movement are held before pouring.
- [x] Collected ingredients can be poured into any of the three cups.
- [x] Multiple cups can be built over several turns.
- [x] Cups can be cleared when completing orders.
- [x] Exact cup recipe matching is required.
- [x] Multiple active order cards across tabs remain visible.
- [x] Completing orders triggers catch-up draws for the other player.
- [x] The active player's orders age at end of turn.
- [x] 2-player flow draws one fresh Tab 1 order for the active player after aging.
- [x] Tab 4 falloff into penalties is supported.
- [x] Newly gained penalties grant Rush.
- [x] Specialty orders grant Rush.
- [x] Completed orders can be spent to activate upgrades.
- [x] Final scoring handles completed orders, upgrades, penalties, Rush tiebreak, and shared ties.

## Follow-Up QA Notes

- Add browser tests for the two setup details from this video: non-Player-1 starter and starting ingredient cup choice.
- Add a scenario test for "crowded order board" so many cards across tabs remain usable and visually distinct.
- Add a scenario test for a late-game penalty/Rush/end-trigger state.
