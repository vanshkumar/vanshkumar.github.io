# Changelog

## Unreleased

- Refocused the dashboard visuals around the primary question: prize money as a percentage of tournament revenue and profit/surplus.
- Moved payout-curve, finalist, year-over-year, and broad coverage visuals out of the main dashboard flow in favor of answer cards, ratio inputs, answerability coverage, and calculation caveats.

## v0.1.0 - 2026-07-05

- Added the first static React + TypeScript + Vite dashboard for tennis prize-money economics.
- Added a sourced 2025 Grand Slam men's singles seed dataset with source metadata, confidence labels, caveats, and validation.
- Added KPI cards, filters, payout curve, finalist comparison, financial unavailable states, year-over-year unavailable states, and source coverage views.
- Added tested metric utilities for prize pools, finalist payouts, payout ratios, financial ratios, year-over-year growth, and round payout percentages.
- Added schema validation hardening for real-data mode, source IDs, source metadata, unavailable values, and mock/sample labeling rules.
- Added a server-side refresh pipeline, `npm run refresh:data`, a manual GitHub Actions refresh workflow, and an optional external refresh dispatch handler.
- Added parent GitHub Pages deployment workflow integration for the `/tennis-prize-money/` static artifact.
- Added documentation for architecture, data model, data sources, caveats, refresh, deployment, future work, and task handoff history.

Known v0.1 limitations:

- The seed covers only 2025 men's singles Grand Slam rows.
- Tournament-level revenue, profit, and surplus denominators are not included yet.
- Roland Garros and US Open prize-money rows remain medium confidence until better official parseable sources are added.
- Browser-triggered refresh remains unconfigured unless a separate serverless dispatch backend is deployed.
