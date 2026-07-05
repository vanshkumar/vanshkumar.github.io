# Architecture

## Current Scope

Version `0.1.0` is a static React + TypeScript + Vite dashboard with a validated data layer, sourced seed data, tested calculation engine, CSS visualizations, and a server-side refresh pipeline under `tennis-prize-money/`. The app remains app-local inside the larger `vanshkumar.github.io` repository and is configured for GitHub Pages subpath hosting with `base: '/tennis-prize-money/'`.

The dashboard currently renders from a small sourced 2025 Grand Slam men's singles prize-money seed dataset. Compatible tournament-level revenue, profit, surplus, and prior-year comparison values remain unavailable until clearer financial sources and additional years are added.

## App Structure

- `index.html` mounts the Vite app.
- `vite.config.ts` configures React and the `/tennis-prize-money/` base path.
- `src/main.tsx` mounts React.
- `src/App.tsx` owns the basic React Router setup.
- `src/pages/DashboardPage.tsx` renders the dashboard route.
- `src/components/` contains small presentational UI components.
- `src/data/static/` contains dataset-level static JSON metadata.
- `src/data/raw/source-metadata/` contains source metadata JSON.
- `src/data/normalized/` contains normalized tournament economics records.
- `src/data/schemas.ts` defines TypeScript types and runtime validation, including mock-leakage checks for datasets labeled `real`.
- `src/data/dashboardDataset.ts` imports and validates JSON before exporting the typed dataset.
- `src/lib/metricEngine.ts` computes trustworthy metrics with structured unavailable reasons.
- `src/lib/dashboardMetrics.ts` adapts metric results into dashboard filters, primary-question answer rows, answerability coverage summaries, visible caveats, and formatting.
- `src/lib/refreshClient.ts` handles browser-safe refresh endpoint configuration and dispatch requests. It only reads public `VITE_` variables.
- `src/refresh/` contains the server-side refresh pipeline, source-adapter interfaces, validation, merge, and static JSON output code.
- `scripts/refresh-data.mjs` is the Node CLI wrapper for `npm run refresh:data`.
- `serverless/refresh-dispatch.mjs` is an optional external serverless dispatch handler. It is not bundled into the static app.
- `src/styles/main.css` contains app-local CSS.
- `src/test/` contains Vitest tests for validation-backed data behavior, provenance rules, display helpers, unavailable states, refresh behavior, and calculation edge cases.

## Data Flow

The dashboard imports `dashboardDataset` from `src/data/dashboardDataset.ts`. That module loads static JSON from the app bundle, validates metadata, source rows, and normalized records, and throws a `DataValidationError` if the contract is broken.

Dashboard rendering then follows this path:

1. Validated records provide filter options and selected-record state.
2. `src/lib/metricEngine.ts` computes derived metrics and unavailable reasons.
3. `src/lib/dashboardMetrics.ts` formats those results for the primary answer board, ratio-input summaries, answerability coverage, and visible caveats.
4. `DashboardPage.tsx` renders the dashboard UI with the primary answer board first, then filters, answerability coverage, empty states, unavailable states, record confidence, refresh status, source links, and caveats.

The app does not fetch tournament data at runtime in the browser. The browser can optionally request a refresh dispatch only when `VITE_REFRESH_DISPATCH_URL` points to a separately hosted external endpoint.

## Refresh Flow

The server-side refresh pipeline follows this path:

1. `scripts/refresh-data.mjs` reads the current static JSON files.
2. `src/refresh/index.ts` validates the existing dataset.
3. Configured source adapters fetch raw/source data and normalize it to `Source[]` and `TournamentEconomicsRecord[]`.
4. Adapter output is merged by stable ids, replacing matching source/record rows and preserving unrelated rows.
5. The merged dataset is validated with `parseDashboardDataset`.
6. The pipeline writes the three static JSON outputs only after validation succeeds.

The first adapter implementation is a generic JSON manifest adapter for server-side use. Tournament-specific official-page or PDF adapters are future work.

## Metric Boundaries

The calculation engine only computes ratios when values are compatible:

- same currency
- available numerator and denominator
- positive denominator
- compatible financial denominator semantics

Organizer-level financials, expenses, unknown values, incompatible currencies, missing values, and zero or negative profit/surplus denominators return unavailable results rather than percentages.

## Visualization Flow

The visual layer is app-local and dependency-light. `DashboardPage.tsx` renders CSS answer cards and coverage bars from view models created in `src/lib/dashboardMetrics.ts`.

Current panels focus on one question: how much prize money do players receive as a percentage of tournament revenue or profit/surplus?

- primary answer cards for prize money / revenue and prize money / profit/surplus
- ratio-input summaries for the prize-money numerator and the two financial denominators
- answerability coverage for the active filter set
- calculation caveats explaining missing, incompatible, zero, negative, or cross-currency denominators
- selected-record source cards

Payout curves, finalist comparisons, and year-over-year prize-pool growth remain available as tested helper logic, but they are no longer first-class dashboard visuals because they do not answer the primary revenue/profit-share question.

Filtering by tournament, year, event, and confidence happens before chart view models are built. If filters produce zero matching records, the page renders explicit empty states instead of falling back to a hidden default record.

## Static Deployment Boundary

The app assumes GitHub Pages static hosting. There are no app-local API routes and no client-side secrets. The refresh button is clearly marked as not configured unless `VITE_REFRESH_DISPATCH_URL` is set to an absolute external endpoint URL.

The optional dispatch endpoint requires a separate serverless host with server-side `GITHUB_TOKEN` and `REFRESH_TOKEN` values. Those values must never be exposed through Vite variables.

## v0.1 Hardening Notes

- The active dataset has `dataMode: "real"` and validation rejects mock sources, mock record confidence, or mock value statuses in that mode.
- Source rows must include title, publisher, URL, source type, accessed date, confidence, and notes before the dashboard can import them.
- Filters return explicit empty states for zero-match combinations instead of falling back to the first record.
- Financial rows remain visible but unavailable when denominators are missing, semantically incompatible, zero, negative, or in another currency.
- The browser refresh button remains disabled unless `VITE_REFRESH_DISPATCH_URL` is an absolute external URL.

## Checks

The app provides these app-local scripts:

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run refresh:data`
