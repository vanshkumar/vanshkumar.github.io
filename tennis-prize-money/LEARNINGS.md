# Learnings

## What Has Worked

## Patterns and Preferences

**2026-07-05 — Project kickoff planning**
- Observation: `PLAN.md` defines a serial Codex-thread workflow where each major task must be documented, checked, committed, pushed, handed off under `docs/handoffs/`, and followed by creation of the next Codex thread before stopping.
- Action: Complete only the current major task in a thread; for Task 0, create the planning docs and Task 1 handoff/thread, then stop without starting Task 1 implementation.
- Confidence: high

**2026-07-05 — Parent site side-app planning**
- Observation: `tennis-prize-money/` is a sibling app inside the larger `vanshkumar.github.io` Astro/GitHub Pages repo; deployed sibling apps use independent React 18 + Vite projects with app-local npm packages and subpath `base` settings.
- Action: Prefer React + Vite with `base: '/tennis-prize-money/'`, npm, static GitHub Pages deployment, and optional external refresh dispatch instead of Next.js/server routes.
- Confidence: high

**2026-07-05 — Codex thread setup**
- Observation: New Codex chat threads for this project must use xhigh effort/thinking.
- Action: When creating Task 1 and later handoff or auxiliary Codex chat threads, set the thread creation tool's thinking/reasoning option to `xhigh` when available and include that requirement in the seed prompt.
- Confidence: high

**2026-07-05 — Task 0 git setup**
- Observation: The Git root is the parent `vanshkumar.github.io` repo while the writable app root is `tennis-prize-money/`; creating `feat/tennis-prize-economics-dashboard` needed an approved git metadata write after the sandboxed `git switch -c` failed.
- Action: For future branch or commit operations from this app, expect normal reads to work but retry required git metadata writes with approval if sandboxing blocks `.git` updates.
- Confidence: high

**2026-07-05 — Task 1 dependency workflow**
- Observation: This Codex shell did not have `npm` or `node` on PATH, but `/Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin/npm` worked once that same Node bin directory was prepended to PATH; package setup also needed approved network access.
- Action: For app-local npm installs and scripts in future threads, use `PATH=/Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin:/usr/bin:/bin:/usr/sbin:/sbin /Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin/npm ...` and request escalation when registry access is required.
- Confidence: high

**2026-07-05 — Task 1 Vite/Vitest config**
- Observation: With the current dependency set, adding a Vitest `test` block to `vite.config.ts` produced TypeScript conflicts between app Vite types and Vitest's nested Vite dependency.
- Action: Keep `vite.config.ts` Vite-only for now; the current Vitest tests run with default Node behavior without a Vite test config.
- Confidence: high

**2026-07-05 — Task 2 data layer**
- Observation: Runtime validation works cleanly without adding another dependency by importing `src/data/static/`, `src/data/raw/source-metadata/`, and `src/data/normalized/` through `src/data/dashboardDataset.ts`; calculations consume validated `TournamentEconomicsRecord` values.
- Action: Future data tasks should extend those JSON directories and import from `src/data/dashboardDataset.ts`, avoiding direct JSON casts or parallel loose data files.
- Confidence: high

**2026-07-05 — Task 3 seed sourcing**
- Observation: Grand Slam prize-money rows fit the current model best as event-level singles records; AO and Wimbledon publish official per-event totals, while Roland Garros and US Open may require derived event totals or secondary cross-checks when official pages are not crawler-readable.
- Action: For future source expansion, keep `prizePool` event-scoped when paired with singles round payouts, mark summed table totals as `derived`, lower confidence when source access is limited, and leave revenue/profit unavailable without a clear tournament-level financial source.
- Confidence: high

**2026-07-05 — Task 4 visualization UI**
- Observation: Local CSS/SVG chart components were enough for payout curves, comparison bars, confidence coverage, empty states, and unavailable states without adding a charting dependency.
- Action: For near-term dashboard visualization work, extend `src/lib/dashboardMetrics.ts` view models and `src/pages/DashboardPage.tsx` CSS/SVG panels before introducing a charting library.
- Confidence: medium

**2026-07-05 — Task 5 refresh pipeline**
- Observation: Server-side refresh TypeScript can be compiled without adding runtime/dependency tooling by using `tsconfig.refresh.json` to emit only `src/refresh/` and `src/data/schemas.ts` into `node_modules/.tmp/refresh`, then importing that output from `scripts/refresh-data.mjs`.
- Action: For future Node refresh scripts, keep Node-specific file IO in `.mjs` wrappers and keep reusable refresh logic in dependency-injected TypeScript modules that avoid Node globals.
- Confidence: high

**2026-07-05 — Task 5 refresh UI**
- Observation: The static dashboard can safely wire browser refresh only to an absolute public `VITE_REFRESH_DISPATCH_URL`; relative `/api/refresh`-style values would imply a GitHub Pages server runtime that does not exist.
- Action: Keep browser refresh configuration limited to public endpoint/doc URLs, and keep GitHub tokens, refresh passphrases, and signed source URLs in GitHub Actions or external serverless environment variables only.
- Confidence: high

**2026-07-05 - Task 6 release hardening**
- Observation: The active v0.1 seed uses `dataMode: "real"`, so schema-level checks can prevent future mock leakage before the dashboard imports JSON.
- Action: Keep real-data mock-leakage rules in `src/data/schemas.ts` and add focused validation tests in `src/test/dataValidation.test.ts` when tightening source or dataset contracts.
- Confidence: high

## What Has Failed
