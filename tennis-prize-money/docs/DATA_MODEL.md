# Data Model

## Current Status

The active dataset is a small sourced seed dataset for 2025 Grand Slam men's singles prize money. Revenue and profit/surplus rows remain unavailable because the project has not added clear tournament-level financial denominators suitable for ratios.

Version `0.1.0` includes a server-side refresh pipeline that reads, validates, merges, and writes the same static JSON files. It does not change the schema version.

## File Layout

- `src/data/static/seedDatasetMetadata.json` stores dataset-level metadata such as schema version, label, notice, data mode, and last refresh timestamp.
- `src/data/raw/source-metadata/grandSlam2025Sources.json` stores the v0.1 source inventory for Grand Slam prize-money rows.
- `src/data/normalized/grandSlam2025MensSingles.json` stores normalized 2025 men's singles records for the Australian Open, Roland Garros, Wimbledon, and US Open.
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

Each normalized record represents one tournament, year, and event. In the v0.1 seed, each row represents one 2025 men's singles event, not the entire tournament:

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

For the v0.1 seed, `prizePool` is the event-level men's singles allocation when an official per-event total is available. When only round payouts are available, `prizePool.status` is `derived` and the value is the weighted sum of the 128-player singles draw payouts.

Future tournament-total rows should add or otherwise model numerator scope explicitly, such as full tournament prize money, event-level prize money, included draws/categories, per-diem/player-support inclusion, and derivation method. This is required before the primary revenue/profit-share UI can distinguish a full tournament answer from a partial event-level comparison.

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
