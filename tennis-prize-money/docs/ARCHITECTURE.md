# Architecture

## Current Scope

Task 2 establishes a static React + TypeScript + Vite dashboard with a validated data layer and tested calculation engine under `tennis-prize-money/`. The app remains app-local inside the larger `vanshkumar.github.io` repository and is configured for GitHub Pages subpath hosting with `base: '/tennis-prize-money/'`.

The dashboard currently renders from visibly labeled mock/sample JSON. No real tournament financial or prize-money data has been added yet.

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
- `src/lib/dashboardMetrics.ts` adapts metric results into dashboard filters, KPI cards, labels, and formatting.
- `src/styles/main.css` contains app-local CSS.
- `src/test/` contains Vitest tests for validation-backed data behavior and calculation edge cases.

## Data Flow

The dashboard imports `dashboardDataset` from `src/data/dashboardDataset.ts`. That module loads static JSON from the app bundle, validates metadata, source rows, and normalized records, and throws a `DataValidationError` if the contract is broken.

Dashboard rendering then follows this path:

1. Validated records provide filter options and selected-record state.
2. `src/lib/metricEngine.ts` computes derived metrics and unavailable reasons.
3. `src/lib/dashboardMetrics.ts` formats those results for KPI cards and chart labels.
4. `DashboardPage.tsx` renders the mock-labeled dashboard UI.

The app does not fetch data at runtime in the browser yet.

## Metric Boundaries

The calculation engine only computes ratios when values are compatible:

- same currency
- available numerator and denominator
- positive denominator
- compatible financial denominator semantics

Organizer-level financials, expenses, unknown values, incompatible currencies, missing values, and zero or negative profit/surplus denominators return unavailable results rather than percentages.

## Static Deployment Boundary

The app assumes GitHub Pages static hosting. There are no app-local API routes and no client-side secrets. The refresh button is disabled and clearly marked as not configured until a future task adds a CLI/GitHub Actions refresh path and, optionally, a separately hosted serverless dispatch endpoint.

## Checks

The app provides these app-local scripts:

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
