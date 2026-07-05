# Primary Question Visual Rehash And Data Sweep

## Task Completed

Refocused the dashboard visuals on the primary product question: how much tennis players earn in prize money as a percentage of tournament revenue and tournament profit/surplus.

Also launched parallel xhigh research agents to gather source leads for that question.

## Files Changed

- `tennis-prize-money/CHANGELOG.md`
- `tennis-prize-money/README.md`
- `tennis-prize-money/docs/ARCHITECTURE.md`
- `tennis-prize-money/docs/DATA_CAVEATS.md`
- `tennis-prize-money/docs/DATA_MODEL.md`
- `tennis-prize-money/docs/DATA_SOURCES.md`
- `tennis-prize-money/docs/FUTURE_WORK.md`
- `tennis-prize-money/docs/TASK_LOG.md`
- `tennis-prize-money/docs/handoffs/primary-question-visual-rehash-and-data-sweep.md`
- `tennis-prize-money/src/lib/dashboardMetrics.ts`
- `tennis-prize-money/src/pages/DashboardPage.tsx`
- `tennis-prize-money/src/styles/main.css`
- `tennis-prize-money/src/test/dashboardMetrics.test.ts`

## Current Branch

`feat/tennis-prize-economics-dashboard`

## Commit Hash

Pending until these changes are committed.

## Push Status

Pending until these changes are pushed.

## Commands Run And Results

- `cat LEARNINGS.md` - read project memory before starting, then reread after fast-forwarding.
- `git status --short --branch` - showed local branch was behind remote and one unrelated untracked vault note outside this app.
- `git merge --ff-only origin/feat/tennis-prize-economics-dashboard` - passed with approval; updated local worktree to the merged v0.1 and deployment baseline.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run test -- --run` - passed, 4 test files and 34 tests.
- `npm run build` - passed.
- `npm run dev -- --host 127.0.0.1 --port 5177` - initial sandboxed run failed with `EPERM`; approved run succeeded.
- Browser visual QA - desktop and mobile sanity checks passed. Mobile had no horizontal overflow, and the refresh panel was moved out of the hero so the first answer card appears in the opening mobile viewport.

All npm commands used this PATH prefix:

```bash
PATH=/Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin:/usr/bin:/bin:/usr/sbin:/sbin /Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin/npm ...
```

## Tests And Checks Status

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test -- --run`: passed, 34 tests.
- `npm run build`: passed.
- Desktop visual QA: passed.
- Mobile visual QA: passed.

## Implementation Notes

- `DashboardPage.tsx` now renders the primary answer board immediately after the selected comparison.
- `dashboardMetrics.ts` now exposes primary-question rows, answerability coverage rows, and primary-question caveats.
- The main dashboard no longer foregrounds payout curves, finalist comparisons, year-over-year rows, or broad source coverage because those do not answer the primary revenue/profit-share question.
- Refresh remains available but is now supporting status rather than first-viewport content.
- Existing calculation helpers for payout curves, finalist ratios, and year-over-year growth remain in code and tests for future reuse.

## Data Gathering Agents

Five xhigh research agents were launched:

- Wimbledon / AELTC Championships
- US Open / USTA
- Australian Open / Tennis Australia
- Roland Garros / FFT
- Methodology and data-model fit

Summary of findings:

- Wimbledon is the strongest next production candidate: official total-prize-money PDFs plus AELTC Championships Ltd turnover in Companies House filings. Operating profit may be usable only with a clear operating-company caveat; LTA distribution should not be treated as profit.
- Australian Open has strong official 2024/2025 total-prize-money numerator data, but Tennis Australia annual reports are organization-level and should not be used as AO tournament denominators.
- US Open has strong official total player-compensation/prize-package numerator data, but USTA Form 990 values are organization-wide; secondary operating-revenue leads need primary confirmation.
- Roland Garros has prize-money and revenue leads, but revenue is currently secondary/caveated and no tournament-level profit/surplus was found.
- The primary ratio should prefer full tournament prize-money totals. Event-level singles rows should remain partial or unavailable when paired with tournament-level denominators.

## Known Issues

- No new financial values were normalized into the app during this task.
- Current active records still represent 2025 men's singles event-level prize pools, not full tournament prize-money totals.
- The primary answer cards still show unavailable for all active records because no compatible denominators are present in JSON.
- The unrelated untracked file `../vault/questions/What is the future of the university?.md` remains outside the app and was not touched.

## Assumptions Made

- It is better to reframe the dashboard before adding new data so future source work is guided by the primary product question.
- Research-agent findings should be captured as leads until primary source verification and schema-fit work are done.
- Full tournament prize-money totals are the correct first numerator target for the dashboard's main question.

## Next Task Objective

Normalize the first primary-question-ready data slice, starting with Wimbledon tournament-total prize money and AELTC Championships Ltd turnover/profit candidates if source verification confirms the semantics.

The next Codex thread, if created for this project, must use xhigh effort/thinking.
