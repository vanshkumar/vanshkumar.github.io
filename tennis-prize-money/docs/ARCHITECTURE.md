# Architecture

## Current Scope

Task 1 establishes a static React + TypeScript + Vite dashboard shell under `tennis-prize-money/`. The app is intentionally app-local inside the larger `vanshkumar.github.io` repository and is configured for GitHub Pages subpath hosting with `base: '/tennis-prize-money/'`.

The dashboard currently renders from a small, visibly labeled mock/sample JSON dataset. No real tournament financial or prize-money data has been added yet.

## App Structure

- `index.html` mounts the Vite app.
- `vite.config.ts` configures React, Vitest, and the `/tennis-prize-money/` base path.
- `src/main.tsx` mounts React.
- `src/App.tsx` owns the basic React Router setup.
- `src/pages/DashboardPage.tsx` renders the initial dashboard route.
- `src/components/` contains small presentational UI components.
- `src/data/mockPrizeEconomics.json` contains the Task 1 mock/sample records.
- `src/data/mockDashboardData.ts` defines the temporary TypeScript shape for the mock data.
- `src/lib/dashboardMetrics.ts` provides filtering, formatting, and placeholder KPI helpers.
- `src/styles/main.css` contains app-local CSS.
- `src/test/` contains Vitest tests for the scaffold utilities and mock data labels.

## Data Flow

For Task 1, the dashboard imports a static mock JSON file at build time. The page derives filter options, the selected record, KPI placeholders, and simple chart bars in the browser. The mock dataset includes source metadata with `sourceType: "mock"` and `confidence: "mock"`.

Future tasks should replace the temporary mock data shape with validated schemas, normalized static JSON, source metadata, and tested calculation utilities.

## Static Deployment Boundary

The app assumes GitHub Pages static hosting. There are no app-local API routes and no client-side secrets. The refresh button is disabled and clearly marked as not configured until a future task adds a CLI/GitHub Actions refresh path and, optionally, a separately hosted serverless dispatch endpoint.

## Checks

The app provides these app-local scripts:

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
