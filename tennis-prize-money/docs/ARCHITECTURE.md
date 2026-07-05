# Architecture

## Current Scope

Task 4 builds on the static React + TypeScript + Vite dashboard with a validated data layer, sourced seed data, tested calculation engine, and first-version CSS/SVG visualizations under `tennis-prize-money/`. The app remains app-local inside the larger `vanshkumar.github.io` repository and is configured for GitHub Pages subpath hosting with `base: '/tennis-prize-money/'`.

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
- `src/data/schemas.ts` defines TypeScript types and runtime validation.
- `src/data/dashboardDataset.ts` imports and validates JSON before exporting the typed dataset.
- `src/lib/metricEngine.ts` computes trustworthy metrics with structured unavailable reasons.
- `src/lib/dashboardMetrics.ts` adapts metric results into dashboard filters, KPI cards, labels, chart row view models, coverage summaries, visible caveats, and formatting.
- `src/styles/main.css` contains app-local CSS.
- `src/test/` contains Vitest tests for validation-backed data behavior, display helpers, unavailable states, and calculation edge cases.

## Data Flow

The dashboard imports `dashboardDataset` from `src/data/dashboardDataset.ts`. That module loads static JSON from the app bundle, validates metadata, source rows, and normalized records, and throws a `DataValidationError` if the contract is broken.

Dashboard rendering then follows this path:

1. Validated records provide filter options and selected-record state.
2. `src/lib/metricEngine.ts` computes derived metrics and unavailable reasons.
3. `src/lib/dashboardMetrics.ts` formats those results for KPI cards, chart row view models, coverage summaries, and visible caveats.
4. `DashboardPage.tsx` renders the dashboard UI with filters, KPI cards, CSS/SVG charts, empty states, unavailable states, record confidence, source links, and caveats.

The app does not fetch data at runtime in the browser yet.

## Metric Boundaries

The calculation engine only computes ratios when values are compatible:

- same currency
- available numerator and denominator
- positive denominator
- compatible financial denominator semantics

Organizer-level financials, expenses, unknown values, incompatible currencies, missing values, and zero or negative profit/surplus denominators return unavailable results rather than percentages.

## Visualization Flow

Task 4 keeps charting app-local and dependency-light. `DashboardPage.tsx` renders SVG and CSS bar charts from view models created in `src/lib/dashboardMetrics.ts`.

Current panels:

- payout curve by round for the selected record
- winner vs runner-up payout comparison for the selected record
- prize pool vs revenue/profit rows, with unavailable or currency-mismatch rows not charted as comparable values
- year-over-year prize-pool growth, currently shown as an unavailable state because the seed has only 2025 rows
- record and linked-source confidence coverage for the active filter set

Filtering by tournament, year, event, and confidence happens before chart view models are built. If filters produce zero matching records, the page renders explicit empty states instead of falling back to a hidden default record.

## Static Deployment Boundary

The app assumes GitHub Pages static hosting. There are no app-local API routes and no client-side secrets. The refresh button is disabled and clearly marked as not configured until a future task adds a CLI/GitHub Actions refresh path and, optionally, a separately hosted serverless dispatch endpoint.

## Checks

The app provides these app-local scripts:

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
