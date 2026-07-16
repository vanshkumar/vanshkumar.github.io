# Coffee Rush Functionality Checklist

Created from the local how-to-play video pass and focused on 2-4 player hot-seat play.

## Setup

- [x] Select 2, 3, or 4 players.
- [x] Choose any player as the starting player.
- [x] Deal each player orders into Tab 1 and Tab 2.
- [x] Deal the starting player one extra Tab 1 order.
- [x] Use two baristas per player in a 2-player game and one barista per player in 3-4 player games.
- [x] Run starting placement before the first turn.
- [x] Starting placement proceeds from the player to the starting player's right, counter-clockwise, with the starting player last.
- [x] In 2-player games, each player places both baristas one at a time.
- [x] A starting barista can only be placed on an open ingredient space.
- [x] The ingredient from a starting barista's space is added to the player's chosen cup.

## Turn Flow

- [x] A turn starts with an optional upgrade activation.
- [x] Activating an upgrade costs 3 completed orders.
- [x] Only one upgrade can be activated at the start of a turn.
- [x] A player may skip upgrades and move.
- [x] A chosen barista moves 1-3 orthogonal spaces by default.
- [x] Rush tokens add movement steps.
- [x] A move may pass through occupied spaces.
- [x] A move may not end on an occupied space.
- [x] Movement collects the ingredient on every entered space.
- [x] Diagonal movement is available after the diagonal upgrade.

## Pouring And Cups

- [x] Collected ingredients must be poured or discarded before ending the turn.
- [x] Players choose which of their three cups receives each collected ingredient.
- [x] Cups hold at most 4 ingredients.
- [x] A cup can be dumped during the pour phase.
- [x] A completed order empties the matching cup.

## Orders

- [x] Orders require an exact cup recipe match.
- [x] Multiple orders can be completed in the same turn if cups match.
- [x] Specialty orders grant 1 Rush token when completed.
- [x] Completing orders triggers catch-up order draws for the next players.
- [x] In 2-player games, the other player receives catch-up orders.
- [x] In 3-4 player games, the next two players receive catch-up orders.

## Flow Of Time

- [x] At end of turn, the active player's visible orders slide down one tab.
- [x] Orders falling from Tab 4 become penalties.
- [x] Newly gained penalties grant Rush tokens.
- [x] In 2-player games, the active player draws one fresh Tab 1 order after time flows.

## Endgame And Scoring

- [x] House rule: deck exhaustion does not trigger the end; empty draws are no-ops.
- [x] The game end is triggered when a player reaches 5 penalties.
- [x] The final turn is assigned so players receive a fair closing turn.
- [x] Scoring is completed orders + 2 per active upgrade - penalties.
- [x] Ties break by completed orders, then Rush tokens.
- [x] True ties are shared wins.

## Hot-Seat UX

- [x] Current player, deck count, phase, cups, tabs, upgrades, penalties, and Rush are visible.
- [x] Pass-device modal appears between normal turns.
- [x] Saved games can be resumed from local storage.
- [x] New game clears the active saved game.
- [x] Results screen supports rematch flow.
- [x] Layout is usable on desktop and mobile widths.
