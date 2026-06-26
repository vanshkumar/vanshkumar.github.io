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

**[2026-06-26] — Fresh worktree verification**
- Observation: A fresh Coffee Rush Codex worktree can lack `node_modules`; the bundled `pnpm install --lockfile=false` installs enough dependencies for Vitest, ESLint, and Vite build, but can leave an untracked `pnpm-workspace.yaml` with esbuild allow-build metadata.
- Action: Use the bundled `pnpm` only when dependencies are missing, delete any generated `pnpm-workspace.yaml` before committing, and run project tools through the bundled Node binary.
- Confidence: medium

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

**[2026-06-26] — Order pressure UI**
- Observation: Order storage uses `tabs[0]` as newest and `tabs[3]` as nearest penalty, but players scan the visible order area from highest pressure to lowest pressure.
- Action: Keep reducer/storage tab indexes unchanged, and render order lanes through a shared urgency-first display order with compact pressure markers instead of visible tab numbers.
- Confidence: high

**[2026-06-26] — Order lane alignment**
- Observation: CSS Grid stretches the pressure lane tracks to the tallest lane, so marker rows can appear vertically centered unless the lane grid content is explicitly pinned.
- Action: Keep `.order-tab` grid content top-aligned with `align-content: start` whenever pressure lanes have mixed empty and filled order columns.
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

**[2026-06-25] — Production async relay smoke**
- Observation: GitHub Pages can serve the async v2 Coffee Rush bundle while the Cloudflare relay Worker is still on stale protocol v1 code; the stale relay returns `405 Method not allowed` without CORS headers for `/room/create?room=...`, blocking `Host online game`.
- Action: Before full live browser testing, probe `OPTIONS` and an invalid `POST` to `https://coffee-rush-relay.vanshkumar95.workers.dev/room/create?room=ABC123` with `Origin: https://vanshkumar.net`; expect `204` CORS preflight and a protocol-2 validation error before continuing.
- Confidence: high

**[2026-06-25] — Local multiplayer smoke tests**
- Observation: Host and peer tabs on the same browser origin share Coffee Rush localStorage, which masks real multi-device behavior during online-room testing.
- Action: Use isolated browser contexts, such as a headless Chrome DevTools smoke harness, when verifying host/peer online flows; assert join, snapshot sync, peer-originated actions, host-originated actions, and matching saved game state.
- Confidence: high

**[2026-06-25] — Production async relay soak verification**
- Observation: DevTools relay captures include CORS preflights and opaque encrypted/auth/hash base64 fields; naive request counts or substring scans can miscount commits and flag random ciphertext as plaintext gameplay.
- Action: Count only `POST /room/commits` bodies, and scrub encrypted snapshot/commit plus auth/hash fields before scanning unencrypted relay JSON for gameplay keys.
- Confidence: high

**[2026-06-25] — Production-build smoke tests**
- Observation: The Vite production bundle uses the deployed `/coffee-rush/` base path, so serving `dist/` directly at localhost root leaves built JS/CSS assets under missing `/coffee-rush/assets/...` URLs.
- Action: For local browser smoke tests of `vite build` output, serve a parent directory that mounts `dist` at `/coffee-rush`, or use a preview server that preserves the configured base path.
- Confidence: high

**[2026-06-25] — Async online play model**
- Observation: True async play can avoid leaking turn/player metadata to Cloudflare if the server stores only encrypted snapshots/turn commits plus sequence hashes, and each browser validates turn ownership from decrypted local state.
- Action: Prefer protocol v2 rooms with shared invite secrets, encrypted completed-turn commits, stale-head rejection, and local-only draft undo; avoid plaintext server-side active-player enforcement unless cheating by invite holders becomes in scope.
- Confidence: high

**[2026-06-26] — Async commit integrity**
- Observation: The async commit boundary can be regression-tested without a browser by replaying reducer actions from a saved canonical state and comparing `hashState` output before any relay `fetch` is allowed.
- Action: Put future async commit-safety checks before `submitTurnCommit`, and cover restored-draft mismatches with real reducer actions plus a `fetch` spy that must remain unused.
- Confidence: high

**[2026-06-26] — Worktree dependency reuse**
- Observation: Reusing the original checkout's `node_modules` as a single symlink lets imports resolve, but Vitest and Vite then try to write `.vite` and `.vite-temp` cache files through that symlink into the read-only checkout.
- Action: For Codex worktrees without local dependencies, create an ignored local `node_modules` directory with per-package symlinks to the original checkout and local `.vite` / `.vite-temp` directories before running Vitest or Vite build.
- Confidence: high

**[2026-06-26] — Async offline draft restore**
- Observation: `loadGame()` can restore the visible async draft state on reload before `/room/head` succeeds, while the draft action count can stay unset and async draft saves can read a stale undo ref if undo state is only advanced through a React state updater.
- Action: Update `undoStackRef` synchronously before async draft persistence, rehydrate saved async draft actions, visible state, undo stack, and cached base head together on `restoreDraft` sync failures, and test status label, draft count, phase, active player, and undo depth as one assertion group.
- Confidence: high

**[2026-06-25] — Relay documentation**
- Observation: `CLOUDFLARE_RELAY_PLAN.md` started as the protocol v1 WebSocket relay plan, so after async v2 landed it can read stale unless the current implementation status is stated before the original plan.
- Action: Keep a front-loaded status section in relay docs when protocol defaults change, and point readers to v2 HTTP endpoints before the historical v1 architecture details.
- Confidence: high

**[2026-06-25] — Smoke fix prioritization**
- Observation: `SMOKE_TESTING_REC_FIXES.md` preserves evidence by smoke pass, but implementation planning needs cross-pass priority ordering because related async draft and room-state issues are split across scenarios.
- Action: Keep smoke-pass evidence sections intact, and add a front-loaded priority backlog plus per-fix `Priority:` lines when turning smoke recommendations into implementation order.
- Confidence: high

**[2026-06-25] — Relay allowed origins**
- Observation: The published Coffee Rush app can run from `https://vanshkumar.net` after GitHub Pages redirects from `vanshkumar.github.io`, so allowing only the GitHub Pages origin makes the Cloudflare relay reject production WebSockets.
- Action: Keep the relay `ALLOWED_ORIGINS` list in `relay/wrangler.toml` aligned with every production hostname plus active local smoke-test ports.
- Confidence: high

**[2026-06-25] — Async invite query secrets**
- Observation: `parseInviteInput` accepts `auth` and `key` from query params, so a manually mutated query-string invite can join but sends room secrets in the initial GitHub Pages request URL instead of keeping them in the hash fragment.
- Action: Prefer hash-only invite secrets; if query parsing remains for compatibility, scrub or reject query `auth`/`key` after parsing and treat query-secret variants as security smoke cases.
- Confidence: high

**[2026-06-26] — Async invite query scrub**
- Observation: Startup invite handling runs before `SetupPage` can show a warning, and the hash-router invite format still needs `room` in the query while keeping `auth` and `key` in the hash.
- Action: Keep `scrubQueryInviteSecretsFromLocation()` in `main.jsx` before React renders, preserve non-secret query params such as `room` and `relay`, and reject pasted query-secret links through `hasQueryInviteSecrets`.
- Confidence: high

**[2026-06-25] — Production async browser smoke**
- Observation: The live GitHub Pages app routes the game as `/coffee-rush/#/game`, and mobile-width remote status text can be hidden behind the Tools disclosure.
- Action: In live async smoke harnesses, assert route, phase, room mode, and relay head from `localStorage` state instead of relying on `/coffee-rush/game` path checks or desktop-only visible status text.
- Confidence: high

**[2026-06-26] — Production closed-room smoke**
- Observation: Existing-peer closed-room verification does not need clipboard access or setup placement; the host's saved v3 remote session contains enough data to build a hash-fragment invite for an isolated peer, then `New` can close the unadvanced async room.
- Action: For future closed-room production smokes, use isolated Chrome contexts, build the peer invite from `coffee-rush:remote-session:v3`, and assert the peer clears `coffee-rush:active-game:v2` plus matching async room-state keys after the post-close reload.
- Confidence: high

**[2026-06-25] — Mobile board automation**
- Observation: Board cell test IDs mirror row/column-style `boardLayout.csv` IDs such as `cell-11` through `cell-44`, not sequential visual positions like `cell-1`.
- Action: In browser smoke tests, pick current legal cells from `.board-cell.legal-cell` or `data-testid` values in the DOM instead of hard-coding sequential cell numbers.
- Confidence: high

**[2026-06-26] — Online invite UX**
- Observation: `Host online game` creates the async room and immediately navigates to `/game`; the invite is copied from the game header or mobile Tools menu via `Copy invite`, not from the setup page.
- Action: When explaining or testing online hosting, include the post-navigation `Copy invite` step and remember joiners can paste either the full invite URL or compact `ROOM.auth.key` token.
- Confidence: high

**[2026-06-26] — Async seat authority**
- Observation: A shared async room secret lets browsers decrypt/sync the room but does not identify which player seat the browser owns, so setup and turn controls can be initiated for the wrong player unless the invite carries a local seat.
- Action: Generate per-player async invite links with `player=pN`, persist `localPlayerId`, and gate both UI controls and local dispatch by `action.playerId` for every async setup/turn phase.
- Confidence: high

**[2026-06-26] — Local player station view**
- Observation: `GamePage` has two separate player concepts in remote games: the active turn player for legal actions, and `remoteSession.localPlayerId` for the browser's pinned cups/orders view.
- Action: Keep turn controls, ready-order actions, and reducer dispatches tied to `activePlayer`, but order station context and player panels from the local view player when a local seat is known.
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

**[2026-06-26] — Top status banner UX**
- Observation: The top message banner can be driven by either reducer `lastMessage` or `GamePage` `exportStatus`, so transient turn/draft copy may come from different state sources.
- Action: Remove unnecessary top-row status text at the source that sets it, e.g. clear `lastMessage` for no-op phase transitions and clear `exportStatus` for silent async draft saves.
- Confidence: high

**[2026-06-26] — Move meeple selection UX**
- Observation: During the move phase, clickable board meeples already make the meeple choice obvious, so a separate `M1`/`M2` picker row adds redundant text clutter.
- Action: Keep move-phase meeple selection on the board and avoid restoring separate `M1`/`M2` text controls in the action panel.
- Confidence: high

## What Has Failed

**[2026-06-25] — Async draft recovery**
- Observation: Reloading an async room with an uncommitted local draft while the relay URL is unreachable can restore the visible draft state without the full draft action list; after a failed `END_TURN`, restoring the normal relay showed `1 draft` for a state that included earlier local move/discard actions, and Undo briefly showed `synced` while still on an uncommitted pour state.
- Action: When testing or fixing async recovery, verify the saved draft action list, visible game state, and canonical room head stay aligned across reload, failed sync, failed commit, Undo, and retry; avoid committing from a restored state unless the draft count/actions match the visible state.
- Confidence: high

**[2026-06-19] — Board affordance state**
- Observation: Letting `Board` fall back to `getLegalDestinations` whenever a meeple is selected leaks movement highlights into setup/upgrade/pour phases.
- Action: Derive board highlights by phase: setup cells only during setup placement, next-step cells only during move, and no movement highlights otherwise.
- Confidence: high

**[2026-06-25] — Async invite failure UX**
- Observation: Live production wrong-game-key invites fail safely without saving `active-game` or async room state, but WebCrypto decrypt failure can leave `remoteStatus.error` empty so the peer UI only shows `Connection error`.
- Action: Map async decrypt and validation exceptions to a friendly persistent message such as "Could not decrypt this room. Check the invite link." while keeping the game unloaded.
- Confidence: high

**[2026-06-25] — Async room close UX**
- Observation: After the host closes a live async room, an existing peer sync shows `ROOM_NOT_FOUND` but keeps rendering its cached local game state, while a fresh old-invite peer falls back to protocol 1 and shows "Room has not been hosted yet."
- Action: Treat async `ROOM_NOT_FOUND` after a v2 invite/session as a closed-room terminal state: clear async room cache or hide cached board state, avoid live-protocol fallback for confirmed v2 rooms, and show a room-closed/not-found message.
- Confidence: high

**[2026-06-25] — Async draft undo after reload**
- Observation: In live production, a restored async draft with `SKIP_UPGRADES`, `MOVE`, and `DISCARD_HAND` can show Undo as enabled, but clicking it after reload applies the pre-`MOVE` state while the saved draft still contains `SKIP_UPGRADES` and `MOVE`.
- Action: Keep async draft actions and restored undo history aligned one-to-one, or rebuild draft undo by replaying actions from the canonical head; include a reload-plus-Undo smoke path before declaring async draft restore safe.
- Confidence: high
