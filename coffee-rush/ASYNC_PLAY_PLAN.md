# Coffee Rush Async Online Play Plan

Date: 2026-06-25

## Goal

Add true asynchronous online play so a room can continue while the original host
browser is closed. Preserve the current security posture as much as practical:
Cloudflare should coordinate and store data, but should not need to see game
state, player names, turn details, actions, or room secrets.

## Security Answer: Can Room Requests Inject JavaScript?

There is no direct JavaScript injection path if the async implementation keeps
the same data-only discipline as the current blind relay:

- incoming room data is treated as encrypted bytes/JSON data, never code
- clients decrypt with Web Crypto and parse JSON
- clients validate message shape, action shape, hash-chain position, and game
  legality with `applyAction`
- React renders game strings as text, not via `dangerouslySetInnerHTML`
- the app must never call `eval`, `new Function`, dynamic `import()`, script tag
  creation, or `innerHTML` assignment with room-provided values

The realistic risks are not "someone sends JS and it runs" unless future code
adds unsafe rendering or code execution. The real risks are:

- malicious or corrupted encrypted commits causing sync failure
- denial of service through oversized payloads or repeated stale commits
- rollback/withholding by a compromised server or browser
- invalid game actions from someone who has the invite link
- XSS elsewhere in the app exfiltrating localStorage secrets such as `gameKey`

Mitigations:

- keep strict envelope size limits before decrypting
- require valid AES-GCM envelopes and include room/index/hash metadata as AAD
- validate decrypted payloads with allowlisted message/action schemas
- only apply commits by replaying through the reducer from a known state
- reject stale commits with `expectedHeadIndex` and `prevHeadHash`
- store and compare `headHash` locally to detect rollback for returning clients
- keep room secrets in URL fragments and localStorage, never in public env vars
- keep Cloudflare `ALLOWED_ORIGINS` aligned with production/local test hosts
- use per-room and per-client rate limits
- never persist decrypted room data on Cloudflare

Assumption for v2: everyone with the invite link is cooperative enough not to
intentionally sabotage the game. Security still protects against injection,
accidental corruption, stale writes, outsiders without the invite, and excess
server visibility.

## Recommended Architecture

Use a hybrid encrypted-storage design:

- one Durable Object per room
- Cloudflare stores encrypted canonical snapshots and encrypted turn commits
- Cloudflare sequences commits and enforces stale-head rejection
- clients decrypt, validate, and apply commits locally
- no browser has to remain open for the room to continue

Cloudflare may see:

- public room code / Durable Object key
- auth secret hashes
- commit indexes
- commit hashes
- encrypted blob sizes
- timing metadata such as `createdAt`, `lastMoveAt`, and `expiresAt`

Cloudflare should not see:

- player names
- active player id
- phase
- turn number
- board state
- order deck
- actions
- undo stack
- `relayAuth`
- `gameKey`

## Why Not Per-Player Invites For v2?

Per-player invites help only if the server needs to enforce that seat `p2`, and
only seat `p2`, can submit `p2`'s turn. That requires either:

- Cloudflare knowing plaintext turn ownership metadata, or
- a more complex cryptographic design where each seat signs commits and clients
  enforce the active seat after decrypting

For Coffee Rush's cooperative async model, each browser can already decrypt the
state and know whether it is that local player's turn. The UI should only allow
drafting and committing when local state says it is that player's turn. A person
with the shared invite could handcraft a request pretending to be another
player, but that is out of scope for v2.

Use one shared invite link for v2:

- `room` query parameter: public locator
- `auth` hash-fragment token: relay/storage admission
- `key` hash-fragment token: browser encryption key

Keep host/admin-only secrets out of the invite only if an admin operation remains.
The recommended v2 removes global undo, so host-only authority can be minimal or
limited to room close.

## Turn Commit Model

Change online play from "commit every reducer action immediately" to "commit one
completed turn."

Flow:

1. Client loads latest encrypted room head.
2. Client decrypts latest snapshot and pending commits.
3. Client reducer-validates the canonical state.
4. If local state says this browser's player is active, the UI allows a draft
   turn.
5. The player takes local actions exactly as today.
6. `Undo` affects only the local draft turn.
7. On `END_TURN`, the client submits one encrypted turn commit.
8. Durable Object accepts the commit only if it matches the current head.
9. Other clients later fetch/decrypt/replay the commit.

No global undo:

- before commit: undo is local and private
- after commit: no rewind/delete operation
- if a player made a mistake and already committed, the table handles it socially
  or starts a new game

Setup placement can be handled as small setup commits, because each placement is
already atomic. If desired, setup can also use a local confirm step, but it does
not need the full draft-turn model.

## Durable Object Storage Model

Use SQLite-backed Durable Object storage.

Suggested tables:

```sql
CREATE TABLE IF NOT EXISTS room_meta (
  room_id TEXT PRIMARY KEY,
  protocol INTEGER NOT NULL,
  room_auth_hash TEXT NOT NULL,
  host_auth_hash TEXT,
  created_at INTEGER NOT NULL,
  last_move_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  closed_at INTEGER NOT NULL DEFAULT 0,
  head_index INTEGER NOT NULL DEFAULT 0,
  head_hash TEXT NOT NULL,
  latest_snapshot_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS commits (
  room_id TEXT NOT NULL,
  commit_index INTEGER NOT NULL,
  prev_hash TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  encrypted_commit TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (room_id, commit_index)
);

CREATE TABLE IF NOT EXISTS snapshots (
  room_id TEXT NOT NULL,
  snapshot_index INTEGER NOT NULL,
  head_hash TEXT NOT NULL,
  encrypted_snapshot TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (room_id, snapshot_index)
);
```

Because each Durable Object maps to one room, `room_id` is technically redundant
inside each object, but keeping it in rows makes tests and future migrations
clearer.

## Protocol v2

Keep the current WebSocket relay for live v1 compatibility. Add HTTP endpoints
for async v2, and optionally add WebSocket live push later.

Suggested endpoints:

- `POST /room/create?room=ABC123`
- `POST /room/head?room=ABC123`
- `POST /room/commits?room=ABC123`
- `POST /room/snapshot?room=ABC123`
- `POST /room/close?room=ABC123`

Use POST for auth-bearing requests so tokens do not go in query strings. The
invite secrets still live in the browser URL fragment and are sent only inside
request bodies.

Create room request:

```json
{
  "protocol": 2,
  "roomAuth": "...",
  "hostAuth": "...",
  "initialSnapshot": {
    "v": 1,
    "alg": "A256GCM",
    "iv": "...",
    "ciphertext": "..."
  },
  "headHash": "..."
}
```

Head request:

```json
{
  "protocol": 2,
  "roomAuth": "...",
  "knownHeadIndex": 4,
  "knownHeadHash": "..."
}
```

Head response:

```json
{
  "protocol": 2,
  "headIndex": 5,
  "headHash": "...",
  "latestSnapshotIndex": 5,
  "latestSnapshot": {
    "v": 1,
    "alg": "A256GCM",
    "iv": "...",
    "ciphertext": "..."
  },
  "commits": []
}
```

Commit request:

```json
{
  "protocol": 2,
  "roomAuth": "...",
  "expectedHeadIndex": 4,
  "prevHeadHash": "...",
  "commitHash": "...",
  "encryptedCommit": {
    "v": 1,
    "alg": "A256GCM",
    "iv": "...",
    "ciphertext": "..."
  },
  "encryptedSnapshot": {
    "v": 1,
    "alg": "A256GCM",
    "iv": "...",
    "ciphertext": "..."
  }
}
```

Commit response:

```json
{
  "protocol": 2,
  "accepted": true,
  "headIndex": 5,
  "headHash": "..."
}
```

Stale response:

```json
{
  "protocol": 2,
  "accepted": false,
  "error": "STALE_HEAD",
  "headIndex": 5,
  "headHash": "..."
}
```

## Commit Payloads

Encrypted turn commit plaintext:

```json
{
  "type": "TURN_COMMIT",
  "roomId": "ABC123",
  "baseIndex": 4,
  "baseHash": "...",
  "actions": [
    { "type": "SKIP_UPGRADES", "playerId": "p1" },
    { "type": "MOVE", "playerId": "p1", "meepleId": "p1-m1", "path": [1, 2], "rushSpent": 0 },
    { "type": "POUR", "playerId": "p1", "ingredientFromHand": "milk", "cupIdx": 0 },
    { "type": "END_TURN", "playerId": "p1" }
  ],
  "resultStateHash": "..."
}
```

Encrypted snapshot plaintext:

```json
{
  "type": "STATE_SNAPSHOT",
  "roomId": "ABC123",
  "headIndex": 5,
  "headHash": "...",
  "state": { "...": "full Coffee Rush state" }
}
```

Do not store or sync global undo stacks. Local draft undo can be reconstructed
from the draft action list and the last canonical state.

## Hash Chain

Use deterministic JSON canonicalization for hashes. Define it once and test it.

Suggested head hash:

```text
SHA-256(
  "coffee-rush:v2:" ||
  roomId ||
  commitIndex ||
  prevHeadHash ||
  canonicalJson(encryptedCommit)
)
```

Use AES-GCM AAD for encrypted commit/snapshot envelopes:

```json
{
  "roomId": "ABC123",
  "protocol": 2,
  "kind": "commit",
  "index": 5,
  "prevHeadHash": "..."
}
```

This prevents copying an encrypted blob into a different room/index without
decryption failure.

## Expiry And Cleanup

Room lifetime:

- 5 days after the last accepted move/commit
- each accepted commit sets `lastMoveAt = now`
- each accepted commit sets `expiresAt = now + 5 days`
- reads, joins, failed commits, and sync requests do not reset expiry

Cleanup:

- schedule the Durable Object alarm for `expiresAt`
- on alarm, delete room storage if `Date.now() >= expiresAt`
- on every request, lazily reject/delete expired rooms before processing
- close operations should delete storage immediately if host/admin close remains

## Client State Model

Local persisted pieces:

- canonical room state at last accepted head
- `headIndex`
- `headHash`
- local draft actions for the current uncommitted turn
- local draft undo stack or draft base state
- remote session secrets and room metadata

Important behavior:

- rendering uses canonical state plus local draft only for the active local player
- a stale-head response discards or parks the local draft, syncs canonical state,
  and asks the player to retry from the latest state
- reload during a draft should restore the draft if it is still based on the
  current head
- reload after commit should load canonical state from the server

## File-Level Implementation Plan

### `src/network/roomCrypto.js`

- add base64url decode export if useful
- add canonical JSON helper
- add SHA-256 hash helper
- add AES-GCM encrypt/decrypt with AAD
- add encrypted commit/snapshot helpers
- keep v1 message encryption compatibility

### `src/network/asyncRoom.js`

New module for protocol v2:

- `createAsyncRoom(session, initialState)`
- `fetchAsyncRoomHead(session, knownHead)`
- `submitTurnCommit(session, baseHead, actions, snapshot)`
- `closeAsyncRoom(session)`
- strict response validation
- no direct game-rule logic

### `src/persistence/remoteSession.js`

- bump saved session version for async fields
- preserve v1 loading where practical
- store `protocol`, `headIndex`, `headHash`, and maybe `roomCreatedAt`
- keep `relayAuth` and `gameKey` in invites
- keep any `hostAuth` out of invites if room close remains host-only

### `src/persistence/localStorage.js`

- add draft-turn persistence keyed by room id/head hash
- store canonical async head metadata separately from transient draft data
- clear drafts on room close/new game

### `src/network/roomSync.js`

- keep current v1 live relay behavior
- optionally expose shared URL helpers for v2
- do not remove the local Python relay path in the first async pass

### `src/pages/SetupPage.jsx`

- hosting online game creates protocol v2 async room by default
- create initial state locally
- upload encrypted initial snapshot before navigating to `/game`
- join path accepts the same invite link shape

### `src/pages/GamePage.jsx`

- split local reducer dispatch into:
  - canonical action application
  - online draft action application
  - commit completed turn
- peers are no longer special; every client is an async participant
- `Undo` is enabled only for local uncommitted draft actions
- after `END_TURN`, submit encrypted turn commit and snapshot
- on accepted commit, update canonical state/head and clear draft
- on stale head, resync and ask the player to replay/retry
- remove host-authoritative message handling from v2 rooms
- keep v1 handling until migration is intentionally removed

### `relay/src/protocol.js`

- add protocol v2 constants
- validate async request envelopes
- validate encrypted envelope size/shape
- validate room/auth/client ids
- add commit/snapshot size caps
- add TTL constants for 5-day sliding expiry

### `relay/src/index.js`

- keep existing WebSocket v1 route
- add HTTP v2 route handling
- initialize SQLite schema in constructor via `blockConcurrencyWhile`
- store auth hashes only
- compare auth using fixed-size hash comparison
- implement create/head/commit/snapshot/close
- persist writes before returning responses
- use alarms for expiry cleanup
- reject expired rooms lazily
- keep structured error responses

### `relay/wrangler.toml`

- add a new migration tag if schema changes require it
- keep Durable Object binding name stable unless a clean v2 class is preferred
- consider enabling observability after implementation

### `README.md`

- document async online behavior
- document 5-day expiry
- clarify that invite links are bearer secrets
- clarify that Cloudflare stores encrypted state/logs, not plaintext game data

## Tests

Client unit tests:

- invite parsing still keeps secrets in hash fragments
- async session save/load round-trips v2 head metadata
- encrypted payloads fail to decrypt with wrong room/index AAD
- hash-chain helper is deterministic
- draft undo affects only local draft state
- completed turn creates one commit with all reducer actions
- stale-head response triggers resync

Relay unit tests:

- create room stores only hashes and encrypted blobs
- peer cannot create room without valid auth shape
- head request rejects bad auth
- commit accepts exact current `expectedHeadIndex` and `prevHeadHash`
- commit rejects stale head without writing
- commit resets `expiresAt` to 5 days from accepted write
- head/read requests do not reset `expiresAt`
- expired room is deleted/rejected on alarm and lazy request
- oversized encrypted commit/snapshot is rejected
- malformed JSON/envelopes are rejected before storage writes

Browser smoke tests:

- host creates async room and closes browser
- peer opens invite, syncs state, completes setup/turn, commits
- original host reopens later and sees peer's committed turn
- two isolated contexts race a commit; one accepts, one gets stale-head
- reload during a local draft restores or safely discards the draft
- no room payload appears as executable HTML/JS in the DOM

Use isolated browser contexts because same-origin tabs share localStorage and can
hide real multi-device behavior.

## Migration Path

Recommended:

1. Leave existing v1 live relay rooms working.
2. Make newly hosted online rooms protocol v2 async rooms.
3. Joining an old v1 invite uses the current host-authoritative path.
4. Do not attempt automatic v1-to-v2 migration unless the host is online.
5. Later, remove v1 only after deployed async rooms are stable.

## Open Implementation Choices

- Whether to keep a host-only close-room action. If yes, keep `hostAuth` in host
  local session only. If no, any participant can locally leave and rooms expire
  naturally after 5 days.
- Whether to upload a full encrypted snapshot after every committed turn. This is
  simplest and likely cheap for Coffee Rush. If storage grows, snapshot every N
  commits and keep the encrypted log.
- Whether to add live WebSocket push for v2 after HTTP async works. It is useful
  for live play, but not necessary for async correctness.
