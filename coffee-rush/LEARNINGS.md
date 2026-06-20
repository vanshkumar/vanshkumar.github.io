# Learnings

## What Has Worked

**[2026-06-19] — UX implementation**
- Observation: The Codex shell for this repo may not expose `npm`, even when `node_modules` is already installed.
- Action: Use the bundled Node runtime to invoke local tools directly, e.g. `node_modules/vitest/vitest.mjs`, `node_modules/eslint/bin/eslint.js`, and `node_modules/vite/bin/vite.js`.
- Confidence: high

**[2026-06-19] — Git commit workflow**
- Observation: The repo commit hook can add missing metadata to unrelated untracked `vault/questions` files and stage them into a commit.
- Action: After committing from a mixed worktree, inspect `git show --name-status HEAD`; if unrelated vault files were added, remove them from the index and amend with hooks skipped.
- Confidence: high

**[2026-06-19] — Hot-seat mobile UX**
- Observation: On phone-width layouts, putting the active player panel first keeps cups/orders immediately below the board and action panel instead of one or more screens away.
- Action: Preserve active-player-first ordering for the game sidebar and avoid assumptions that table seat order must match visual panel order.
- Confidence: high

## Patterns and Preferences

**[2026-06-19] — Turn action UX**
- Observation: Ready order controls are misleading outside the pour phase because the reducer rejects `FULFILL_ORDER` unless `state.phase === 'pour'`.
- Action: Gate ready-order highlights and serve buttons to the pour phase, and keep serving in one explicit action surface.
- Confidence: high

## What Has Failed

**[2026-06-19] — Board affordance state**
- Observation: Letting `Board` fall back to `getLegalDestinations` whenever a meeple is selected leaks movement highlights into setup/upgrade/pour phases.
- Action: Derive board highlights by phase: setup cells only during setup placement, next-step cells only during move, and no movement highlights otherwise.
- Confidence: high
