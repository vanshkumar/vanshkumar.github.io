# Smoke Testing Recommended Fixes

## Prioritized Fix Backlog

### Priority Scale

- P0: Protects async game-state integrity, commit correctness, or a security boundary; fix before broader async rollout.
- P1: High-impact user-facing correctness, recovery, or privacy issue where the current behavior fails safely but can confuse users or lose local progress.
- P2: Important polish, messaging, or consistency issue that improves supportability and smoke-test clarity.
- P3: Low-risk cleanup or test-noise reduction.

### Recommended Order

| Priority | Fix | Source | Why |
| --- | --- | --- | --- |
| P0 | Block commit from mismatched draft/canonical state | Live Async Network Interruption On Commit / Fix 1 | This is the last guard before writing an encrypted turn commit; it prevents invalid commits or local/peer divergence after failed recovery. |
| P0 | Hydrate async draft state atomically after failed sync | Live Async Network Interruption On Commit / Fix 2 | The visible state, base head, draft actions, and undo stack can drift after an unreachable-relay reload; fix this as the root consistency problem. |
| P1 | Keep failed commits at a retry/replay boundary | Live Async Network Interruption On Commit / Fix 3 | Users need an explicit recovery path instead of continuing from a bad local base after `END_TURN` fails. |
| P1 | Restore async draft Undo history correctly | Live Async Reload-During-Draft Pass With Undo Bug / Fix 1 | Reload-plus-Undo can corrupt the local draft by applying an undo state that does not match the saved draft actions. |
| P1 | Reject or scrub query-string invite secrets | Live Async Bad Invite Pass / Fix 2 | Valid query-string secrets can leak through URLs, logs, history, or referrers; normal generated invites already use safer hash fragments. |
| P1 | Treat existing-peer `ROOM_NOT_FOUND` as a closed-room terminal state | Live Async Host Close Pass / Fix 1 | After host close, cached board state still renders and can look playable even though the relay room is gone. |
| P2 | Prevent v2 invite fallback to live protocol after close | Live Async Host Close Pass / Fix 2 | Fresh old invites should show a closed/not-found async room message, not a misleading v1 "not hosted" state. |
| P2 | Show a wrong-game-key decrypt failure message | Live Async Bad Invite Pass / Fix 1 | The app already fails safely; the UI needs clear recovery guidance and a stable visible assertion for smoke tests. |
| P2 | Replace raw async network error copy | Live Async Network Interruption On Commit / Fix 4 | Better copy is useful once the recovery path preserves draft state reliably. |
| P2 | Fix mobile Tools menu overlay behavior | Live Mobile Async Pass / Fix 1 | The menu is functional but obscures status and controls, especially on mobile smoke screenshots. |
| P3 | Clean up generic 404 console noise | Live Mobile Async Pass / Fix 2 | Not user-facing in the tested flow; likely favicon or manifest cleanup. |

### Suggested Implementation Groups

1. Async draft and commit consistency: fix the P0 commit guard and atomic draft hydration together, then the retry/replay affordance and restored Undo history.
2. Invite and closed-room handling: scrub or reject query-string secrets, make closed v2 rooms terminal, remove v1 fallback for confirmed v2 invites, and improve wrong-key copy.
3. Mobile/test hygiene: address the Tools overlay, then remove the generic 404 if it is a missing favicon or manifest asset.

## 2026-06-25 Live Async Bad Invite Pass

### Context

- Scenario: live production async online play with malformed or mutated invites.
- Live app: `https://vanshkumar.net/coffee-rush/`
- Production bundle checked: `/coffee-rush/assets/index-vxD4NTZG.js`
- Expected relay URL confirmed in bundle: `wss://coffee-rush-relay.vanshkumar95.workers.dev/room`
- Tested room: `NA7Y5D`
- Browser isolation: separate temporary Chrome profiles for host and each peer variant.
- Redacted summary artifact: `/private/tmp/coffee-rush-bad-invite-results/result.json`
- Screenshot artifacts:
  - `/private/tmp/coffee-rush-bad-invite-results/host-created-room.png`
  - `/private/tmp/coffee-rush-bad-invite-results/wrong-auth-hash.png`
  - `/private/tmp/coffee-rush-bad-invite-results/wrong-game-key-hash-failure.png`
  - `/private/tmp/coffee-rush-bad-invite-results/missing-key-hash.png`
  - `/private/tmp/coffee-rush-bad-invite-results/auth-key-in-query-valid.png`
  - `/private/tmp/coffee-rush-bad-invite-results/valid-hash-after-bad-invites.png`

### What Passed

- Relay preflight gate passed before UI testing:
  - `OPTIONS /room/create?room=ABC123` with `Origin: https://vanshkumar.net` returned `204` with CORS.
  - Invalid `POST /room/create?room=ABC123` returned `400` with `{"protocol":2,"error":"Unsupported async protocol."}` and CORS.
- Host created an async v2 room and saved a complete host session locally.
  - Host status showed `Async host NA7Y5D · synced`.
  - Host saved `active-game`, `async-room-state`, and `remote-session` for room `NA7Y5D`.
- Wrong auth in hash failed cleanly.
  - Peer showed `BAD_AUTH` and `Connection error`.
  - Peer saved only the failed peer remote session; no `active-game`, async room state, or async draft was saved.
  - Relay `POST /room/head?room=NA7Y5D` returned `403`, with CORS intact.
- Wrong game key in hash failed safely.
  - Peer showed `Connection error`.
  - Peer saved only the failed peer remote session; no `active-game`, async room state, or async draft was saved.
  - Relay returned encrypted room head data, but the browser did not decrypt or persist gameplay state with the wrong key.
- Missing key failed before leaving setup.
  - Setup showed `That invite is missing its private room key.`
  - No remote session, `active-game`, async room state, or relay request was created.
- Valid hash invite still joined after all malformed invite attempts.
  - Peer status showed `Async NA7Y5D · synced`.
  - Peer active game matched the host room at setup placement, turn 1, active player `p2`.
- Network checks found no failed CORS, no WebSocket usage, no room auth/game key in relay URLs, and no plaintext gameplay action/state strings in relay request or response bodies.

### Recommended App Fixes

**1. Wrong game-key failure message**

- Priority: P2.
- Observation: A wrong `gameKey` fails safely, but the peer UI only shows the status pill `Connection error`; there is no error banner explaining that the invite could not decrypt the room.
- Risk: This does not expose or corrupt room state, but it leaves users with little recovery guidance. It also makes smoke harnesses distinguish the wrong-key case by storage safety instead of visible error copy.
- Recommended fix: Normalize async decrypt and validation failures before setting UI state. For example, treat WebCrypto decrypt exceptions or empty `syncError.message` values as `Could not decrypt this room. Check the invite link.` Keep the current behavior of not saving `active-game` or async room state.
- Evidence:
  - `/private/tmp/coffee-rush-bad-invite-results/wrong-game-key-hash-failure.png`
  - `/private/tmp/coffee-rush-bad-invite-results/result.json`

**2. Query-string invite secrets**

- Priority: P1.
- Observation: Moving valid `auth` and `key` from the hash fragment into query params still joins successfully. That mutated invite put both secrets in the initial GitHub Pages document request URL before the app loaded.
- Risk: Normal generated invites keep secrets in the hash, which is not sent to the server. Query-string secrets can end up in browser history, CDN/server logs, copied URLs, and possibly referrers before the app has a chance to scrub them.
- Recommended fix: Prefer hash-only invite secrets. If query parsing must remain for backwards compatibility, immediately `replaceState` to remove query `auth`/`key` after parsing and show a warning or reject query-secret invites for new joins. Do not generate or document query-secret invite URLs.
- Evidence:
  - `/private/tmp/coffee-rush-bad-invite-results/auth-key-in-query-valid.png`
  - `/private/tmp/coffee-rush-bad-invite-results/result.json`

### Smoke Harness Notes

- Keep using isolated browser contexts/profiles for host and every peer invite variant. Same-origin tabs share Coffee Rush `localStorage` and can hide whether a bad invite actually loaded decrypted state.
- Treat expected negative network statuses as scenario-specific:
  - Wrong auth should produce `403 BAD_AUTH` on `/room/head`.
  - Wrong game key should produce `200` encrypted `/room/head` data, then a client-side decrypt failure.
  - Missing key should produce no relay request.
- For leak checks, scan relay request/response bodies after scrubbing expected auth/hash metadata and encrypted envelope fields; random ciphertext can otherwise look like arbitrary text.
- The host `Copy invite` click showed `Could not copy the private invite link.` in headless Chrome, while the invite was still captured from the saved session and used for peer joins. Retest clipboard behavior in a normal interactive browser before treating this as an app bug.

### Screenshot Evidence

![host created room](/private/tmp/coffee-rush-bad-invite-results/host-created-room.png)

![wrong auth hash](/private/tmp/coffee-rush-bad-invite-results/wrong-auth-hash.png)

![wrong game key hash](/private/tmp/coffee-rush-bad-invite-results/wrong-game-key-hash-failure.png)

![missing key hash](/private/tmp/coffee-rush-bad-invite-results/missing-key-hash.png)

![query secrets valid join](/private/tmp/coffee-rush-bad-invite-results/auth-key-in-query-valid.png)

![valid hash after bad invites](/private/tmp/coffee-rush-bad-invite-results/valid-hash-after-bad-invites.png)

## 2026-06-25 Live Mobile Async Pass

### Context

- Scenario: mobile-width live async online play on production.
- Live app: `https://vanshkumar.net/coffee-rush/`
- Production bundle checked: `/coffee-rush/assets/index-vxD4NTZG.js`
- Expected relay URL confirmed in bundle: `wss://coffee-rush-relay.vanshkumar95.workers.dev/room`
- Completed room: `NYT5WS`
- Viewports: host `390x844`, peer `360x740`
- Browser isolation: separate Chrome contexts; peer `localStorage` was empty before join.
- Screenshot artifact directory: `/private/tmp/coffee-rush-live-mobile-async-2026-06-25T23-07-30-361Z`

### What Passed

- Relay preflight gate passed before UI testing:
  - `OPTIONS /room/create?room=ABC123` with `Origin: https://vanshkumar.net` returned `204` with CORS.
  - Invalid `POST /room/create?room=ABC123` returned `400` with `{"protocol":2,"error":"Unsupported async protocol."}` and CORS.
- Invite copy worked from the mobile Tools menu.
  - Copied invite included room, hash `auth`, and hash `key`.
  - Copied invite did not include `hostAuth`.
- Peer joined from a separate mobile context.
  - Peer session was `mode: peer`, protocol `2`, with relay auth and game key.
  - Peer did not receive or save `hostAuth`.
- Setup placement completed through board cell selection then cup choice.
  - Host placed `cell-11 -> cup 1`.
  - Peer placed `cell-12 -> cup 1`.
  - Host placed `cell-13 -> cup 1`.
  - Peer placed `cell-14 -> cup 1`.
- One real turn completed through `END_TURN`.
  - Ada moved to `cell-24`, collected `water`, selected a cup, poured, and ended turn.
  - Relay head reached `5`.
  - Peer reopen/resync matched host state exactly.
  - Final state: `phase=upgrade`, active player `p2` / Ben.
- Network checks found no relay failures, no failed CORS, no page errors, no invite hash secrets in relay URLs, and no plaintext gameplay actions/state in relay payloads.

### Recommended App Fixes

**1. Mobile Tools menu overlay**

- Priority: P2.
- Observation: The mobile Tools disclosure is readable and functional, but when open it overlays banners and active gameplay surfaces. This is most visible on setup, move, pour, and post-sync upgrade screens.
- Risk: It is not a production blocker, but it can obscure status text or controls while open, and automated layout checks report it as overlap.
- Recommended fix: Convert the mobile Tools panel to a small sheet/dropdown that either reserves space below the header or uses a deliberate modal/backdrop pattern. Also consider closing the panel automatically after actions such as `Copy invite`, `Copy log`, or `Download log + screenshot`.
- Evidence:
  - `/private/tmp/coffee-rush-live-mobile-async-2026-06-25T23-07-30-361Z/01-host-setup-tools-390.png`
  - `/private/tmp/coffee-rush-live-mobile-async-2026-06-25T23-07-30-361Z/05-peer-post-sync-reopen-tools-360.png`

**2. Generic 404 console noise**

- Priority: P3.
- Observation: The live mobile run logged one generic `Failed to load resource: the server responded with a status of 404 ()`.
- Risk: Not relay-related and not user-facing in the tested flow, but it adds noise to smoke-test console triage.
- Recommended fix: Inspect the exact missing asset in DevTools/network on a follow-up run. If it is a favicon or manifest icon, add the asset/link or intentionally suppress the request.

### Smoke Harness Notes

- Use isolated browser contexts or profiles for host and peer. Same-origin tabs share Coffee Rush `localStorage` and can mask online-room bugs.
- Assert live navigation with hash routing: the game route is `/coffee-rush/#/game`, not `/coffee-rush/game`.
- Assert room protocol, mode, phase, and relay head through saved app state when needed; some remote status text is behind the mobile Tools disclosure.
- Pick board cells from current DOM state, e.g. `.board-cell.legal-cell` and `data-testid`, instead of assuming sequential IDs. Board IDs follow `boardLayout.csv` values such as `cell-11` through `cell-44`.
- For async peer verification, reload/reopen after commits when the goal is deterministic sync confirmation. The async room also polls, but reload gives a faster and clearer head-state check.

### Screenshot Evidence

![host setup tools](/private/tmp/coffee-rush-live-mobile-async-2026-06-25T23-07-30-361Z/01-host-setup-tools-390.png)

![peer setup](/private/tmp/coffee-rush-live-mobile-async-2026-06-25T23-07-30-361Z/02-peer-joined-setup-360.png)

![host move](/private/tmp/coffee-rush-live-mobile-async-2026-06-25T23-07-30-361Z/03-host-move-path-390.png)

![host pour](/private/tmp/coffee-rush-live-mobile-async-2026-06-25T23-07-30-361Z/04-host-pour-cup-hand-390.png)

![peer post-sync reopen](/private/tmp/coffee-rush-live-mobile-async-2026-06-25T23-07-30-361Z/05-peer-post-sync-reopen-tools-360.png)

## 2026-06-25 Live Async Host Close Pass

### Context

- Scenario: live production async online play, host closes room through the UI `New` path.
- Live app: `https://vanshkumar.net/coffee-rush/`
- Production bundle checked: `/coffee-rush/assets/index-vxD4NTZG.js`
- Expected relay URL confirmed in bundle: `wss://coffee-rush-relay.vanshkumar95.workers.dev/room`
- Tested room: `J6GMN8`
- Browser isolation: three separate temporary Chrome profiles for host, existing peer, and fresh peer.
- Redacted summary artifact: `/private/tmp/coffee-rush-J6GMN8-host-close-summary.json`
- Screenshot artifacts:
  - `/private/tmp/coffee-rush-J6GMN8-host-after-setup.png`
  - `/private/tmp/coffee-rush-J6GMN8-peer-after-setup.png`
  - `/private/tmp/coffee-rush-J6GMN8-host-after-close.png`
  - `/private/tmp/coffee-rush-J6GMN8-existing-peer-after-close-sync.png`
  - `/private/tmp/coffee-rush-J6GMN8-fresh-peer-old-invite.png`

### What Passed

- Relay preflight gate passed before UI testing:
  - `OPTIONS /room/create?room=ABC123` with `Origin: https://vanshkumar.net` returned `204` with CORS.
  - Invalid `POST /room/create?room=ABC123` returned `400` with `{"protocol":2,"error":"Unsupported async protocol."}` and CORS.
- Host created an async v2 room and existing peer joined from a separate profile.
  - Peer saved `mode: peer`, protocol `2`, relay auth, and game key.
  - Peer did not receive or save `hostAuth`.
- Host committed one setup placement through the real UI.
  - Host selected `cell-11`, chose cup 1, and relay commit `POST /room/commits` returned `200`.
  - Relay head reached `1`, and existing peer forced-sync matched head `1` with log length `1`.
- Shared invite auth could not close the room.
  - Browser-origin `POST /room/close` with `hostAuth = relayAuth` returned `403` with `BAD_HOST_AUTH`.
  - A follow-up `POST /room/head` returned `200`, proving the negative close did not mutate the room.
- Host `New` path closed the room.
  - UI action called `POST /room/close`, returned `200`, and sent `hostAuth` only in the JSON request body.
  - No room secrets appeared in close URLs.
  - Host local storage cleared all `coffee-rush:*` keys and returned to setup.
- Security/network checks found no failed CORS, no loading failures, no host auth in invite or network URLs, and no plaintext gameplay action/state strings in relay request bodies.

### Recommended App Fixes

**1. Existing peer closed-room state**

- Priority: P1.
- Observation: After the host closes the async room, an existing peer reload/sync gets `ROOM_NOT_FOUND` and shows the remote status as `error`, but it continues to render its cached local board and saved game state.
- Risk: The relay is correctly deleted, so this is not a server-side stale-state leak. It is still confusing UX and can look like the closed room remains playable because the peer's cached `active-game` and `async-room-state` remain visible.
- Recommended fix: Treat async `ROOM_NOT_FOUND` for an existing v2 session as a terminal closed-room state. Clear async room cache and active-game state for that room, or hide the board behind a closed-room panel with a `Leave` / `Back to setup` action.
- Evidence:
  - `/private/tmp/coffee-rush-J6GMN8-existing-peer-after-close-sync.png`
  - `/private/tmp/coffee-rush-J6GMN8-host-close-summary.json`

**2. Fresh old-invite fallback**

- Priority: P2.
- Observation: A fresh peer opening the old v2 invite after close first receives async `/room/head` `404`, then falls back to protocol `1` and shows `Room has not been hosted yet.`
- Risk: No decrypted stale room state is exposed, but the error is misleading because this was a closed async v2 room, not a never-hosted live v1 room.
- Recommended fix: If a session/invite is confirmed protocol `2`, do not fall back to live protocol after async `ROOM_NOT_FOUND`. Show a persistent room-not-found or room-closed message and clear the failed remote session.
- Evidence:
  - `/private/tmp/coffee-rush-J6GMN8-fresh-peer-old-invite.png`
  - `/private/tmp/coffee-rush-J6GMN8-host-close-summary.json`

### Smoke Harness Notes

- Expected status noise for this scenario includes the intentional `403 BAD_HOST_AUTH` negative close and post-close `404 ROOM_NOT_FOUND` sync/join checks. Treat those console `Failed to load resource` entries as expected when they correspond to these requests.
- Keep using isolated browser profiles or contexts for host, existing peer, and fresh peer. Same-origin tabs share `localStorage` and would hide the existing-peer cache behavior.
- When verifying host close, assert both the network close request and local cleanup: `POST /room/close` must be `200`, `hostAuth` must not be in the URL, and host `localStorage` should have no `coffee-rush:*` keys after returning to setup.

### Screenshot Evidence

![host after setup](/private/tmp/coffee-rush-J6GMN8-host-after-setup.png)

![peer after setup](/private/tmp/coffee-rush-J6GMN8-peer-after-setup.png)

![host after close](/private/tmp/coffee-rush-J6GMN8-host-after-close.png)

![existing peer after close sync](/private/tmp/coffee-rush-J6GMN8-existing-peer-after-close-sync.png)

![fresh peer old invite](/private/tmp/coffee-rush-J6GMN8-fresh-peer-old-invite.png)

## 2026-06-25 Live Async Reload-During-Draft Pass With Undo Bug

### Context

- Scenario: live production async online play, reload/close/reopen during an uncommitted draft turn, then stale-draft recovery after another isolated context advances the room.
- Live app: `https://vanshkumar.net/coffee-rush/`
- Production bundle checked: `/coffee-rush/assets/index-vxD4NTZG.js`
- Expected relay URL confirmed in bundle: `wss://coffee-rush-relay.vanshkumar95.workers.dev/room`
- Full-flow room: `NXC2N7`
- Destructive Undo probe room: `TJQT8F`
- Browser isolation: separate Chrome contexts for draft host and advancing peer so same-origin `localStorage` did not mask multi-device behavior.
- Result artifact: `/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-result.json`
- Undo failure artifact: `/private/tmp/coffee-rush-reload-draft-undo-failure/failure-1782428425368.json`
- Screenshot artifacts:
  - `/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-setup-complete.png`
  - `/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-draft-before-reload.png`
  - `/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-draft-after-reopen.png`
  - `/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-peer-advanced.png`
  - `/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-stale-draft-discarded.png`
  - `/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-final-host.png`
  - `/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-final-peer.png`
  - `/private/tmp/coffee-rush-reload-draft-undo-failure/TJQT8F-draft-before-reload.png`

### What Passed

- Relay preflight gate passed before UI testing:
  - `OPTIONS /room/create?room=ABC123` with `Origin: https://vanshkumar.net` returned `204` with CORS.
  - Invalid `POST /room/create?room=ABC123` returned `400` with `{"protocol":2,"error":"Unsupported async protocol."}` and CORS.
- The live bundle was fresh enough for async v2:
  - It contained the expected production relay URL.
  - It contained async protocol v2 paths, `coffee-rush:async-draft:v1`, and the stale-draft recovery message.
- Host created an async v2 room, completed setup, and a separate peer context joined/synced at relay head `4`.
- Host started a real uncommitted draft from the synced room:
  - `SKIP_UPGRADES`
  - `MOVE` from `cell-14` to `cell-13`
  - `DISCARD_HAND`
  - Visible status reached `Async host NXC2N7 · 3 draft`.
- No relay commit was sent before `END_TURN`.
  - Host setup created exactly four setup commits.
  - Draft actions, reload, and close/reopen did not add any `/room/commits` requests.
- Reload and close/reopen restored the local draft state.
  - UI remained on `Turn 1 / Ada / pour`.
  - Undo and End turn were enabled.
  - Saved draft still contained three draft actions.
- A separate peer context advanced the room while the host's local draft still existed.
  - Peer committed head `5`.
  - Reopened host discarded the stale draft and showed `The room advanced before this draft was committed. Replay the turn from the latest state.`
- Host completed a valid latest-state turn after stale-draft discard.
  - Final relay head reached `6`.
  - Host and peer converged to the same head hash `xipRyjYHtHGPzwRM6tKGNuhUBDPPt9nxQ57yBQ-bgGg` and same state hash.
- Security/network checks found no failed CORS, no page errors, no request failures, and no plaintext gameplay action/state strings in encrypted relay create/commit payloads.
- The only console noise was a benign live-site `favicon.ico` 404 in the host context.

### Recommended App Fixes

**1. Restored async draft Undo history**

- Priority: P1.
- Status: Implemented 2026-06-26 with canonical-head replay during draft hydration plus reload-plus-Undo regression coverage for `SKIP_UPGRADES`, `MOVE`, and `DISCARD_HAND`.
- Observation: In room `TJQT8F`, a restored draft with `SKIP_UPGRADES`, `MOVE`, and `DISCARD_HAND` showed Undo as enabled after reload. Clicking Undo changed the UI to `Turn 1 / Ada / move` with `2 draft`, hand length `0`, and saved draft actions `SKIP_UPGRADES`, `MOVE`. Expected behavior was to undo only `DISCARD_HAND`, leaving the UI in `pour` with the collected ingredient restored and two draft actions.
- Risk: This can corrupt local uncommitted draft state after reload. It does not appear to leak data or send an unintended relay commit before `END_TURN`, but it can leave the user replaying from a state that no longer matches the visible draft count/actions.
- Likely cause: `dispatchAsyncAction` applies the reducer action, then `setAsyncDraftState` persists `undoStackRef.current`. Because the undo stack is updated through React state in `applyAcceptedGameAction`, the persisted async draft can lag one undo entry behind the saved draft actions. In the failing probe, the saved draft had three actions but only two restored undo states, so Undo applied the pre-`MOVE` state while removing only the last draft action.
- Recommended fix: Keep async draft actions and undo history aligned synchronously. Options:
  - Compute the next undo stack synchronously inside the action path and pass it explicitly into async draft persistence.
  - Move the `undoStackRef.current` update before any draft save that depends on it.
  - Or rebuild draft undo history by replaying draft actions from the canonical room head during restore, so actions and undo states cannot drift.
- Regression coverage: Add a smoke/unit path that creates a draft with at least `SKIP_UPGRADES`, `MOVE`, and `DISCARD_HAND`, reloads, clicks Undo, and verifies the restored state is the pre-discard `pour` state with one ingredient in hand and two draft actions.
- Evidence:
  - `/private/tmp/coffee-rush-reload-draft-undo-failure/failure-1782428425368.json`
  - `/private/tmp/coffee-rush-reload-draft-undo-failure/TJQT8F-draft-before-reload.png`

### Smoke Harness Notes

- Keep destructive Undo-click verification separate from the stale-draft recovery path until the bug is fixed. The Undo click mutates local draft state and can prevent a clean stale-draft test from continuing.
- Continue using isolated browser contexts/profiles for host and peer; same-origin tabs share `localStorage` and can hide whether drafts are truly local to one device.
- Count commits using only `POST /room/commits`; reload and sync calls produce expected `POST /room/head` requests.
- Assert the saved draft action list, visible phase, active player, hand contents, and undo stack length together. A restored UI can look sane while `actions` and `undoStack` are already misaligned.
- Treat the live `favicon.ico` 404 as low-priority console noise unless it is useful to clean up smoke-test output.

### Screenshot Evidence

![setup complete](/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-setup-complete.png)

![draft before reload](/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-draft-before-reload.png)

![draft after reopen](/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-draft-after-reopen.png)

![peer advanced](/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-peer-advanced.png)

![stale draft discarded](/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-stale-draft-discarded.png)

![final host](/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-final-host.png)

![final peer](/private/tmp/coffee-rush-reload-draft-artifacts/NXC2N7-final-peer.png)

![undo probe draft before reload](/private/tmp/coffee-rush-reload-draft-undo-failure/TJQT8F-draft-before-reload.png)

## 2026-06-25 Live Async Network Interruption On Commit

### Context

- Scenario: live production async online play, network/relay interruption at the `END_TURN` commit boundary.
- Live app: `https://vanshkumar.net/coffee-rush/`
- Production bundle checked: `/coffee-rush/assets/index-vxD4NTZG.js`
- Expected relay URL confirmed in bundle: `wss://coffee-rush-relay.vanshkumar95.workers.dev/room`
- Production asset freshness:
  - HTML and JS `Last-Modified`: `Thu, 25 Jun 2026 22:25:04 GMT`
  - JS SHA-256: `e6edb35d3ee15311345fda4518f5311d8a93acd1619b1dac6e6e5f851b005f06`
- Scenario room: `TYMUDC`
- Initial UI-host proof room: `2WCTWL`
- Browser isolation note: the in-app browser exposed only one browser context and hid app `localStorage` from automation. For this pass, a separate Node relay harness created/verified the room as an isolated peer/validator, while the live production UI joined and played as the browser context.
- Interruption method: browser request interception/CDP network blocking was unavailable. The safe fallback was loading the same game route with `?relay=https://coffee-rush-relay.vanshkumar95.workers.dev:9/room`, an unreachable relay URL on the production relay host. This required a reload, so the failure covers reload-plus-network-interruption at the commit boundary rather than a pure in-place blocked fetch.
- Screenshot artifacts:
  - `/private/tmp/coffee-rush-TYMUDC-ready-to-end.png`
  - `/private/tmp/coffee-rush-TYMUDC-final-synced.png`

### What Passed

- Relay preflight gate passed before UI testing:
  - `OPTIONS /room/create?room=ABC123` with `Origin: https://vanshkumar.net` returned `204` with CORS.
  - Invalid `POST /room/create?room=ABC123` returned `400` with `{"protocol":2,"error":"Unsupported async protocol."}` and CORS.
- The live production bundle was async v2 and fresh enough:
  - It contained the expected production relay URL.
  - It contained async v2 create/head/commit code, encrypted snapshot/commit paths, draft persistence keys, and user-facing draft/commit messages.
- A fresh async v2 scenario room was created on the production relay and joined through the live UI.
  - Initial relay head was `0`.
  - UI joined room `TYMUDC` as async peer and synced the encrypted initial snapshot.
- Setup completed through the live UI.
  - Setup placements used `cell-11`, `cell-12`, `cell-13`, and `cell-14`, each into cup 1.
  - Relay head after setup was `4`.
  - Separate harness saw canonical state `phase=upgrade`, `turn=1`, active player `p1`, and log length `4`.
- A local draft was built before the commit boundary.
  - Draft actions: `SKIP_UPGRADES`, `MOVE`, `DISCARD_HAND`.
  - UI showed `Async TYMUDC · 3 draft`.
  - `End turn` was enabled.
- During the unreachable-relay commit attempt:
  - UI surfaced `Failed to fetch`.
  - Relay head stayed at `4`.
  - Separate harness still saw canonical state unchanged at Ada's turn, so the failed attempt did not advance the room head or corrupt peer/canonical state.
- After a clean reload from the normal relay and replaying from the latest canonical state, the turn committed successfully.
  - UI showed `Turn committed.` and `Async TYMUDC · synced`.
  - Relay head advanced exactly once, from `4` to `5`.
  - Final relay state was `phase=upgrade`, active player `p2`, log length `8`, and last message `Pass to Ben.`
  - Final browser console log read was empty; no failed CORS or unhandled exceptions remained after the successful replay.
- Harness request logs for relay create/head checks did not include plaintext player names or action types.

### What Failed

- The interrupted draft was not cleanly recoverable after reload with the relay unreachable.
  - Reloading with the bad relay restored visible pour-state UI and an enabled `End turn`, but remote status was `Async TYMUDC · error` instead of `3 draft`.
  - Clicking `End turn` while unreachable advanced only the local UI to Ben's upgrade phase and showed `Failed to fetch`; the relay head correctly stayed at `4`.
- Restoring the normal relay revealed a draft/action mismatch.
  - The UI showed Ben's post-turn state with `Async TYMUDC · 1 draft`, even though the visible local state included earlier uncommitted move/discard effects.
  - Clicking Undo removed only the failed `END_TURN`, then briefly showed `Async TYMUDC · synced` while the visible UI was still Ada's uncommitted pour state.
  - A full clean reload from the normal relay was required to return to canonical Ada upgrade state; the local draft was lost and had to be replayed.

### Recommended App Fixes

**1. Block commit from mismatched draft/canonical state**

- Priority: P0.
- Status: Implemented 2026-06-26 with a pre-submit draft replay/hash guard and regression coverage for an incomplete restored draft action list.
- Observation: After a failed sync/reload, the visible state can include uncommitted local effects while the saved draft action list only contains the later failed `END_TURN`.
- Risk: If a user commits from this mismatched state after the relay is restored, the encrypted commit could contain actions that do not replay to the encrypted result snapshot from the advertised base head. Peers would reject the commit on result-hash validation or the room could appear locally committed but unreadable elsewhere.
- Recommended fix: Before `submitTurnCommit`, replay the current draft action list from the stored canonical `baseHead` and assert the replayed state hash equals the visible/result state hash. If it does not match, block commit, show a recovery message, and force a canonical sync/replay path.
- Regression coverage: Add a reload-with-relay-unreachable case that creates `SKIP_UPGRADES`, `MOVE`, `DISCARD_HAND`, attempts failed `END_TURN`, restores network, and asserts the app refuses to submit unless draft actions and visible state match.

**2. Hydrate async draft state atomically after failed sync**

- Priority: P0.
- Status: Implemented 2026-06-26 with synchronous undo-ref updates plus offline-draft hydration that restores saved draft actions, visible state, undo stack, and cached base head together when `/room/head` fails.
- Observation: A bad-relay reload restored the visible game state but not the full draft metadata/count. The UI moved from `3 draft` before reload to `error`, then to `1 draft` after failed `END_TURN`.
- Risk: Users can see an actionable turn surface while the app does not know the correct draft base/actions. This makes Undo, retry, and commit behavior unreliable.
- Recommended fix: Treat canonical head, visible draft state, draft action list, and undo stack as one hydrated unit. If `syncAsyncRoom({ restoreDraft: true })` cannot fetch the canonical head, either keep the full saved draft metadata visible as `offline draft` or disable commit controls until canonical sync succeeds.
- Regression coverage: Assert status text, draft action count, phase, active player, and undo stack length together after reload when `/room/head` fails.

**3. Add an explicit retry/replay affordance after failed commit**

- Priority: P1.
- Status: Implemented 2026-06-26 with a failed-commit recovery boundary that preserves the completed action batch, offers `Retry commit`, `Replay from latest`, and `Discard local draft`, and blocks normal async turn actions until the failed commit is resolved.
- Observation: After `END_TURN` failed with `Failed to fetch`, the local UI advanced to the next player's upgrade phase. There was no explicit `Retry commit` button; the only workable recovery was a clean reload and manual replay from the latest canonical state.
- Risk: Users may not know whether to Undo, reload, or continue. Continuing could accumulate more local draft actions on top of a bad base.
- Recommended fix: On commit failure, keep or return the UI to the commit boundary with the same draft action list, and show clear actions such as `Retry commit`, `Replay from latest`, and `Discard local draft`. Disable starting the next turn until the failed commit is resolved.
- Regression coverage: Simulate a failed `/room/commits` request and assert the app keeps the end-turn draft recoverable without requiring a full reload.

**4. Friendlier network error copy**

- Priority: P2.
- Observation: The visible error was raw `Failed to fetch`.
- Risk: It is technically accurate but not enough guidance for async play recovery.
- Recommended fix: Map fetch/network exceptions during async commit to a persistent message such as `Could not commit this turn. Your draft is still on this device; reconnect and retry.` Only show `Failed to fetch` in developer/debug details.

### Smoke Harness Notes

- Prefer real browser request interception or DevTools network blocking for `coffee-rush-relay.vanshkumar95.workers.dev` when available. The relay-override fallback is useful but also tests reload/draft hydration.
- Use isolated browser contexts/profiles whenever possible. Same-origin tabs share Coffee Rush `localStorage` and can mask draft persistence bugs. If only one browser context is available, pair the UI run with a separate relay harness that verifies head index/hash and decrypted canonical state.
- Record the relay head immediately before the interrupted commit and again after failure. For this run, head `4` remained `4` after the failed attempt, then advanced to `5` only after a clean replay commit.
- Treat draft count, visible phase, active player, undo enabled state, and relay head as a single consistency assertion. A UI can show `synced` while still rendering an uncommitted local state.
- Do not continue committing from a recovered browser state if draft count/actions do not match the visible local state; force a clean canonical reload first.

### Screenshot Evidence

![ready to end turn](/private/tmp/coffee-rush-TYMUDC-ready-to-end.png)

![final synced after replay](/private/tmp/coffee-rush-TYMUDC-final-synced.png)
