# Agent Instructions

## Required Memory

Before starting any task in this app, read `LEARNINGS.md` in full. Apply entries under "What Has Worked" and "Patterns and Preferences"; avoid entries under "What Has Failed." If `LEARNINGS.md` is missing, create it with these sections:

- `## What Has Worked`
- `## Patterns and Preferences`
- `## What Has Failed`

After completing a task, update `LEARNINGS.md` only with project-specific observations that are not already captured. Use this format:

```markdown
**[Date] - [Task type]**
- Observation: [what you noticed]
- Action: [what to do or avoid going forward]
- Confidence: [high / medium / low]
```

## Project Context

`tennis-prize-money/` is a sibling app inside the larger `vanshkumar.github.io` personal-site repository. The parent repo is an Astro 5 static site deployed to GitHub Pages. Deployed sibling apps use independent React + Vite projects with their own `package.json`, lockfile, tests, and Vite build output copied into the final Pages artifact.

For this dashboard, prefer:

- React + TypeScript + Vite.
- npm, not pnpm or yarn.
- Vite `base: '/tennis-prize-money/'` for deployed builds.
- App-local docs, source, tests, and package files inside `tennis-prize-money/`.
- Static JSON data loaded by the dashboard.
- Node CLI and GitHub Actions for refresh, with any browser-triggered refresh backed by an optional external serverless endpoint.

GitHub Pages has no app-local server runtime. Do not assume Next.js API routes or secrets in browser code.

## Task Workflow

This project is intentionally serial across Codex threads:

1. Complete only the current major task from `PLAN.md`.
2. Before each task, check git status.
3. Do not begin a later major task until the current task is implemented, documented, checked, committed, pushed, and handed off.
4. At each task boundary, update `docs/TASK_LOG.md`.
5. At each task boundary, create a complete handoff under `docs/handoffs/`.
6. After push, create the next Codex thread in this same repo, seeded with the handoff and next task instructions.
7. Configure every new Codex chat thread for this project with xhigh effort/thinking.
8. Stop the current thread after creating the next thread.

## Thread Creation Requirement

Every new Codex chat thread created as part of this project must use xhigh effort/thinking. This applies to major task handoff threads and any auxiliary Codex chat threads created for project work.

When using a thread creation tool that exposes a reasoning or thinking option, set it explicitly to `xhigh`. Also include `Use xhigh effort/thinking for this thread.` in the seed prompt so the requirement survives in the thread history and future handoffs.

If a thread cannot be created with xhigh effort/thinking, do not silently proceed. Document the limitation in the current handoff and final response before creating or using that thread.

Use the current branch unless it is clearly inappropriate. If starting from `main` or `master` and no feature branch exists, use `feat/tennis-prize-economics-dashboard`.

Never force-push. Never delete user work. Stage explicit paths, especially because the parent repo can contain unrelated root-site or sibling-app changes.

## Data Rules

- Do not fabricate real data.
- Mock/sample data must be visibly labeled as mock/sample in code, data, and UI.
- Real data must include source URL, publisher, source type, retrieved/accessed date, confidence, and notes where useful.
- Prefer official sources. Use reputable secondary sources only with lower confidence and visible caveats.
- Keep prize money, revenue, profit, surplus, expenses, and unavailable values semantically distinct.
- Only compute derived percentages when numerator and denominator are compatible.
- Do not compare currencies without explicit conversion.
- If profit/surplus is zero, negative, missing, or semantically incompatible, show the ratio as unavailable.

## Documentation

Maintain these docs over the project:

- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`
- `docs/PROJECT_PLAN.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/DATA_SOURCES.md`
- `docs/DATA_CAVEATS.md`
- `docs/REFRESH_PIPELINE.md`
- `docs/DEPLOYMENT.md`
- `docs/FUTURE_WORK.md`
- `docs/TASK_LOG.md`
- `docs/handoffs/`
