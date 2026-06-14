# Order Deck Source Notes

`orderDeck.csv` is a text-only transcription of the 80 base-game order card
instances.

## Provenance

- The official base-game rulebook in this folder states that the base game has
  80 order cards.
- The rulebook does not include a full card-by-card recipe catalogue.
- Public search did not surface a separate official deck list.
- The complete 80-card manifest was transcribed from Board Game Arena's public
  Coffee Rush card sprite for release `250805-1212`.

The sprite was used only as a reference. Do not commit that sprite or any
published card artwork to this repository.

## Ingredient Columns

- `coffee`: coffee beans
- `steam`: steam
- `milk`: milk
- `water`: water
- `ice`: ice
- `chocolate`: chocolate
- `caramel`: caramel
- `tea`: tea leaves

Each row is one physical/deck card instance, not one unique drink type. Duplicate
rows are intentional.

## Verification Status

The manifest count is 80, matching the base-game component count. Before
declaring the implementation fully production-faithful, compare the CSV against
a physical deck or a publisher-provided card list if one becomes available.
