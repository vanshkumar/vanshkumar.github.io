# Task 0 Handoff

## Task Completed

Task 0 - Repository reconnaissance and execution plan.

## Files Changed

- `tennis-prize-money/LEARNINGS.md`
- `tennis-prize-money/PLAN.md`
- `tennis-prize-money/AGENTS.md`
- `tennis-prize-money/docs/PROJECT_PLAN.md`
- `tennis-prize-money/docs/TASK_LOG.md`
- `tennis-prize-money/docs/handoffs/task-0-summary.md`

## Current Branch

`feat/tennis-prize-economics-dashboard`

## Commit Hash

Pending until the Task 0 commit is created and pushed. The current thread final response and Task 1 thread seed must name the pushed commit hash.

## Push Status

Pending until the Task 0 commit is pushed. The current thread final response and Task 1 thread seed must state whether push succeeded.

## Commands Run And Results

- `cat LEARNINGS.md` from `tennis-prize-money/`: read app-local memory.
- `git status --short --branch` from parent repo: started on `main...origin/main` with `tennis-prize-money/` untracked.
- `git rev-parse --show-toplevel`: confirmed parent Git root is `/Users/vanshkumar/Documents/repos/vanshkumar.github.io`.
- `find . -maxdepth 3 -print` from `tennis-prize-money/`: confirmed only `PLAN.md` and `LEARNINGS.md` existed before Task 0 docs.
- `cat PLAN.md`: read full project plan.
- `cat README.md` and `cat TECH_STACK.md` from parent repo: confirmed Astro root site and React/Vite side-app conventions.
- `cat .github/workflows/deploy.yml`: confirmed GitHub Pages workflow builds Astro, `terminal-desires-ranker`, and `coffee-rush`, then assembles a combined `site/` artifact.
- `git branch --list feat/tennis-prize-economics-dashboard`: confirmed the feature branch did not exist.
- `git switch -c feat/tennis-prize-economics-dashboard`: initial sandboxed attempt failed because git metadata could not be written.
- `git switch -c feat/tennis-prize-economics-dashboard` with approved escalation: succeeded.
- `rg -n "xhigh|React \+ TypeScript \+ Vite|GitHub Pages|Pending|Status:" PLAN.md AGENTS.md LEARNINGS.md docs/PROJECT_PLAN.md docs/TASK_LOG.md docs/handoffs/task-0-summary.md`: confirmed the key planning constraints are recorded.
- `find . -maxdepth 3 -type f -print | sort`: confirmed expected Task 0 files exist.
- `git status --short --branch`: confirmed branch and untracked app folder before staging.
- Follow-up documentation pass: made xhigh effort/thinking mandatory for every new Codex chat thread created for this project, including the tool setting and seed prompt wording.

## Tests And Checks Status

No app-level checks exist yet because Task 0 is documentation-only and the app has not been scaffolded. Lightweight repository and documentation checks were run as listed above.

## Known Issues

- No React/Vite app exists yet.
- No app-level package scripts exist yet.
- Parent deployment workflow does not yet build or copy `tennis-prize-money/dist`.
- GitHub Pages has no server runtime, so browser-triggered refresh must remain disabled/not configured until an external endpoint exists.
- The handoff file cannot self-reference the hash of the commit that contains it without invalidating that hash; use the final response and Task 1 thread seed for the pushed Task 0 commit hash.

## Assumptions Made

- The dashboard should follow the deployed sibling app pattern rather than Next.js.
- The app should deploy at `/tennis-prize-money/`.
- Task 1 should create a React + TypeScript + Vite app with npm.
- Parent-level workflow docs should be updated only when deployment integration is actually added.

## Next Task Objective

Task 1 - Scaffold the app and baseline dashboard.

Create a working React + TypeScript + Vite dashboard shell with clearly labeled mock/sample data, filters, KPI placeholders, chart placeholders or simple charts, a sources/caveats panel, refresh placeholder, README setup instructions, initial architecture documentation, app scripts, and at least one basic smoke/unit test where practical.

## Exact Instructions For The Next Codex Thread

Create the Task 1 Codex chat thread with xhigh effort/thinking. If the thread creation tool exposes a thinking/reasoning option, set it explicitly to `xhigh`.

Use this prompt to create the Task 1 thread:

```markdown
You are Codex working in `/Users/vanshkumar/Documents/repos/vanshkumar.github.io/tennis-prize-money`, inside the larger `vanshkumar.github.io` repo.

Use xhigh effort/thinking for this thread.

Start from the latest pushed commit on `feat/tennis-prize-economics-dashboard`.

Before starting, read:
- `LEARNINGS.md`
- `AGENTS.md`
- `docs/PROJECT_PLAN.md`
- `docs/TASK_LOG.md`
- `docs/handoffs/task-0-summary.md`

Then complete TASK 1 only.

TASK 1 - Scaffold the app and baseline dashboard

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
17. Create a new Codex thread for TASK 2 in this same project/repo with xhigh effort/thinking. If the thread creation tool exposes a thinking/reasoning option, set it explicitly to `xhigh`.
18. Seed the new thread with:
   - docs/handoffs/task-1-summary.md
   - TASK 2 instructions from PLAN.md
   - reminder to use xhigh effort/thinking and to read AGENTS.md and relevant docs before starting
19. Stop this thread after creating the TASK 2 thread.

Important project constraints:
- Use React + TypeScript + Vite, npm, and Vite `base: '/tennis-prize-money/'`.
- Keep mock/sample data visibly labeled in code and UI.
- Do not fabricate real data.
- Do not assume a server runtime on GitHub Pages.
- Stage explicit paths and never delete user work.
- Every new Codex chat thread created as part of this project must use xhigh effort/thinking.
```
