# Data Model

## Current Status

Task 2 adds a validated data layer for the dashboard. The current dataset is still mock/sample data only; it exists to exercise schema validation, calculation behavior, unavailable states, and visible mock labels before real sources are added.

## File Layout

- `src/data/static/mockDatasetMetadata.json` stores dataset-level metadata such as schema version, label, notice, data mode, and last refresh timestamp.
- `src/data/raw/source-metadata/mockSources.json` stores source metadata. Task 3 should replace or extend this with real source inventory entries.
- `src/data/normalized/mockTournamentEconomics.json` stores normalized tournament-year-event records used by the app.
- `src/data/schemas.ts` defines TypeScript types and runtime validation.
- `src/data/dashboardDataset.ts` imports the static JSON files, validates them, and exports the typed dataset used by the dashboard.
- `src/lib/metricEngine.ts` computes derived metrics from validated records.

## Dataset Metadata

Dataset metadata fields:

- `schemaVersion`: currently `1`.
- `datasetId`: stable dataset identifier.
- `datasetLabel`: visible label. Mock datasets must include mock/sample wording.
- `datasetNotice`: visible data-use notice. Mock datasets must state that values are not real facts.
- `dataMode`: `mock`, `mixed`, or `real`.
- `lastRefreshedAt`: ISO datetime.

## Sources

Every available real value should be traceable to source metadata:

- `id`
- `title`
- `publisher`
- `url`
- `sourceType`: `official_report`, `annual_report`, `form_990`, `official_prize_money_page`, `press_release`, `reputable_secondary`, `manual_verified`, or `mock`
- `accessedAt`
- `confidence`: `high`, `medium`, `low`, or `mock`
- `notes`

Mock datasets may only contain mock sources with mock confidence.

## Tournament Records

Each normalized record represents one tournament, year, and event:

- `id`
- `tournament`
- `year`
- `event`
- `confidence`
- `displayCurrency`
- `sourceIds`
- `prizePool`
- `revenue`
- `profitOrSurplus`
- `winnerPayout`
- `runnerUpPayout`
- `roundPayouts`
- `caveats`

`displayCurrency` is a UI convenience. Calculations use each value's own `currency` and refuse to compare incompatible currencies.

## Value Objects

Money-like values share these fields:

- `amount`: number or `null`
- `currency`: ISO-style three-letter code or `null`
- `status`: `official`, `reported`, `estimated`, `derived`, `mock`, or `unavailable`
- `sourceIds`
- `notes`

Unavailable values must use `amount: null`, `currency: null`, and `status: "unavailable"`.

Financial values also include `kind`:

- `tournament_revenue`
- `event_revenue`
- `organization_revenue`
- `tour_revenue`
- `tournament_profit`
- `tournament_surplus`
- `organization_profit`
- `organization_surplus`
- `expenses`
- `unknown`

Payout values also include `allocation`:

- `per_player`
- `per_team`
- `total_allocation`

## Derived Metrics

The metric engine returns structured results rather than only formatted strings. Ratios and percentages are available only when inputs are compatible.

Supported calculations:

- total prize pool
- winner payout
- runner-up payout
- winner/runner-up payout ratio
- prize pool / revenue
- prize pool / profit or surplus
- year-over-year prize pool growth
- round payout percentages

Unavailable reasons:

- `missing_data`
- `zero_denominator`
- `negative_denominator`
- `incompatible_currency`
- `incompatible_financial_kind`
- `no_prior_record`

Compatible denominator rules:

- `prizePool / revenue` accepts `tournament_revenue` and `event_revenue`.
- `prizePool / profit or surplus` accepts `tournament_profit` and `tournament_surplus`.
- Organizer-level revenue/profit/surplus, tour-level revenue, expenses, and unknown values are not treated as compatible denominators.
- Profit or surplus denominators that are zero or negative are unavailable.
