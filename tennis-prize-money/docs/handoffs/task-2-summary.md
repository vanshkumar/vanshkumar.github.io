# Task 2 Handoff

## Task Completed

Task 2 - Data schema, validation, and calculation engine.

## Files Changed

- `tennis-prize-money/README.md`
- `tennis-prize-money/LEARNINGS.md`
- `tennis-prize-money/docs/ARCHITECTURE.md`
- `tennis-prize-money/docs/DATA_CAVEATS.md`
- `tennis-prize-money/docs/DATA_MODEL.md`
- `tennis-prize-money/docs/TASK_LOG.md`
- `tennis-prize-money/docs/handoffs/task-2-summary.md`
- `tennis-prize-money/src/data/dashboardDataset.ts`
- `tennis-prize-money/src/data/normalized/mockTournamentEconomics.json`
- `tennis-prize-money/src/data/raw/source-metadata/mockSources.json`
- `tennis-prize-money/src/data/schemas.ts`
- `tennis-prize-money/src/data/static/mockDatasetMetadata.json`
- `tennis-prize-money/src/lib/dashboardMetrics.ts`
- `tennis-prize-money/src/lib/metricEngine.ts`
- `tennis-prize-money/src/pages/DashboardPage.tsx`
- `tennis-prize-money/src/styles/main.css`
- `tennis-prize-money/src/test/dashboardMetrics.test.ts`
- Removed `tennis-prize-money/src/data/mockDashboardData.ts`
- Removed `tennis-prize-money/src/data/mockPrizeEconomics.json`

## Current Branch

`feat/tennis-prize-economics-dashboard`

## Commit Hash

Pending until the Task 2 commit is created and pushed. The current thread final response and Task 3 thread seed must name the pushed Task 2 commit hash.

## Push Status

Pending until the Task 2 commit is pushed. The current thread final response and Task 3 thread seed must state whether push succeeded.

## Commands Run And Results

- `cat LEARNINGS.md`: read app-local project memory before starting.
- `cat AGENTS.md`: read project instructions.
- `cat docs/PROJECT_PLAN.md`: read project plan.
- `cat docs/TASK_LOG.md`: read task log.
- `cat docs/ARCHITECTURE.md`: read Task 1 architecture.
- `cat docs/handoffs/task-1-summary.md`: read Task 1 handoff.
- `git status --short --branch`: confirmed clean branch `feat/tennis-prize-economics-dashboard...origin/feat/tennis-prize-economics-dashboard`.
- `git branch --show-current`: confirmed `feat/tennis-prize-economics-dashboard`.
- `git rev-parse HEAD`: confirmed Task 1 commit `c838e35ef1cd932f3d4f8b0a4118443c767e43c9`.
- `git rev-parse origin/feat/tennis-prize-economics-dashboard`: confirmed local origin ref also pointed to `c838e35ef1cd932f3d4f8b0a4118443c767e43c9`.
- `git log --oneline --decorate -5`: confirmed `HEAD` and `origin/feat/tennis-prize-economics-dashboard` pointed at the Task 1 commit.
- `rg --files`: inspected scaffold files.
- `cat package.json`: confirmed npm scripts and dependencies.
- `cat src/data/mockDashboardData.ts`, `cat src/data/mockPrizeEconomics.json`, `cat src/lib/dashboardMetrics.ts`, `cat src/pages/DashboardPage.tsx`, `cat src/test/dashboardMetrics.test.ts`, and component/style files: inspected Task 1 data and UI.
- `npm run typecheck`: initially failed because `expectIntegerInRange` needed an explicit `typeof value === 'number'` guard for TypeScript narrowing.
- `npm run test`: passed during the early implementation pass.
- `npm run lint`: passed.
- `npm run typecheck`: passed after the narrowing fix.
- `npm run test`: passed, 1 test file and 9 tests.
- `npm run build`: passed.
- `cat PLAN.md`: read Task 3 and later project instructions for the next-thread seed.

All npm commands used this PATH prefix because the shell does not have `npm` or `node` on PATH by default:

```bash
PATH=/Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin:/usr/bin:/bin:/usr/sbin:/sbin /Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin/npm ...
```

## Tests And Checks Status

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 9 tests.
- `npm run build`: passed.

## Known Issues

- The dataset is still mock/sample only; no real tournament data has been added.
- Parent GitHub Pages deployment workflow does not yet build or copy `tennis-prize-money/dist`.
- The refresh button remains disabled and marked not configured because no CLI/GitHub Actions refresh path or external dispatch endpoint exists yet.
- The Vitest setup still relies on default Node behavior and does not define a `test` block in `vite.config.ts` to avoid Vite/Vitest nested type conflicts.
- The handoff cannot include its own final commit hash before the commit exists; use the current thread final response and Task 3 seed for the actual pushed hash.

## Assumptions Made

- Custom runtime validation is an acceptable Zod-equivalent for Task 2 and avoids adding a new dependency.
- Task 2 should keep all sample values fictional rather than introduce unsourced real data.
- `tournament_revenue` and `event_revenue` are compatible revenue denominators for prize-pool share.
- `tournament_profit` and `tournament_surplus` are compatible profit/surplus denominators for prize-pool share.
- Organizer-level revenue/profit/surplus and expenses should remain semantically incompatible with a single tournament/event prize pool unless a later task adds a clearer normalization model.

## Next Task Objective

Task 3 - Initial data sourcing and seed dataset.

Add a small but honest Grand Slam seed dataset, using real verified data where available and mock/sample rows only where clearly labeled.

## Exact Instructions For The Next Codex Thread

Create the Task 3 Codex chat thread with xhigh effort/thinking.

Use this prompt to create the Task 3 thread, substituting the final pushed Task 2 commit hash from the current thread final response:

```markdown
You are Codex working in `/Users/vanshkumar/Documents/repos/vanshkumar.github.io/tennis-prize-money`, inside the larger `vanshkumar.github.io` repo.

Use xhigh effort/thinking for this thread.

Start from the latest pushed commit on `feat/tennis-prize-economics-dashboard`.

Task 2 was completed and pushed successfully.
Task 2 commit: `[SUBSTITUTE_FINAL_TASK_2_COMMIT_HASH]`.
Task 2 handoff: `docs/handoffs/task-2-summary.md`.

Before starting, read:
- `LEARNINGS.md`
- `AGENTS.md`
- `docs/PROJECT_PLAN.md`
- `docs/TASK_LOG.md`
- `docs/DATA_MODEL.md`
- `docs/DATA_CAVEATS.md`
- `docs/handoffs/task-2-summary.md`

Then complete TASK 3 only.

TASK 3 - Initial data sourcing and seed dataset

Goal:
Add a small but honest seed dataset for the Grand Slams, using real verified data where available and mock/sample rows only where clearly labeled.

Steps:
1. Read AGENTS.md, docs/PROJECT_PLAN.md, docs/TASK_LOG.md, docs/DATA_MODEL.md, docs/DATA_CAVEATS.md, and docs/handoffs/task-2-summary.md.
2. Check git status and confirm the latest pushed commit is present.
3. Research official or high-quality sources if internet access is available.
4. Prefer official tournament prize-money pages, annual reports, Form 990s, official financial statements, and official press releases.
5. Add real data only when source URLs and semantics are clear.
6. If internet access is unavailable, create source-adapter scaffolding and keep sample data clearly labeled mock.
7. Create/update docs/DATA_SOURCES.md with:
   - source inventory
   - URL
   - publisher
   - data fields covered
   - confidence
   - known limitations
   - whether the adapter is implemented
8. Create/update docs/DATA_CAVEATS.md.
9. Ensure every real data row has source metadata.
10. Ensure the UI shows confidence and source links.
11. Add tests/fixtures validating the seed dataset.
12. Run lint, typecheck, test, and build.
13. Update docs/TASK_LOG.md.
14. Create docs/handoffs/task-3-summary.md.
15. Commit with message:
   feat: add sourced seed dataset and source documentation
16. Push.
17. Create a new Codex thread for TASK 4 in this same project/repo with xhigh effort/thinking.
18. Seed the new thread with:
   - docs/handoffs/task-3-summary.md
   - TASK 4 instructions from PLAN.md
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
19. Stop this thread after creating the TASK 4 thread.

Important project constraints:
- Use React + TypeScript + Vite, npm, and Vite `base: '/tennis-prize-money/'`.
- Keep mock/sample data visibly labeled in code and UI.
- Do not fabricate real data.
- Do not assume a server runtime on GitHub Pages.
- Stage explicit paths and never delete user work.
- Every new Codex chat thread created from this project should use xhigh effort/thinking.
```

The next Codex thread must be created with xhigh effort/thinking.
