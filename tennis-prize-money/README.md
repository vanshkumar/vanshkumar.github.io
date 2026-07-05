# Tennis Prize Money Economics

A static-first React + TypeScript + Vite dashboard for exploring tennis prize money alongside tournament revenue, profit, or surplus where reliable data exists.

The current Task 3 app uses a small sourced 2025 Grand Slam men's singles seed dataset. Revenue and profit/surplus values are intentionally unavailable until compatible tournament-level financial sources are added.

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

- `src/data/static/` contains dataset-level static JSON metadata.
- `src/data/raw/source-metadata/` contains source metadata JSON.
- `src/data/normalized/` contains normalized tournament economics records.
- `src/data/schemas.ts` validates the JSON contract at import time.
- `src/lib/metricEngine.ts` contains calculation utilities and unavailable-reason handling.
- `src/lib/dashboardMetrics.ts` contains dashboard formatting, filtering, and KPI helpers.
- `src/test/dashboardMetrics.test.ts` tests seed data provenance, filters, and calculation edge cases.
- `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DATA_SOURCES.md`, and `docs/DATA_CAVEATS.md` describe the static app and data boundaries.

## Data Rules

- Do not fabricate real data.
- Keep mock/sample data visibly labeled in code and UI.
- Treat prize money, revenue, profit, surplus, expenses, and unavailable values as distinct concepts.
- Do not compute ratios when values are missing, nonpositive, semantically incompatible, or in incompatible currencies.
- Browser-triggered refresh is disabled until a safe external endpoint exists.
