# Task 4 Handoff

## Task Completed

Task 4 - First real visualizations and UX polish.

## Files Changed

- `tennis-prize-money/README.md`
- `tennis-prize-money/LEARNINGS.md`
- `tennis-prize-money/docs/ARCHITECTURE.md`
- `tennis-prize-money/docs/TASK_LOG.md`
- `tennis-prize-money/docs/handoffs/task-4-summary.md`
- `tennis-prize-money/src/lib/dashboardMetrics.ts`
- `tennis-prize-money/src/pages/DashboardPage.tsx`
- `tennis-prize-money/src/styles/main.css`
- `tennis-prize-money/src/test/dashboardMetrics.test.ts`

## Current Branch

`feat/tennis-prize-economics-dashboard`

## Commit Hash

Pending until the Task 4 commit is created and pushed. The current thread final response and Task 5 thread seed must name the pushed Task 4 commit hash.

## Push Status

Pending until the Task 4 commit is pushed. The current thread final response and Task 5 thread seed must state whether push succeeded.

## Commands Run And Results

- `cat LEARNINGS.md`: read project memory before starting.
- `cat AGENTS.md`: read project instructions.
- `cat docs/PROJECT_PLAN.md`: read project plan.
- `cat docs/TASK_LOG.md`: read task history.
- `cat docs/ARCHITECTURE.md`: read architecture.
- `cat docs/DATA_MODEL.md`: read data model.
- `cat docs/DATA_SOURCES.md`: read data sources.
- `cat docs/DATA_CAVEATS.md`: read caveats.
- `cat docs/handoffs/task-3-summary.md`: read Task 3 handoff.
- `cat PLAN.md`: read full serial task plan and Task 5 instructions.
- `git status --short --branch`: confirmed clean branch `feat/tennis-prize-economics-dashboard...origin/feat/tennis-prize-economics-dashboard`.
- `git rev-parse HEAD`: confirmed Task 3 commit `e865a0b455e332cc60145697c01489f617c73595`.
- `git rev-parse origin/feat/tennis-prize-economics-dashboard`: confirmed origin ref also pointed to `e865a0b455e332cc60145697c01489f617c73595`.
- Code inspection via `rg --files`, `cat package.json`, and `sed` on source, test, data, and style files.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 1 test file and 19 tests.
- `npm run build`: passed.

All npm commands used this PATH prefix because the shell does not have `npm` or `node` on PATH by default:

```bash
PATH=/Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin:/usr/bin:/bin:/usr/sbin:/sbin /Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin/npm ...
```

## Tests And Checks Status

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 19 tests.
- `npm run build`: passed.

## Implementation Notes

- Added chart-ready display helpers in `src/lib/dashboardMetrics.ts` for finalist rows, financial rows, year-over-year rows, coverage summaries, and visible caveats.
- Kept charting dependency-free by rendering CSS bars and an SVG payout curve in `DashboardPage.tsx`.
- Filters now produce an explicit no-match empty state rather than falling back to the first record.
- Financial comparison rows show revenue and profit/surplus as unavailable for the current seed because no compatible tournament-level denominators exist.
- Year-over-year growth shows an unavailable state because the current seed includes only 2025 rows.
- Coverage now summarizes both filtered records and linked sources by confidence.
- Added labeled filter controls, reset buttons, focus-visible styling, aria labels, and responsive chart layout.

## Known Issues

- No tournament-level revenue, profit, or surplus values are included yet, so prize-pool share of revenue/profit remains unavailable.
- No prior-year records are included yet, so year-over-year growth remains unavailable.
- Roland Garros should be upgraded to an official FFT/Roland Garros source when a clear source URL is found.
- US Open should be revisited with a parser or source adapter because the official URL did not expose crawler-readable text in Task 3.
- Source adapters and refresh automation are not implemented yet; Task 5 owns that pipeline.
- Parent GitHub Pages deployment workflow does not yet build or copy `tennis-prize-money/dist`.
- The refresh button remains disabled and marked not configured because no CLI/GitHub Actions refresh path or external dispatch endpoint exists yet.

## Assumptions Made

- Dependency-free CSS/SVG charts are sufficient for the first product-quality visualization pass.
- The selected record can remain the first record in the active filter set for now; tournament/year/event/confidence filters let users focus the record they need.
- It is better to show unavailable financial and year-over-year panels than to hide them, because those missing values are important product information.
- README screenshot assets were not added because the app has no existing screenshot workflow; README instructions were updated instead.

## Next Task Objective

Task 5 - On-demand refresh pipeline.

Create the first version of the refresh system without exposing secrets.

## Exact Instructions Used To Create The Next Codex Thread

Create the Task 5 Codex chat thread with xhigh effort/thinking.

Use this prompt to create the Task 5 thread, substituting the final pushed Task 4 commit hash from the current thread final response:

```markdown
You are Codex working in `/Users/vanshkumar/Documents/repos/vanshkumar.github.io/tennis-prize-money`, inside the larger `vanshkumar.github.io` repo.

Use xhigh effort/thinking for this thread.

Start from the latest pushed commit on `feat/tennis-prize-economics-dashboard`.

Task 4 was completed and pushed successfully.
Task 4 commit: `[SUBSTITUTE_FINAL_TASK_4_COMMIT_HASH]`.
Task 4 handoff: `docs/handoffs/task-4-summary.md`.

Before starting, read:
- `LEARNINGS.md`
- `AGENTS.md`
- `docs/PROJECT_PLAN.md`
- `docs/TASK_LOG.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/DATA_SOURCES.md`
- `docs/DATA_CAVEATS.md`
- `docs/handoffs/task-4-summary.md`

Then complete TASK 5 only.

TASK 5 - On-demand refresh pipeline

Goal:
Create the first version of the refresh system without exposing secrets.

Steps:
1. Read AGENTS.md, docs/PROJECT_PLAN.md, docs/TASK_LOG.md, docs/ARCHITECTURE.md, docs/DATA_MODEL.md, docs/DATA_SOURCES.md, docs/DATA_CAVEATS.md, and docs/handoffs/task-4-summary.md.
2. Check git status and confirm the latest pushed commit is present.
3. Add a server-side data refresh module with source-adapter interfaces:
   - fetch raw/source data
   - normalize
   - validate
   - merge
   - write static JSON output
4. Add npm run refresh:data or equivalent package-manager script.
5. Add safe logging and failure handling.
6. Add .env.example.
7. Add GitHub Actions workflow:
   - manual workflow_dispatch
   - install deps
   - run tests if reasonable
   - run refresh:data
   - commit changed static JSON if any
   - push back to the branch
8. Add optional refresh dispatch integration:
   - assume GitHub Pages static hosting by default
   - do not rely on an in-app `/api/refresh` route unless a separate serverless deployment target is explicitly configured
   - requires server-side GitHub token env var
   - requires user-provided refresh token/passphrase in a header or body
   - dispatches the GitHub Action
   - never exposes secrets to the browser bundle
   - returns clear status messages
9. Wire the dashboard refresh button to the configured refresh endpoint when one exists.
10. If refresh endpoint configuration is missing, button should say refresh is not configured and link to docs.
11. Add docs/REFRESH_PIPELINE.md explaining:
   - local refresh
   - GitHub Action refresh
   - optional external serverless dispatch refresh
   - required env vars/secrets
   - security caveats
12. Update docs/DEPLOYMENT.md with the recommended deployment path: existing GitHub Pages workflow from the parent repo, including the required app build/copy steps. Mention any optional serverless refresh backend separately.
13. Add tests for refresh module using fixtures/mocked fetches.
14. Run lint, typecheck, test, and build.
15. Update docs/TASK_LOG.md.
16. Create docs/handoffs/task-5-summary.md.
17. Commit with message:
   feat: add on-demand data refresh pipeline
18. Push.
19. Create a new Codex thread for TASK 6 in this same project/repo with xhigh effort/thinking.
20. Seed the new thread with:
   - docs/handoffs/task-5-summary.md
   - TASK 6 instructions from PLAN.md
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
21. Stop this thread after creating the TASK 6 thread.

Important project constraints:
- Use React + TypeScript + Vite, npm, and Vite `base: '/tennis-prize-money/'`.
- Keep mock/sample data visibly labeled in code and UI if mock rows are introduced.
- Do not fabricate real data.
- Do not assume a server runtime on GitHub Pages.
- Never expose secrets to browser code.
- Stage explicit paths and never delete user work.
- Every new Codex chat thread created from this project should use xhigh effort/thinking.
```

The next Codex thread must be created with xhigh effort/thinking.
