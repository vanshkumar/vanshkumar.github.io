# Data Caveats

## Current Dataset

The current Task 2 dataset is mock/sample data only. It is not real tennis tournament prize-money or financial data. Mock labels appear in dataset metadata, source metadata, normalized records, tests, and UI copy.

## Semantic Distinctions

Prize money, revenue, profit, surplus, expenses, and unavailable values are different concepts and must not be collapsed into a generic "money" field in user-facing logic.

- Prize pool is the tournament/event prize-money pool represented by the normalized record.
- Winner and runner-up payouts are payout rows and may be per player, per team, or total allocation.
- Revenue must describe a compatible tournament-level or event-level financial denominator before prize-pool share is computed.
- Profit/surplus must describe compatible tournament-level profit or surplus before prize-pool share is computed.
- Organizer-level revenue/profit/surplus can be useful context, but it is not automatically comparable to a single tournament/event prize pool.
- Expenses are not profit or surplus denominators.
- Unknown and unavailable values should remain visible as unavailable rather than guessed.

## Currency Caveats

The app does not do currency conversion in Task 2. A ratio is computed only when numerator and denominator currencies match exactly. If later tasks need cross-currency comparisons, they should add explicit FX source metadata, conversion dates, and tests.

## Profit And Surplus Caveats

Prize pool / profit or surplus is unavailable when profit/surplus is missing, zero, negative, semantically incompatible, or in another currency. Negative and zero denominators are shown as unavailable because a percentage would be misleading for this dashboard.

## Round Payout Caveats

Round payout percentages compare each published round payout to the record's total prize pool only when currencies match. They should not be interpreted as the total share of the entire draw unless the allocation basis and draw counts are also modeled.

Doubles payouts may be per team while singles payouts are usually per player. The `allocation` field must remain visible where payout rows are shown.

## Source Confidence Caveats

Confidence describes source trust and data clarity, not truth in isolation.

- `high`: official or audited source with clear semantics.
- `medium`: reputable source or official source with some ambiguity.
- `low`: usable but limited source, likely with caveats.
- `mock`: fictional sample data only.

Task 3 should prefer official tournament pages, annual reports, Form 990s, official financial statements, and official press releases. Secondary sources should be clearly labeled with lower confidence and notes.
