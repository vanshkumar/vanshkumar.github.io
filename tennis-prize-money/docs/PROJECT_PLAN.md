# Tennis Prize Money Economics Dashboard Plan

## Product Goal

Build a static-first dashboard that helps compare tennis tournament prize money with tournament revenue, profit, or surplus where reliable data exists. The dashboard should show winner and runner-up payouts, payout curves by round, total prize pool, prize-pool share of revenue, prize-pool share of profit/surplus, source confidence, and visible caveats for unavailable, estimated, semantically incompatible, or mock data.

The first version should be honest before it is comprehensive. Prize money is often easier to source than tournament-level financials, so gaps must be explicit rather than hidden.

## Current Release Status

Version `0.1.0` is review-ready with a static dashboard, validated 2025 Grand Slam men's singles seed data, tested calculation/display/refresh logic, docs, changelog, and a secure non-configured browser refresh fallback. Remaining expansion work is tracked in `docs/FUTURE_WORK.md`.

## Repository Context

This folder is part of the larger `vanshkumar.github.io` personal-site repository, not a separate Git repository. The parent repo is an Astro 5 static site deployed to GitHub Pages.

Existing side apps establish the pattern:

- `coffee-rush/` is a deployed React/Vite app at `/coffee-rush/`.
- `terminal-desires-ranker/` is a deployed React/Vite app at `/terminal-desires-ranker/`.
- `vault-weather/` is a local-only React/Vite app.

The GitHub Pages workflow currently builds the root Astro site, builds deployed side apps, copies their `dist/` folders into a combined `site/` artifact, preserves `site/.nojekyll`, and deploys that artifact.

## Stack Choice

Use a React + TypeScript + Vite app in `tennis-prize-money/`.

Reasons:

- It matches the parent repo's deployed side-app pattern.
- It supports static GitHub Pages deployment under `/tennis-prize-money/`.
- It keeps this dashboard independent from the root Astro content system.
- It works naturally with Vitest, ESLint, static JSON, and app-local npm scripts.

Expected app-level choices:

- npm package manager.
- Vite `base: '/tennis-prize-money/'`.
- React 18 unless Task 1 has a strong reason to use a newer compatible version.
- Vitest for calculation and smoke tests.
- ESLint and `tsc --noEmit` for lint/typecheck.
- Zod or equivalent schema validation for data.
- A static-friendly charting library such as Recharts, Observable Plot, or ECharts.
- Simple app-local CSS.

Avoid Next.js or app-local server routes unless a later task deliberately adds a separately hosted backend for refresh dispatch.

## Task Sequence

Task 0: Repository reconnaissance and execution plan.

- Confirm parent repo and side-app context.
- Create app-local agent instructions.
- Create planning docs and task log.
- Create Task 0 handoff.
- Commit, push, and create the Task 1 thread with xhigh effort/thinking.

Task 1: Scaffold the app and baseline dashboard.

- Create the React + TypeScript + Vite app if no app exists.
- Add mock/sample data that is visibly labeled.
- Build the initial dashboard shell, README, architecture doc, scripts, and basic tests.

Task 2: Data schema, validation, and calculation engine.

- Add typed data model and schemas.
- Add static/raw/normalized data directories.
- Implement and test metrics utilities.
- Wire the dashboard to validated data.

Task 3: Initial data sourcing and seed dataset.

- Add a small, honest Grand Slam seed dataset.
- Use real data only when source metadata and semantics are clear.
- Document sources, limitations, and confidence.

Task 4: First real visualizations and UX polish.

- Implement charts, filters, empty states, unavailable states, caveats, responsive layout, and accessibility polish.

Task 5: On-demand refresh pipeline.

- Add Node/CI refresh modules and `npm run refresh:data`.
- Add GitHub Actions refresh workflow.
- Implement optional external refresh dispatch integration without exposing secrets.
- Document deployment and refresh configuration.

Task 6: Final hardening, documentation, and v0.1 readiness.

- Audit for mock leakage, source labels, terminology, secrets, filters, empty states, and build failures.
- Complete docs, changelog, tests, push, and open a PR if available.

## Codex Thread Requirement

Every new Codex chat thread created for this project must use xhigh effort/thinking. This is mandatory for major task handoff threads and any auxiliary Codex chat threads created for project work.

When creating the next thread, set the thread creation tool's thinking/reasoning option to `xhigh` when available. The seed prompt must also include: `Use xhigh effort/thinking for this thread.`

If xhigh cannot be configured for a thread, document the limitation in the handoff and final response instead of silently creating a lower-effort thread.

## Assumptions

- The dashboard will be deployed as a static GitHub Pages side app at `/tennis-prize-money/`.
- The app should remain app-local unless deployment workflow updates require parent-level changes.
- GitHub Pages is the default hosting path and has no server runtime.
- Browser-triggered refresh is optional and should show a safe "not configured" state unless an external backend is configured.
- Seed data can be partial if source limitations are visible.
- Task 1 starts from this folder with no existing app scaffold.

## Risks

- Tournament financials may be unavailable, partial, or not semantically comparable to prize pools.
- Prize money can be reported by event, round, player/team allocation, or total pool, so normalization mistakes are easy.
- Currency comparisons can be misleading without explicit conversion.
- GitHub Pages cannot safely hold server-side tokens, so refresh dispatch needs careful boundaries.
- The parent repo may contain unrelated generated content or sibling-app edits; broad staging could accidentally include user work.
- Large charting or data dependencies could make a small static side app heavier than necessary.

## Acceptance Criteria

For Task 0:

- The repo and sibling-app conventions are documented.
- `AGENTS.md`, `docs/PROJECT_PLAN.md`, `docs/TASK_LOG.md`, and `docs/handoffs/task-0-summary.md` exist.
- The selected stack is React + TypeScript + Vite with npm and GitHub Pages subpath deployment.
- Available lightweight checks have been run.
- Changes are committed and pushed on `feat/tennis-prize-economics-dashboard`.
- A Task 1 Codex thread is created with xhigh effort/thinking and seeded with the handoff and instructions.

For v0.1 overall:

- The app runs locally.
- The dashboard renders from validated static JSON.
- Metrics are computed by tested utilities.
- The UI distinguishes official, reported, estimated, derived, mock, unavailable, and semantically incompatible data.
- At least one meaningful seed dataset exists, even if partial.
- Refresh architecture exists via CLI and GitHub Actions.
- The refresh button has a secure non-configured fallback.
- Documentation is sufficient for a future Codex thread or developer to continue.
- Available checks pass.
- Work is committed and pushed at every task boundary.
- Each new Codex chat thread created as part of the project is created with xhigh effort/thinking.
