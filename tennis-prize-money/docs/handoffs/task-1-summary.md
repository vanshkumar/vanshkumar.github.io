# Task 1 Handoff

## Task Completed

Task 1 - Scaffold the app and baseline dashboard.

## Files Changed

- `tennis-prize-money/.gitignore`
- `tennis-prize-money/README.md`
- `tennis-prize-money/package.json`
- `tennis-prize-money/package-lock.json`
- `tennis-prize-money/index.html`
- `tennis-prize-money/vite.config.ts`
- `tennis-prize-money/tsconfig.json`
- `tennis-prize-money/tsconfig.app.json`
- `tennis-prize-money/tsconfig.node.json`
- `tennis-prize-money/eslint.config.js`
- `tennis-prize-money/src/App.tsx`
- `tennis-prize-money/src/main.tsx`
- `tennis-prize-money/src/vite-env.d.ts`
- `tennis-prize-money/src/components/KpiCard.tsx`
- `tennis-prize-money/src/components/MockBadge.tsx`
- `tennis-prize-money/src/data/mockPrizeEconomics.json`
- `tennis-prize-money/src/data/mockDashboardData.ts`
- `tennis-prize-money/src/lib/dashboardMetrics.ts`
- `tennis-prize-money/src/pages/DashboardPage.tsx`
- `tennis-prize-money/src/styles/main.css`
- `tennis-prize-money/src/test/dashboardMetrics.test.ts`
- `tennis-prize-money/docs/ARCHITECTURE.md`
- `tennis-prize-money/docs/TASK_LOG.md`
- `tennis-prize-money/docs/handoffs/task-1-summary.md`
- `tennis-prize-money/LEARNINGS.md`

## Current Branch

`feat/tennis-prize-economics-dashboard`

## Commit Hash

Pending until the Task 1 commit is created and pushed. The current thread final response and Task 2 thread seed must name the pushed Task 1 commit hash.

## Push Status

Pending until the Task 1 commit is pushed. The current thread final response and Task 2 thread seed must state whether push succeeded.

## Commands Run And Results

- `sed -n '1,240p' LEARNINGS.md`: read app-local memory.
- `sed -n '1,260p' AGENTS.md`: read project agent instructions.
- `sed -n '1,260p' docs/PROJECT_PLAN.md`: read project plan summary.
- `sed -n '1,260p' docs/TASK_LOG.md`: read task log.
- `sed -n '1,260p' docs/handoffs/task-0-summary.md`: read Task 0 handoff.
- `sed -n '1,260p' PLAN.md`: read the full project prompt through Task 1 and surrounding requirements.
- `git status --short --branch`: confirmed branch `feat/tennis-prize-economics-dashboard...origin/feat/tennis-prize-economics-dashboard` with no starting changes.
- `git rev-parse --show-toplevel`: confirmed Git root is `/Users/vanshkumar/Documents/repos/vanshkumar.github.io`.
- `git rev-parse HEAD`: confirmed starting commit `e6d58e7c9a0dbb8eb16691703be85920ef765a45`.
- `git branch --show-current`: confirmed current branch.
- `git log --oneline --decorate -5`: confirmed `HEAD` and `origin/feat/tennis-prize-economics-dashboard` pointed at the Task 0 commit.
- `rg --files`: confirmed no app scaffold existed yet.
- `rg --files .. -g 'package.json' -g 'vite.config.*' -g 'tsconfig*.json' -g 'eslint.config.*'`: found sibling app configs for orientation.
- `sed` reads of sibling `coffee-rush` and `terminal-desires-ranker` package/config files: confirmed local React/Vite/npm patterns.
- `mkdir -p src/components src/data src/lib src/pages src/styles src/test docs/handoffs`: created scaffold directories.
- `npm install`: failed because `npm` was not on PATH.
- `codex_app.load_workspace_dependencies`: located bundled Node but not npm.
- `/Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin/npm --version`: confirmed npm `11.13.0` is available.
- `npm install` with approved registry access: initially failed during `esbuild` postinstall because `node` was not on PATH.
- `PATH=/Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin:/usr/bin:/bin:/usr/sbin:/sbin /Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin/npm install --no-audit --no-fund` with approved registry access: succeeded and added 238 packages.
- `npm run lint` with the same PATH prefix: passed.
- `npm run typecheck` with the same PATH prefix: initially failed because `vite.config.ts` used a Vitest `test` property with Vite's `defineConfig`.
- `npm run typecheck` after switching to `vitest/config`: failed because the installed Vitest version brought a nested Vite type that conflicted with app Vite plugin types.
- `npm run typecheck` after removing the unnecessary `test` config block and returning to Vite's `defineConfig`: passed.
- `npm run test` with the same PATH prefix: passed, 1 file and 4 tests.
- `npm run build` with the same PATH prefix: passed and built the Vite app.
- `sed -n '230,285p' PLAN.md` and `sed -n '260,380p' PLAN.md`: read Task 2 and following context for the next handoff/thread seed.

## Tests And Checks Status

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 4 tests.
- `npm run build`: passed.

## Known Issues

- The dashboard still uses temporary loose TypeScript types over mock/sample JSON; Task 2 should replace this with validated schemas and normalized static data.
- No real tournament prize-money or financial data exists yet.
- Parent GitHub Pages deployment workflow does not yet build or copy `tennis-prize-money/dist`.
- The refresh button is intentionally disabled and marked not configured because no safe external endpoint or GitHub Actions refresh path exists yet.
- The current Vitest setup relies on default Node behavior and does not define a `test` block in `vite.config.ts` to avoid Vite/Vitest nested type conflicts.

## Assumptions Made

- Task 1 should use fictional tournament names in mock data to avoid fabricated real tournament facts.
- Simple CSS chart placeholders are sufficient for Task 1; Task 4 can add richer visualization behavior after validated data and calculations exist.
- React Router is appropriate for the basic page structure and future dashboard routes.
- The app should stay fully static and app-local for this task.

## Next Task Objective

Task 2 - Data schema, validation, and calculation engine.

Create a trustworthy typed data layer with validation, source-aware static data directories, tested calculation utilities, and a dashboard wired to validated data rather than loose mock objects.

## Exact Instructions For The Next Codex Thread

Create the Task 2 Codex chat thread with xhigh effort/thinking.

Use this prompt to create the Task 2 thread, substituting the final pushed Task 1 commit hash from the current thread final response:

```markdown
You are Codex working in `/Users/vanshkumar/Documents/repos/vanshkumar.github.io/tennis-prize-money`, inside the larger `vanshkumar.github.io` repo.

Use xhigh effort/thinking for this thread.

Start from the latest pushed commit on `feat/tennis-prize-economics-dashboard`.

Task 1 was completed and pushed successfully.
Task 1 commit: `[SUBSTITUTE_FINAL_TASK_1_COMMIT_HASH]`.
Task 1 handoff: `docs/handoffs/task-1-summary.md`.

Before starting, read:
- `LEARNINGS.md`
- `AGENTS.md`
- `docs/PROJECT_PLAN.md`
- `docs/TASK_LOG.md`
- `docs/ARCHITECTURE.md`
- `docs/handoffs/task-1-summary.md`

Then complete TASK 2 only.

TASK 2 - Data schema, validation, and calculation engine

Goal:
Create a trustworthy typed data layer with validation and tested calculations.

Steps:
1. Read AGENTS.md, docs/PROJECT_PLAN.md, docs/TASK_LOG.md, docs/ARCHITECTURE.md, and docs/handoffs/task-1-summary.md.
2. Check git status and confirm the latest pushed commit is present.
3. Define TypeScript types and Zod schemas or equivalent validation.
4. Create data directories for:
   - static JSON
   - raw/source metadata
   - normalized data
5. Add calculation utilities for:
   - total prize pool
   - winner payout
   - runner-up payout
   - winner/runner-up ratio
   - prize pool / revenue
   - prize pool / profit or surplus
   - year-over-year growth
   - round payout percentages
6. Add tests for:
   - normal cases
   - missing data
   - negative profit/surplus
   - zero profit/surplus
   - incompatible currencies
   - semantically incompatible financial denominators
   - mock data
7. Update docs/DATA_MODEL.md.
8. Update docs/DATA_CAVEATS.md with semantic distinctions.
9. Wire the dashboard to validated data rather than loose mock objects.
10. Run lint, typecheck, test, and build.
11. Update docs/TASK_LOG.md.
12. Create docs/handoffs/task-2-summary.md.
13. Commit with message:
   feat: add validated data model and metrics engine
14. Push.
15. Create a new Codex thread for TASK 3 in this same project/repo with xhigh effort/thinking.
16. Seed the new thread with:
   - docs/handoffs/task-2-summary.md
   - TASK 3 instructions from PLAN.md
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
17. Stop this thread after creating the TASK 3 thread.

Important project constraints:
- Use React + TypeScript + Vite, npm, and Vite `base: '/tennis-prize-money/'`.
- Keep mock/sample data visibly labeled in code and UI.
- Do not fabricate real data.
- Do not assume a server runtime on GitHub Pages.
- Stage explicit paths and never delete user work.
- Every new Codex chat thread created from this project should use xhigh effort/thinking.
```
