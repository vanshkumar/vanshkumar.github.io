You are Codex working in the current folder. Build a first version of a “Tennis Prize Money Economics” dashboard.

The product goal:
Create a static-first web dashboard that shows tennis tournament prize money in relation to tournament revenue/profit/surplus where available, including winner vs runner-up payouts, payout curves by round, prize-pool share of revenue, prize-pool share of profit/surplus, source confidence, and clear caveats about unavailable, estimated, semantically incompatible, or mock data.

Repository-specific context:
- `tennis-prize-money/` lives inside the larger `vanshkumar.github.io` personal-site Git repo. Treat it as a sibling app folder, not as a standalone repository root.
- The parent repo is an Astro 5 static site deployed to GitHub Pages. Deployed side apps such as `coffee-rush/` and `terminal-desires-ranker/` are independent React 18 + Vite apps with their own `package.json`, lockfile, Vite config, README, tests, and build output copied into the final Pages artifact. `vault-weather/` is also React/Vite but is local-only.
- Prefer the existing side-app pattern for this dashboard: a TypeScript React + Vite app under `tennis-prize-money/`, built as a static subpath app at `/tennis-prize-money/`.
- The parent repo uses npm and GitHub Actions with Node 24. Use npm for this app as well. Do not introduce pnpm/yarn.
- Keep app-local work inside `tennis-prize-money/` where possible. When a task must update parent-level files such as `.github/workflows/deploy.yml`, root `README.md`, root `TECH_STACK.md`, or root `LEARNINGS.md`, do so deliberately, stage explicit paths, and document that cross-folder change in the handoff.
- The existing GitHub Pages workflow builds the Astro site, builds deployed sibling apps, assembles a `site/` artifact, keeps `site/.nojekyll`, and uploads hidden files. When this app becomes deployable, add analogous install/build/copy steps for `tennis-prize-money/`.
- GitHub Pages does not provide a server-side runtime. For v0.1, make CLI refresh and GitHub Actions refresh the primary refresh paths. Any browser-triggered refresh API must be optional and backed by a separate serverless host or worker; the dashboard must clearly show "not configured" when no safe refresh endpoint exists.
- Deployed sibling apps include analytics directly in their `index.html` and any GitHub Pages SPA fallback `public/404.html`. Follow that convention if the dashboard is deployed and uses an app-local fallback.

You are expected to actively manage Codex threads. This is a serial, multi-thread build. Do not merely write prompts for the user to paste manually. At each task boundary, create the next Codex thread yourself in this same project/repo, seeded with the handoff doc and next task instructions.

Operating rules:
1. Work serially across separate Codex threads.
2. Each major task must be completed in its own Codex thread.
3. Do not begin a later major task until the current task is implemented, documented, tested, committed, and pushed.
4. After each major task, create/update documentation, run checks, commit, and push.
5. After each major task, create a new Codex thread for the next task in this same project/repo.
6. Every new Codex chat thread created for this project must use xhigh effort/thinking. Set the thread creation tool's thinking/reasoning option to `xhigh` when available, and include "Use xhigh effort/thinking for this thread." in the seed prompt.
7. The next thread must start from the latest pushed commit.
8. The current thread must not continue implementing the next major task after creating the next thread.
9. At every task boundary, write a complete handoff file under docs/handoffs/.
10. The current thread’s final response should summarize the completed task, confirm commit/push status, name the next thread it created, and point to the handoff doc.
11. If a task has safely parallelizable subtasks, the current task thread may create subagents/background helper threads for research, review, testing, or inspection, but the primary task thread owns final edits, checks, commit, and push.
12. Never force-push.
13. Never delete user work.
14. Before each task, check git status.
15. Use the current branch unless it is clearly inappropriate. If starting from main/master and no feature branch exists, create a feature branch named feat/tennis-prize-economics-dashboard.
16. If push fails due to auth/remote issues, still commit locally, document the exact failure in the handoff, and proceed only as far as possible without pretending push succeeded.
17. Do not fabricate real data.
18. Mock/sample data must be visibly labeled as mock/sample in both code and UI.
19. Real financial and prize data must include source URLs, source type, retrieved/accessed date, and confidence labels.
20. Prefer official sources. If official data is unavailable, use reputable secondary sources only with a lower confidence label and a visible note.
21. Do not put secrets in client-side code.
22. Add .env.example, but never commit real tokens.
23. Make pragmatic product decisions without asking questions unless blocked by secrets, destructive operations, or missing repo access.

Default technical choices:
- If this folder is empty or not already a web app, create an independent TypeScript React + Vite app matching the existing sibling app pattern.
- Configure Vite for GitHub Pages subpath deployment with `base: '/tennis-prize-money/'`.
- Use TypeScript throughout.
- Use schema validation for data, preferably Zod or equivalent.
- Use a maintainable charting library compatible with a static Vite app, such as Recharts, Observable Plot, ECharts, or similar.
- Use Vitest, ESLint, and a TypeScript typecheck script.
- Use simple CSS. Avoid overengineering the design system.
- Use npm and an app-local `package.json`/lockfile, consistent with sibling apps.
- Do not assume Next.js API routes or a server runtime. Build refresh capabilities around static JSON, Node CLI scripts, GitHub Actions, and an optional externally hosted serverless endpoint.

Documentation requirements:
Create or update these docs over time:
- README.md
- AGENTS.md
- CHANGELOG.md
- docs/PROJECT_PLAN.md
- docs/ARCHITECTURE.md
- docs/DATA_MODEL.md
- docs/DATA_SOURCES.md
- docs/DATA_CAVEATS.md
- docs/REFRESH_PIPELINE.md
- docs/DEPLOYMENT.md
- docs/FUTURE_WORK.md
- docs/TASK_LOG.md
- docs/handoffs/

Each handoff file must include:
- task completed
- files changed
- current branch
- commit hash
- whether push succeeded
- commands run and results
- tests/checks status
- known issues
- assumptions made
- next task objective
- exact instructions used to create the next Codex thread
- confirmation that the next Codex thread must be created with xhigh effort/thinking

The app should eventually support:
- Static JSON data loaded by the dashboard.
- A Node/CI refresh path that can fetch/normalize data.
- A refresh button in the dashboard.
- A CLI refresh script, e.g. npm run refresh:data.
- A GitHub Actions workflow that can refresh data and commit updated JSON.
- An optional externally hosted serverless API endpoint that dispatches the GitHub Action, protected by server-side credentials and a user-provided refresh token/passphrase. This is not part of GitHub Pages static hosting unless a separate backend is configured.
- Graceful fallback when refresh is not configured.

Core v0.1 dashboard requirements:
- Home dashboard page.
- Filters for tournament, year, event, and data-confidence level.
- KPI cards:
  - total prize pool
  - reported revenue, if available
  - reported profit/surplus, if available
  - prize pool as % of revenue
  - prize pool as % of profit/surplus
  - winner payout
  - runner-up payout
  - winner/runner-up payout ratio
- Visualizations:
  - payout curve by round
  - winner vs runner-up comparison
  - total prize pool vs revenue/profit where available
  - year-over-year prize pool growth
  - source coverage/confidence summary
- Sources/caveats panel that makes clear which values are official, reported, estimated, derived, unavailable, or mock.
- Refresh button that is disabled or clearly marked “not configured” unless a safe refresh endpoint/configuration is present.
- Last refreshed timestamp.

Data model requirements:
Represent tournaments, years, events, prize-money rows, financial rows, sources, and derived metrics.

Every real data point should be traceable to a source:
- source id
- title
- publisher/organization
- URL
- accessedAt/retrievedAt date
- source type:
  - official_report
  - annual_report
  - form_990
  - official_prize_money_page
  - press_release
  - reputable_secondary
  - manual_verified
  - mock
- confidence:
  - high
  - medium
  - low
  - mock
- notes

Financial model should distinguish:
- tournament revenue
- organizer revenue
- tournament profit
- organizer surplus/profit
- expenses
- unknown/unavailable

Do not collapse these into one vague “profit” field.

Prize-money model should distinguish:
- tournament
- year
- event, e.g. men’s singles, women’s singles, men’s doubles, women’s doubles, mixed doubles, qualifying
- round
- amount
- currency
- whether amount is per player, per team, or total allocation
- source
- confidence

Derived metric requirements:
- Only compute percentages when numerator and denominator are compatible.
- Do not compare currencies without explicit conversion.
- For prizePool / revenue and prizePool / profit calculations, same-currency data is sufficient because the result is a percentage.
- If profit/surplus is zero, negative, missing, or semantically incompatible, show unavailable rather than a misleading ratio.
- Add unit tests for all calculation utilities.

Suggested initial tournament scope:
- Australian Open
- Roland Garros / French Open
- Wimbledon
- US Open

Important data caveat:
Prize money is usually easier to source than tournament-level revenue/profit. For v0.1, it is acceptable to include verified prize-money data plus partial financial data. The UI must make gaps explicit instead of hiding them.

TASK 0 — Repository reconnaissance and execution plan

Goal:
Inspect the folder, identify whether an app already exists, decide the implementation stack, and create the working plan.

Steps:
1. Run git status and inspect both `tennis-prize-money/` and the parent `vanshkumar.github.io` repo structure.
2. Identify the current parent framework, package manager, sibling app conventions, GitHub Pages workflow, and whether this folder already contains an app.
3. Create or switch to a suitable feature branch if needed.
4. Create/update AGENTS.md with operating instructions for future Codex threads.
5. Create docs/PROJECT_PLAN.md describing:
   - product goal
   - stack choice
   - parent-site and sibling-app deployment context
   - task sequence
   - assumptions
   - risks
   - acceptance criteria
6. Create docs/TASK_LOG.md and record Task 0.
7. Create docs/handoffs/task-0-summary.md.
8. Run any available lightweight checks.
9. Commit with message:
   chore: add project plan and codex handoff docs
10. Push the branch.
11. Create a new Codex thread for TASK 1 in this same project/repo with xhigh effort/thinking.
12. Seed the new thread with:
   - docs/handoffs/task-0-summary.md
   - TASK 1 instructions from this prompt
   - reminder to use xhigh effort/thinking and to read AGENTS.md, docs/PROJECT_PLAN.md, and docs/TASK_LOG.md before starting
13. Stop this thread after creating the TASK 1 thread.

TASK 1 — Scaffold the app and baseline dashboard

Goal:
Create a working web app with mock/sample data and a basic dashboard layout.

Steps:
1. Read AGENTS.md, docs/PROJECT_PLAN.md, docs/TASK_LOG.md, and docs/handoffs/task-0-summary.md.
2. Check git status and confirm the latest pushed commit is present.
3. If no app exists, scaffold the chosen TypeScript React + Vite app under `tennis-prize-money/`.
4. Add basic routing/page structure.
5. Add a small clearly marked mock dataset.
6. Build dashboard shell:
   - title
   - filters
   - KPI card placeholders
   - chart placeholders or simple charts
   - sources/caveats panel
   - refresh button placeholder
7. Add README setup instructions.
8. Add initial docs/ARCHITECTURE.md.
9. Ensure scripts exist for:
   - dev
   - build
   - lint
   - typecheck
   - test
10. Configure Vite `base` for `/tennis-prize-money/`.
11. Add a basic smoke/unit test if practical.
12. Run lint, typecheck, test, and build.
13. Update docs/TASK_LOG.md.
14. Create docs/handoffs/task-1-summary.md.
15. Commit with message:
   feat: scaffold tennis prize economics dashboard
16. Push.
17. Create a new Codex thread for TASK 2 in this same project/repo with xhigh effort/thinking.
18. Seed the new thread with:
   - docs/handoffs/task-1-summary.md
   - TASK 2 instructions from this prompt
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
19. Stop this thread after creating the TASK 2 thread.

TASK 2 — Data schema, validation, and calculation engine

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
   - TASK 3 instructions from this prompt
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
17. Stop this thread after creating the TASK 3 thread.

TASK 3 — Initial data sourcing and seed dataset

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
   - TASK 4 instructions from this prompt
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
19. Stop this thread after creating the TASK 4 thread.

TASK 4 — First real visualizations and UX polish

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
   - TASK 5 instructions from this prompt
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
19. Stop this thread after creating the TASK 5 thread.

TASK 5 — On-demand refresh pipeline

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
   - TASK 6 instructions from this prompt
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
21. Stop this thread after creating the TASK 6 thread.

TASK 6 — Final hardening, documentation, and v0.1 release readiness

Goal:
Make the first version understandable, testable, and ready for review.

Steps:
1. Read AGENTS.md, README.md, docs/PROJECT_PLAN.md, docs/TASK_LOG.md, docs/ARCHITECTURE.md, docs/DATA_MODEL.md, docs/DATA_SOURCES.md, docs/DATA_CAVEATS.md, docs/REFRESH_PIPELINE.md, docs/DEPLOYMENT.md, and docs/handoffs/task-5-summary.md.
2. Check git status and confirm the latest pushed commit is present.
3. Audit the entire app for:
   - mock data leakage
   - missing source labels
   - misleading terminology
   - exposed secrets
   - broken filters
   - bad empty states
   - build failures
4. Add or improve tests for critical calculations and validation.
5. Improve docs:
   - README quickstart
   - architecture
   - data model
   - data sources
   - caveats
   - refresh pipeline
   - deployment
   - future work
6. Add docs/FUTURE_WORK.md with high-value next steps:
   - more tournaments
   - richer official source adapters
   - FX conversion if needed
   - PDF/report parsing improvements
   - database/KV persistence
   - authentication for refresh
   - better provenance UI
7. Add CHANGELOG.md entry for v0.1.0.
8. Run lint, typecheck, test, and build.
9. Update docs/TASK_LOG.md.
10. Create docs/handoffs/task-6-summary.md.
11. Commit with message:
   chore: harden v0.1 dashboard and docs
12. Push.
13. If PR creation is available, open a pull request.
14. If PR creation is not available, print:
   - branch name
   - commit hashes
   - test/check results
   - manual PR instructions
15. Stop. Do not create another implementation thread unless there is a clear bugfix required by failed checks.

Definition of done for v0.1:
- The app runs locally.
- The dashboard renders from validated static JSON.
- Metrics are computed by tested utilities.
- The UI distinguishes official, reported, estimated, derived, mock, unavailable, and semantically incompatible data.
- The app includes at least one meaningful seed dataset, even if partial.
- Refresh architecture exists via CLI and GitHub Action.
- Refresh button is implemented with a secure non-configured fallback.
- Documentation is good enough for a new developer or future Codex thread to continue.
- Available checks pass.
- Work is committed and pushed at every task boundary.
- A PR is opened if the environment supports it.

Begin with TASK 0 now.
