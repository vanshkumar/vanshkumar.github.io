# Primary Question Data Normalization Slice

## Task Completed

Normalized the first primary-question-ready data slice for the dashboard: full-tournament Wimbledon rows with compatible operating-company financial denominators, plus Australian Open full-tournament prize-money numerator rows.

## Files Changed

- `tennis-prize-money/CHANGELOG.md`
- `tennis-prize-money/README.md`
- `tennis-prize-money/docs/ARCHITECTURE.md`
- `tennis-prize-money/docs/DATA_CAVEATS.md`
- `tennis-prize-money/docs/DATA_MODEL.md`
- `tennis-prize-money/docs/DATA_SOURCES.md`
- `tennis-prize-money/docs/FUTURE_WORK.md`
- `tennis-prize-money/docs/TASK_LOG.md`
- `tennis-prize-money/docs/handoffs/primary-question-data-normalization-slice.md`
- `tennis-prize-money/src/data/dashboardDataset.ts`
- `tennis-prize-money/src/data/normalized/grandSlam2025MensSingles.json`
- `tennis-prize-money/src/data/raw/source-metadata/grandSlam2025Sources.json`
- `tennis-prize-money/src/data/schemas.ts`
- `tennis-prize-money/src/data/static/seedDatasetMetadata.json`
- `tennis-prize-money/src/lib/dashboardMetrics.ts`
- `tennis-prize-money/src/lib/metricEngine.ts`
- `tennis-prize-money/src/pages/DashboardPage.tsx`
- `tennis-prize-money/src/test/dashboardMetrics.test.ts`
- `tennis-prize-money/src/test/dataValidation.test.ts`
- `tennis-prize-money/src/test/fixtures/seedDatasetExpectations.ts`

## Current Branch

`main`

## Commit Hash

Pending until this handoff is committed.

## Push Status

Pending until the commit is pushed to `origin/main`.

## Commands Run And Results

- `sed -n '1,260p' LEARNINGS.md` - read project memory before starting.
- `git status --short --branch` - started detached at `9038940`, then moved to `main`.
- `git fetch origin main` - passed with approval.
- `git switch main` - initial sandboxed run failed on git metadata; approved retry passed and `main` was up to date.
- Official source verification:
  - Opened Wimbledon 2025 and 2024 prize-money PDFs.
  - Opened Companies House filing history for company `07546773`.
  - Downloaded and rendered the 2025 AELTC Championships Ltd accounts PDF to verify the image-scanned profit-and-loss table.
  - Opened AO 2025 article and AO25 prize-money PDF.
  - Tried to fetch official US Open pages; they were not crawler-readable in this environment.
- Spawned three xhigh source-verification helpers for Wimbledon, Australian Open, and US Open.
- `npm ci` - passed; installed locked dependencies in this worktree.
- `npm run test -- --run` - initially failed on a fixture-order assumption after full-tournament rows were prepended, then passed after targeting the AO men's singles row explicitly.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm run refresh:data` - passed; validated static JSON and updated `lastRefreshedAt`.

All npm commands used this PATH prefix:

```bash
PATH=/Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin:/usr/bin:/bin:/usr/sbin:/sbin /Users/vanshkumar/.local/share/mise/installs/node/24.16.0/bin/npm ...
```

## Tests And Checks Status

- `npm run lint`: passed before handoff finalization.
- `npm run typecheck`: passed before handoff finalization.
- `npm run test -- --run`: passed, 4 test files and 36 tests.
- `npm run refresh:data`: passed.
- Final `npm run lint`: passed.
- Final `npm run typecheck`: passed.
- Final `npm run test -- --run`: passed, 4 test files and 36 tests.
- Final `npm run build`: passed.

## Implementation Notes

- Added `prizeMoneyScope` to every normalized record.
- Added financial `scopeLabel` for precise denominator labels in the UI.
- Added `incompatible_scope` as a metric unavailable reason.
- Financial ratios now require:
  - `tournament_total` prize-money scope for tournament revenue/profit/surplus denominators.
  - `event_main_draw` prize-money scope for event revenue denominators.
- Wimbledon 2025 normalized values:
  - Prize money: GBP 53,500,000.
  - AELTC Championships Ltd turnover: GBP 423,626,000.
  - AELTC Championships Ltd operating profit: GBP 52,720,000.
- Wimbledon 2024 normalized values:
  - Prize money: GBP 50,000,000.
  - AELTC Championships Ltd turnover: GBP 406,507,000.
  - AELTC Championships Ltd operating profit: GBP 54,332,000.
- Australian Open 2025 normalized value:
  - Prize money: AUD 96,500,000.
- Australian Open 2024 normalized value:
  - Prize money: AUD 86,500,000.

## Known Issues

- US Open full-tournament totals remain research leads because the official US Open pages were not crawler-readable and the values are total player compensation/purse, including support/expense coverage, rather than clean competition prize money in the current model.
- Roland Garros total prize money and revenue remain secondary/caveated leads only.
- The normalized records file name still references `grandSlam2025MensSingles`; docs now note that the historical filename contains full-tournament rows too.
- No visual browser QA was run for this data slice before this handoff was written.

## Assumptions Made

- AELTC Championships Ltd turnover is a compatible Wimbledon revenue denominator when labeled as Championships operating-company turnover.
- AELTC Championships Ltd operating profit is a compatible profit denominator when labeled as Championships operating-company operating profit.
- The division of net available surplus to LTA Operations is not profit and should not be normalized as a denominator.
- Australian Open total prize pool values are safe to normalize as full-tournament prize-money numerators, but Tennis Australia annual reports remain organization-level context rather than AO tournament denominators.

## Next Task Objective

Model or source US Open full-tournament prize money cleanly. The next task should either add a schema distinction for competition prize money versus total player compensation/support or find a parseable official US Open competition-prize total. Keep US Open revenue/profit unavailable unless tournament-specific financial denominators are verified.

## Next Thread Instructions

Use xhigh effort/thinking for this thread.

You are Codex working in `/Users/vanshkumar/Documents/repos/vanshkumar.github.io/tennis-prize-money`, inside the larger `vanshkumar.github.io` repo. Work from latest `main`.

Before starting, read in full:

- `LEARNINGS.md`
- `AGENTS.md`
- `README.md`
- `docs/TASK_LOG.md`
- `docs/DATA_MODEL.md`
- `docs/DATA_SOURCES.md`
- `docs/DATA_CAVEATS.md`
- `docs/FUTURE_WORK.md`
- `docs/handoffs/primary-question-data-normalization-slice.md`

Goal: continue the primary-question data expansion without weakening source semantics. Start with the US Open modeling blocker: determine whether to extend the schema for total player compensation/support versus competition prize money, or find a parseable official US Open competition-prize total. Keep revenue/profit unavailable unless tournament-specific denominators are verified.

Do not fabricate data. Use official sources first. Keep organization-level financials separate from tournament/event denominators. Run lint, typecheck, tests, build, and relevant refresh validation. Update docs, task log, project memory, and handoff. Commit and push to `main` when complete.

The next Codex thread must be created with xhigh effort/thinking.
