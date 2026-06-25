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

**[2026-06-24] — UI verification**
- Observation: In this environment, the Node-backed verifier can run ESLint and esbuild, but Vite/Rollup cannot load its native addon because macOS library validation rejects the Rollup `.node` binary.
- Action: For visual checks when shell `node` is unavailable, build a temp esbuild bundle with CSV imports loaded as text, then serve it from `/private/tmp` with Python under localhost escalation.
- Confidence: medium

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

**[2026-06-24] — Mobile cup memory**
- Observation: On phone-width layouts, the active player panel sits below the board and action panel, so players must remember cup contents while planning movement and pouring.
- Action: Surface compact active-cup state inside the turn action panel during move and pour phases instead of relying only on the player panel.
- Confidence: high

**[2026-06-25] — Mobile phase ordering**
- Observation: Phone-width turns need different first-screen priorities by phase; move needs cups/orders and meeple controls before the board, while pour/upgrade need action controls before board detail.
- Action: Keep mobile game-layout children orderable by phase, and treat lower player panels as detail surfaces rather than the primary turn-planning surface.
- Confidence: high

**[2026-06-25] — Remote play sync**
- Observation: The pure reducer/state contract supports online play at the `GamePage` dispatch boundary, but async peer callbacks need current state and undo refs to avoid stale React closures.
- Action: Keep networking outside `src/engine/`, validate actions on the host with `applyAction`, broadcast accepted actions, and use host snapshots for join, resync, and undo.
- Confidence: medium

**[2026-06-25] — Remote relay verification**
- Observation: Public Trystero peer discovery did not connect two real local Chrome contexts in this sandboxed network, while a tiny WebSocket relay synced initial snapshots and bidirectional setup actions deterministically.
- Action: Use the `?relay=ws://HOST:PORT` room URL and `scripts/dev-relay.py` for reliable local remote-play tests; treat public P2P fallback as opportunistic until verified on the target network.
- Confidence: high

**[2026-06-25] — Remote peer action flow**
- Observation: Peer action confirmation state is both networking state and fast-click UI state, so React render state can lag a second tap before the host replies.
- Action: Mirror the pending peer action id in a ref and clear it only on matching host accept/reject messages or a host snapshot.
- Confidence: high

**[2026-06-25] — Cloudflare relay routing**
- Observation: A one-room-per-Durable-Object relay needs the room code before WebSocket upgrade routing, but the current relay client only sends `roomId` inside the post-open `JOIN` message.
- Action: Build Cloudflare relay socket URLs with a normalized `room` query parameter before `new WebSocket(...)`, while keeping the existing `JOIN` envelope so `scripts/dev-relay.py` remains compatible.
- Confidence: high

**[2026-06-25] — GitHub Pages relay env**
- Observation: The deployed Coffee Rush bundle is built by the parent `../.github/workflows/deploy.yml` `Build coffee-rush` step, not by the root Astro build step.
- Action: Wire `VITE_COFFEE_RUSH_RELAY_URL` on the `Build coffee-rush` step from a public repository variable such as `COFFEE_RUSH_RELAY_URL`; do not place room secrets in `VITE_*` values.
- Confidence: high

**[2026-06-25] — Blind relay invite secrets**
- Observation: Cloudflare relay invites need shared browser secrets for admission/encryption, but relay host controls should not be granted by the shared invite token.
- Action: Keep `relayAuth` and `gameKey` in the invite hash fragment, keep `hostAuth` only in the host's saved remote session, and treat room messages as async encrypted payloads.
- Confidence: high

**[2026-06-25] — Cloudflare account setup**
- Observation: `wrangler deploy --dry-run` can pass while the real deploy fails with Cloudflare API code `10034` if the account email is not verified.
- Action: Verify the Cloudflare account email before retrying `coffee-rush/relay` deploys; after verification, rerun `wrangler deploy` with the local relay Wrangler binary.
- Confidence: high

**[2026-06-25] — Cloudflare Workers subdomain**
- Observation: A verified Cloudflare account can still fail `coffee-rush/relay` deploys with API code `10063` until the account has a public `workers.dev` subdomain.
- Action: Initialize the Workers dashboard once or explicitly register a chosen account-wide `workers.dev` subdomain before deploying the relay Worker.
- Confidence: high

**[2026-06-25] — Production relay verification**
- Observation: The dashboard-initialized account subdomain is `vanshkumar95.workers.dev`, so the deployed Coffee Rush relay lives at `coffee-rush-relay.vanshkumar95.workers.dev`.
- Action: Set GitHub repo variable `COFFEE_RUSH_RELAY_URL` to `wss://coffee-rush-relay.vanshkumar95.workers.dev/room`, and include an allowed `Origin` header when smoke-testing the live WebSocket relay from Node.
- Confidence: high

**[2026-06-25] — Local multiplayer smoke tests**
- Observation: Host and peer tabs on the same browser origin share Coffee Rush localStorage, which masks real multi-device behavior during online-room testing.
- Action: Use isolated browser contexts, such as a headless Chrome DevTools smoke harness, when verifying host/peer online flows; assert join, snapshot sync, peer-originated actions, host-originated actions, and matching saved game state.
- Confidence: high

**[2026-06-25] — Relay allowed origins**
- Observation: The published Coffee Rush app can run from `https://vanshkumar.net` after GitHub Pages redirects from `vanshkumar.github.io`, so allowing only the GitHub Pages origin makes the Cloudflare relay reject production WebSockets.
- Action: Keep the relay `ALLOWED_ORIGINS` list in `relay/wrangler.toml` aligned with every production hostname plus active local smoke-test ports.
- Confidence: high

## Patterns and Preferences

**[2026-06-24] — Setup placement UX**
- Observation: `PLACE_STARTING_MEEPLE` is an atomic reducer action that needs both `cellId` and `cupIdx`, but the setup UI can still match normal turns by staging the selected board cell locally before submitting the cup choice.
- Action: Keep setup cup selection in the setup action panel and leave player-panel cups disabled during setup so players pick a board space first.
- Confidence: high

**[2026-06-24] — Upgrade control UX**
- Observation: `UpgradeTray` currently uses compact coded buttons in every player panel, while `GamePage` already has a dedicated start-of-turn upgrade phase action surface.
- Action: Keep player-panel upgrades as compact status indicators, and put upgrade purchasing descriptions/actions in the active player's upgrade-phase menu or modal.
- Confidence: medium

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
