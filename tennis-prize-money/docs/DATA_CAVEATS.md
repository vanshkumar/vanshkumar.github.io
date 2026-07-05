# Data Caveats

## Current Dataset

The active Task 3 dataset is a small sourced seed for 2025 Grand Slam men's singles prize money. It includes one row each for the Australian Open, Roland Garros, Wimbledon, and the US Open.

The seed does not include compatible tournament-level revenue, profit, or surplus. Those values remain unavailable rather than estimated. Prize-pool share of revenue and prize-pool share of profit/surplus therefore show unavailable for the active records.

Roland Garros and US Open rows are medium confidence in this seed:

- Roland Garros uses a secondary source because a clear official FFT/Roland Garros prize-money page was not found in this research pass.
- The US Open official prize-money URL was identified, but it did not expose parseable text to the crawler; values are cross-checked through a secondary page citing the official source.

## Semantic Distinctions

Prize money, revenue, profit, surplus, expenses, and unavailable values are different concepts and must not be collapsed into a generic "money" field in user-facing logic.

- Prize pool is the tournament/event prize-money pool represented by the normalized record.
- Winner and runner-up payouts are payout rows and may be per player, per team, or total allocation.
- Revenue must describe a compatible tournament-level or event-level financial denominator before prize-pool share is computed.
- Profit/surplus must describe compatible tournament-level profit or surplus before prize-pool share is computed.
- Organizer-level revenue/profit/surplus can be useful context, but it is not automatically comparable to a single tournament/event prize pool.
- Expenses are not profit or surplus denominators.
- Unknown and unavailable values should remain visible as unavailable rather than guessed.

For Task 3 records, the prize pool is the men's singles event allocation, not total tournament prize money across singles, doubles, mixed doubles, wheelchair, qualifying, per diems, or player support.

## Currency Caveats

The app does not do currency conversion yet. A ratio is computed only when numerator and denominator currencies match exactly. If later tasks need cross-currency comparisons, they should add explicit FX source metadata, conversion dates, and tests.

## Profit And Surplus Caveats

Prize pool / profit or surplus is unavailable when profit/surplus is missing, zero, negative, semantically incompatible, or in another currency. Negative and zero denominators are shown as unavailable because a percentage would be misleading for this dashboard.

## Round Payout Caveats

Round payout percentages compare each published round payout to the record's total prize pool only when currencies match. They should not be interpreted as the total share of the entire draw unless the allocation basis and draw counts are also modeled.

Doubles payouts may be per team while singles payouts are usually per player. The `allocation` field must remain visible where payout rows are shown.

Task 3 test fixtures validate the singles prize-pool rows by weighting round payouts across the 128-player main draw. This is still not a replacement for richer draw-size modeling in the app UI.

## Source Confidence Caveats

Confidence describes source trust and data clarity, not truth in isolation.

- `high`: official or audited source with clear semantics.
- `medium`: reputable source or official source with some ambiguity.
- `low`: usable but limited source, likely with caveats.
- `mock`: fictional sample data only.

Task 3 should prefer official tournament pages, annual reports, Form 990s, official financial statements, and official press releases. Secondary sources should be clearly labeled with lower confidence and notes.

Task 3 applies this by using high-confidence official Australian Open and Wimbledon sources, and medium-confidence Roland Garros and US Open rows where source limitations remain.
