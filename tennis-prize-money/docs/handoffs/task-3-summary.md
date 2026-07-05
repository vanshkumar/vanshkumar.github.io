# Task 3 Handoff

## Task Completed

Task 3 - Initial data sourcing and seed dataset.

## Files Changed

- `tennis-prize-money/README.md`
- `tennis-prize-money/LEARNINGS.md`
- `tennis-prize-money/docs/ARCHITECTURE.md`
- `tennis-prize-money/docs/DATA_CAVEATS.md`
- `tennis-prize-money/docs/DATA_MODEL.md`
- `tennis-prize-money/docs/DATA_SOURCES.md`
- `tennis-prize-money/docs/TASK_LOG.md`
- `tennis-prize-money/docs/handoffs/task-3-summary.md`
- `tennis-prize-money/src/components/DataModeBadge.tsx`
- `tennis-prize-money/src/components/MockBadge.tsx` removed
- `tennis-prize-money/src/data/dashboardDataset.ts`
- `tennis-prize-money/src/data/normalized/grandSlam2025MensSingles.json`
- `tennis-prize-money/src/data/normalized/mockTournamentEconomics.json` removed
- `tennis-prize-money/src/data/raw/source-metadata/grandSlam2025Sources.json`
- `tennis-prize-money/src/data/raw/source-metadata/mockSources.json` removed
- `tennis-prize-money/src/data/static/seedDatasetMetadata.json`
- `tennis-prize-money/src/data/static/mockDatasetMetadata.json` removed
- `tennis-prize-money/src/pages/DashboardPage.tsx`
- `tennis-prize-money/src/styles/main.css`
- `tennis-prize-money/src/test/dashboardMetrics.test.ts`
- `tennis-prize-money/src/test/fixtures/seedDatasetExpectations.ts`

## Current Branch

`feat/tennis-prize-economics-dashboard`

## Commit Hash

Pending until the Task 3 commit is created and pushed. The current thread final response and Task 4 thread seed must name the pushed Task 3 commit hash.

## Push Status

Pending until the Task 3 commit is pushed. The current thread final response and Task 4 thread seed must state whether push succeeded.

## Commands Run And Results

- `sed -n '1,240p' LEARNINGS.md`: read project memory before starting.
- `sed -n '1,260p' AGENTS.md`: read project instructions.
- `sed -n '1,280p' docs/PROJECT_PLAN.md`: read project plan.
- `sed -n '1,260p' docs/TASK_LOG.md`: read task history.
- `sed -n '1,300p' docs/DATA_MODEL.md`: read data model.
- `sed -n '1,300p' docs/DATA_CAVEATS.md`: read caveats.
- `sed -n '1,300p' docs/handoffs/task-2-summary.md`: read Task 2 handoff.
- `sed -n '260,620p' PLAN.md`: read Task 3 and Task 4 instructions.
- `git status --short --branch`: confirmed clean branch `feat/tennis-prize-economics-dashboard...origin/feat/tennis-prize-economics-dashboard`.
- `git rev-parse HEAD`: confirmed Task 2 commit `e150e0043e80efa516a9076204a0a2fd7a84c482`.
- `git rev-parse origin/feat/tennis-prize-economics-dashboard`: confirmed origin ref also pointed to `e150e0043e80efa516a9076204a0a2fd7a84c482`.
- `git log --oneline --decorate -5`: confirmed local and origin branch heads.
- Source research via web search/open/click: found official AO article/PDF, official Wimbledon PDF, official US Open URL with crawler limitation, and secondary Roland Garros prize-money table.
- `npm run test`: first pass passed, 1 file and 15 tests.
- `npm run lint`: passed.
- `npm run typecheck`: initially failed because `DataMode` was not re-exported and one fixture lookup needed a guard; fixed both.
- `npm run build`: initially failed for the same TypeScript issues; fixed both.
- `npm run lint`: passed after fixes.
- `npm run typecheck`: passed after fixes.
- `npm run test`: passed after fixes, 1 file and 15 tests.
- `npm run build`: passed after fixes.
- `git status --short`: reviewed changed files before task-boundary docs.
- `npm run lint`: final pass after documentation updates passed.
- `npm run typecheck`: final pass after documentation updates passed.
- `npm run test`: final pass after documentation updates passed, 1 file and 15 tests.
- `npm run build`: final pass after documentation updates passed.
- `git diff --check`: passed with no whitespace errors.

All npm commands used this PATH prefix because the shell does not have `npm` or `node` on PATH by default:

```bash
PATH=/Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin:/usr/bin:/bin:/usr/sbin:/sbin /Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin/npm ...
```

## Tests And Checks Status

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 15 tests.
- `npm run build`: passed.

## Known Issues

- No tournament-level revenue, profit, or surplus values are included yet, so prize-pool share of revenue/profit remains unavailable.
- Roland Garros should be upgraded to an official FFT/Roland Garros source when a clear source URL is found.
- US Open should be revisited with a parser or source adapter because the official URL did not expose crawler-readable text in this task.
- Source adapters and refresh automation are not implemented yet; Task 5 owns that pipeline.
- Parent GitHub Pages deployment workflow does not yet build or copy `tennis-prize-money/dist`.
- The refresh button remains disabled and marked not configured because no CLI/GitHub Actions refresh path or external dispatch endpoint exists yet.

## Assumptions Made

- One 2025 men's singles record per Grand Slam is an acceptable small seed dataset for Task 3.
- Event-level singles prize pools are the right scope when paired with singles round payouts.
- Derived prize pools from weighted 128-player main-draw payout tables should use `status: "derived"` and visible caveats.
- Missing tournament-level financials should remain unavailable rather than using organizer-level or press-estimated financial rows.
- Medium confidence is appropriate where the source is secondary or the official page was not parseable in this environment.

## Next Task Objective

Task 4 - First real visualizations and UX polish.

Turn the dashboard into a useful first-version product with charts, filters, empty states, unavailable states, caveats, responsive layout, and accessibility polish.

## Exact Instructions Used To Create The Next Codex Thread

Create the Task 4 Codex chat thread with xhigh effort/thinking.

Use this prompt to create the Task 4 thread, substituting the final pushed Task 3 commit hash from the current thread final response:

```markdown
You are Codex working in `/Users/vanshkumar/Documents/repos/vanshkumar.github.io/tennis-prize-money`, inside the larger `vanshkumar.github.io` repo.

Use xhigh effort/thinking for this thread.

Start from the latest pushed commit on `feat/tennis-prize-economics-dashboard`.

Task 3 was completed and pushed successfully.
Task 3 commit: `[SUBSTITUTE_FINAL_TASK_3_COMMIT_HASH]`.
Task 3 handoff: `docs/handoffs/task-3-summary.md`.

Before starting, read:
- `LEARNINGS.md`
- `AGENTS.md`
- `docs/PROJECT_PLAN.md`
- `docs/TASK_LOG.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/DATA_SOURCES.md`
- `docs/DATA_CAVEATS.md`
- `docs/handoffs/task-3-summary.md`

Then complete TASK 4 only.

TASK 4 - First real visualizations and UX polish

Goal:
Turn the dashboard into a useful first-version product.

Steps:
1. Read AGENTS.md, docs/PROJECT_PLAN.md, docs/TASK_LOG.md, docs/ARCHITECTURE.md, docs/DATA_MODEL.md, docs/DATA_SOURCES.md, docs/DATA_CAVEATS.md, and docs/handoffs/task-3-summary.md.
2. Check git status and confirm the latest pushed commit is present.
3. Implement charts:
   - payout curve by round
   - winner vs runner-up payout
   - prize pool vs revenue/profit where available
   - year-over-year prize pool growth
   - confidence/source coverage
4. Implement filters for tournament, year, event, and confidence.
5. Add empty states and unavailable states.
6. Add visible caveats where values are missing, estimated, mock, or semantically incompatible.
7. Improve responsive layout.
8. Add accessible labels and keyboard-friendly controls.
9. Add tests for display logic if practical.
10. Update README screenshots/instructions if practical.
11. Update docs/ARCHITECTURE.md if chart/data flow changed.
12. Run lint, typecheck, test, and build.
13. Update docs/TASK_LOG.md.
14. Create docs/handoffs/task-4-summary.md.
15. Commit with message:
   feat: add dashboard visualizations and filtering
16. Push.
17. Create a new Codex thread for TASK 5 in this same project/repo with xhigh effort/thinking.
18. Seed the new thread with:
   - docs/handoffs/task-4-summary.md
   - TASK 5 instructions from PLAN.md
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
19. Stop this thread after creating the TASK 5 thread.

Important project constraints:
- Use React + TypeScript + Vite, npm, and Vite `base: '/tennis-prize-money/'`.
- Keep mock/sample data visibly labeled in code and UI if mock rows are introduced.
- Do not fabricate real data.
- Do not assume a server runtime on GitHub Pages.
- Stage explicit paths and never delete user work.
- Every new Codex chat thread created from this project should use xhigh effort/thinking.
```

The next Codex thread must be created with xhigh effort/thinking.
