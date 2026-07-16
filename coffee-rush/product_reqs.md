# Coffee Rush Product Requirements

This document is the implementation reference for the local web adaptation. It
summarizes functional rules only; do not copy published artwork, layout, or
card prose into the app.

## Sources

- Local official base-game rulebook: `coffee-rush/Web_Coffee_Rush_Rulebook_EN.pdf`
- Board Game Arena rules summary: https://en.boardgamearena.com/gamepanel?game=coffeerush
- BoardGameGeek reference page: https://boardgamegeek.com/boardgame/377061/coffee-rush
- Order deck transcription aid: Board Game Arena public card sprite, release `250805-1212`

## Scope

- 2-4 players.
- v1 is hot-seat pass-and-play on one device.
- No networking, bots, or expansion content.
- Faithful base-game rules with original web UI assets.

## Components To Model

- Ingredient board: 4x4 grid. See `data/boardLayout.csv`.
- Ingredients: coffee beans, steam, milk, water, ice, chocolate, caramel, tea.
- Per player: 1 player board, 3 cups, 4 upgrade tiles.
- 2-player mode: each player has 2 meeples and chooses exactly 1 meeple to move per turn.
- Order deck: 80 cards. See `data/orderDeck.csv`.
- Rush tokens.
- Starting player token with open/closed state.

## Setup

For 3-4 players:

1. Shuffle all 80 order cards.
2. Each player receives one order on tab 1 and one order on tab 2.
3. The starting player receives one additional order on tab 1.
4. Beginning with the player to the starting player's right and proceeding
   counter-clockwise, each player places one meeple on an empty board cell and
   immediately gains that cell's ingredient into a cup.

For 2 players:

1. Use only the red and blue player colors in the physical game; the web app may
   let users choose labels/colors as long as there are two player seats.
2. Each player has two meeples.
3. Starting with the non-starting player, players alternate placing meeples until
   all four meeples are placed.
4. Meeples cannot be placed on a cell with any other meeple, including the
   owner's other meeple.
5. Starting orders are the same as 3-4 player setup.

Web setup shortcut: the ingredient gained from each player's first meeple
placement goes automatically into Cup 1. In a 2-player game, the player still
chooses a cup for the ingredient gained from their second meeple placement.

## Turn Sequence

Each turn proceeds in this order:

1. Activate upgrades.
2. Move.
3. Pour ingredients.
4. Process orders.
5. Flow of time.
6. Check for game end.

## Activate Upgrades

- Optional at the beginning of the turn.
- Spend exactly 3 completed order cards to activate one inactive upgrade tile.
- Activated upgrades remain active for the rest of the game.
- Activated upgrades are worth +2 rating at game end.
- Upgrade effects can stack. See `data/upgradeTiles.csv`.

## Move

- In 2-player games, choose one of the active player's two meeples before moving.
- A move path may contain 1-3 steps, plus 1 extra step per spent Rush token.
- Each step normally moves orthogonally to an adjacent cell.
- The diagonal movement upgrade allows diagonal steps.
- The player gains the ingredient from each cell entered.
- The same cell may be entered more than once in a turn.
- The player may pass through a cell containing another meeple and still collect
  that cell's ingredient.
- The player may not end movement on a cell containing any meeple.
- The player may stop early, including on the cell where movement began if the
  path loops back legally.

## Pour Ingredients

- Ingredients collected this turn may be placed into any of the player's cups or
  returned to supply.
- A cup can hold at most 4 ingredients.
- Ingredients already in a cup cannot be moved to another cup.
- The player may empty any number of their cups during this phase; all
  ingredients in emptied cups return to supply.
- Unplaced ingredients are discarded at the end of this phase.

## Process Orders

- A cup completes an order when its contents exactly match an order card on the
  active player's tabs.
- On completion, return the cup's ingredients to supply and move the order card
  to the player's completed pile.
- Completing a Specialty Menu order grants 1 Rush token.
- Count the number of orders completed this turn.
- In 3-4 player games, the next two players clockwise each draw that many order
  cards onto tab 1. The player immediately to the active player's left draws all
  required cards before the next player draws theirs.
- In 2-player games, the other player draws that many order cards onto tab 1.
- If the deck runs out while distributing these cards, distribute all available
  cards in the normal recipient order. Later draws from the empty deck do
  nothing.

## Flow Of Time

- Move all order cards on the active player's board down one tab.
- Cards on tab 1 move to tab 2, tab 2 to tab 3, and tab 3 to tab 4.
- Cards leaving tab 4 become penalty cards.
- When penalty cards are gained, the player gains Rush tokens equal to the
  number of penalty cards just gained.
- If the active player has 5 or more total penalties, flip the starting player
  token to closed.
- 2-player exception: after sliding cards, add 1 order card to the active
  player's tab 1 before finishing the turn. If the deck is empty, no card is
  added.

## End Game

- House rule: unlike the physical rulebook, deck exhaustion does not end the
  game. The starting player token flips to closed only when a player reaches 5
  penalties.
- In 3-4 player games, once the token is closed, continue until the player to the
  starting player's right finishes their turn; then end the game.
- In 2-player games, if the starting player triggers the end, the other player
  gets one final turn. If the non-starting player triggers the end, the game ends
  immediately.

## Scoring

- +1 rating per completed order.
- +2 rating per activated upgrade.
- -1 rating per penalty.
- Tiebreak 1: most completed orders.
- Tiebreak 2: most Rush tokens.
- If still tied, tied players share the win.

## Optional Rule

The base rulebook includes a less-luck setup variant involving Ristretto and
Espresso cards. Do not ship it in v1 unless explicitly selected during setup.
