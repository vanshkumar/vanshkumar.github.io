# Tennis Prize Money Economics

A static-first React + TypeScript + Vite dashboard for exploring tennis prize money alongside tournament revenue, profit, or surplus where reliable data eventually exists.

The current Task 1 app uses **mock/sample data only**. Values are deliberately labeled in the JSON and UI and must not be treated as real tournament facts.

## Setup

```bash
npm install
npm run dev
```

The local dev server serves the app with Vite. Deployed builds are configured for the GitHub Pages subpath `/tennis-prize-money/`.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Project Shape

- `src/data/mockPrizeEconomics.json` contains the visibly labeled Task 1 mock dataset.
- `src/pages/DashboardPage.tsx` renders the baseline dashboard shell.
- `src/lib/dashboardMetrics.ts` contains small formatting, filtering, and placeholder KPI helpers.
- `src/test/dashboardMetrics.test.ts` smoke-tests the mock labels, filters, and placeholder metric behavior.
- `docs/ARCHITECTURE.md` describes the initial static app architecture.

## Data Rules

- Do not fabricate real data.
- Keep mock/sample data visibly labeled in code and UI.
- Treat prize money, revenue, profit, surplus, expenses, and unavailable values as distinct concepts.
- Do not compute ratios when values are missing, nonpositive, semantically incompatible, or in incompatible currencies.
- Browser-triggered refresh is disabled until a safe external endpoint exists.
