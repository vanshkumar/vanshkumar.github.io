# Learnings

## What Has Worked

**[2026-06-24] — Ready-order controls**
- Observation: The order deck contains separate card instances with identical names and recipes; listing every matching card creates duplicate serve buttons for a single cup.
- Action: Deduplicate ready-order actions by cup, order name, specialty flag, and recipe while preserving separate actions for separate matching cups.
- Confidence: high

**[2026-06-24] — Mobile export downloads**
- Observation: Mobile browsers can suppress one of multiple programmatic downloads triggered by the same header action.
- Action: Package multi-file exports into one ZIP via `downloadFilesArchive` instead of clicking separate JSON and PNG downloads.
- Confidence: high

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

**[2026-06-20] — Compact game UI**
- Observation: The player panel height is dominated by repeated upgrade, cup, order, and Rush labels rather than unique gameplay information.
- Action: Prefer compact game codes and badges in repeated panel surfaces, e.g. `2M`, `Diag`, `C1`, and `R`, while keeping order tabs two-column on phone-width layouts.
- Confidence: high

**[2026-06-20] — Ingredient icon UI**
- Observation: CSS-only ingredient shapes become too abstract once reused at recipe-card and cup-token sizes.
- Action: Render ingredients as inline SVG glyphs inside the existing circular token frame, and keep the SVG artwork scaled up for small variants.
- Confidence: high

**[2026-06-20] — Board readability**
- Observation: Board ingredients and meeples need their own larger sizing than cup/order tokens; sharing the base token size makes the board feel too empty.
- Action: Size board ingredient tokens and meeple markers with board-specific CSS, with smaller mobile overrides to avoid crowding.
- Confidence: high

## Patterns and Preferences

**[2026-06-23] — Header utility UI**
- Observation: The top-right game utility controls are low-frequency/debug-style actions, so icon-only buttons make them harder to scan than useful.
- Action: Keep header utility actions as explicit text buttons, especially `Undo`, `Copy log`, `Download log + screenshot`, and `New`.
- Confidence: high

**[2026-06-19] — Turn action UX**
- Observation: Ready order controls are misleading outside the pour phase because the reducer rejects `FULFILL_ORDER` unless `state.phase === 'pour'`.
- Action: Gate ready-order highlights and serve buttons to the pour phase, and keep serving in one explicit action surface.
- Confidence: high

## What Has Failed

**[2026-06-19] — Board affordance state**
- Observation: Letting `Board` fall back to `getLegalDestinations` whenever a meeple is selected leaks movement highlights into setup/upgrade/pour phases.
- Action: Derive board highlights by phase: setup cells only during setup placement, next-step cells only during move, and no movement highlights otherwise.
- Confidence: high
