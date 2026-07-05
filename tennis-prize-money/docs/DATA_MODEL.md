# Data Model

## Current Status

The active dataset is a small sourced seed dataset for Grand Slam prize-money economics. It now includes 2024-2025 full-tournament prize-money rows for Wimbledon and the Australian Open plus 2025 Grand Slam men's singles event rows. Wimbledon full-tournament rows include compatible AELTC Championships Ltd turnover and operating-profit denominators; Australian Open full-tournament rows and the event-level rows keep financial denominators unavailable unless tournament-specific sources exist.

Version `0.1.0` includes a server-side refresh pipeline that reads, validates, merges, and writes the same static JSON files. It does not change the schema version.

## File Layout

- `src/data/static/seedDatasetMetadata.json` stores dataset-level metadata such as schema version, label, notice, data mode, and last refresh timestamp.
- `src/data/raw/source-metadata/grandSlam2025Sources.json` stores the v0.1 source inventory for Grand Slam prize-money rows.
- `src/data/normalized/grandSlam2025MensSingles.json` stores normalized seed records. The historical filename remains, but the file now contains full-tournament rows as well as 2025 men's singles event rows.
- `src/data/schemas.ts` defines TypeScript types and runtime validation.
- `src/data/dashboardDataset.ts` imports the static JSON files, validates them, and exports the typed dataset used by the dashboard.
- `src/lib/metricEngine.ts` computes derived metrics from validated records.
- `src/refresh/index.ts` validates and writes these same JSON outputs during `npm run refresh:data`.

## Dataset Metadata

Dataset metadata fields:

- `schemaVersion`: currently `1`.
- `datasetId`: stable dataset identifier.
- `datasetLabel`: visible label. Mock datasets must include mock/sample wording.
- `datasetNotice`: visible data-use notice. Mock datasets must state that values are not real facts.
- `dataMode`: `mock`, `mixed`, or `real`.
- `lastRefreshedAt`: ISO datetime.

`dataMode` is enforced:

- `real` datasets cannot contain mock sources, mock record confidence, or mock value statuses.
- `mock` datasets must visibly include mock/sample wording in the dataset label or notice, and every available value must be mock-labeled.
- `mixed` is reserved for future datasets that intentionally combine sourced rows with visibly labeled mock/sample rows.

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

Mock source type and mock confidence must be paired. The active v0.1 seed dataset uses real source metadata and has `dataMode: "real"`.

## Tournament Records

Each normalized record represents one tournament, year, and event/scope:

- `id`
- `tournament`
- `year`
- `event`
- `confidence`
- `displayCurrency`
- `sourceIds`
- `prizeMoneyScope`
- `prizePool`
- `revenue`
- `profitOrSurplus`
- `winnerPayout`
- `runnerUpPayout`
- `roundPayouts`
- `caveats`

`displayCurrency` is a UI convenience. Calculations use each value's own `currency` and refuse to compare incompatible currencies.

`prizeMoneyScope` is required because the primary ratio is only meaningful when the numerator scope matches the denominator scope:

- `event_main_draw`: one main-draw event, such as men's singles. These rows are partial numerators for whole-tournament revenue/profit questions.
- `tournament_total`: full tournament prize money across the categories/components described by the source.

For the men's singles rows, `prizePool` is the event-level men's singles allocation when an official per-event total is available. When only round payouts are available, `prizePool.status` is `derived` and the value is the weighted sum of the 128-player singles draw payouts.

For Wimbledon full-tournament rows, `prizePool` is official total Championships prize money including tennis-events prize money and estimated per diems. For Australian Open full-tournament rows, `prizePool` is the official total AO prize pool; the source PDF does not break every component into the normalized event model.

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

Financial values may include `scopeLabel` when the denominator needs a precise user-facing label. Wimbledon uses:

- `Championships operating-company turnover`
- `Championships operating-company operating profit`

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
- `incompatible_scope`
- `no_prior_record`

Compatible denominator rules:

- `prizePool / revenue` accepts `tournament_revenue` and `event_revenue`.
- `prizePool / profit or surplus` accepts `tournament_profit` and `tournament_surplus`.
- `tournament_revenue`, `tournament_profit`, and `tournament_surplus` require a `tournament_total` prize-money scope.
- `event_revenue` requires an `event_main_draw` prize-money scope.
- Organizer-level revenue/profit/surplus, tour-level revenue, expenses, and unknown values are not treated as compatible denominators.
- Profit or surplus denominators that are zero or negative are unavailable.

## Refresh Merge Rules

Refresh adapters normalize source data into the existing `Source` and `TournamentEconomicsRecord` shapes.

- Sources are merged by `source.id`.
- Records are merged by `record.id`.
- Incoming rows replace matching ids.
- Unrelated existing rows are preserved.
- The complete merged dataset is validated before any static JSON output is written.

The first refresh adapter accepts a JSON manifest with top-level `sources` and `records` arrays. Tournament-specific scraping, PDF parsing, and financial-report adapters are future work.

## v0.1 Validation Coverage

The test suite covers:

- active seed provenance and source metadata labels
- rejection of mock leakage in datasets labeled `real`
- rejection of unpaired mock source type/confidence
- rejection of available money values without source ids
- ratio unavailability for missing, zero, negative, incompatible-currency, and incompatible-financial-kind cases
- validation-before-write behavior in the refresh pipeline
