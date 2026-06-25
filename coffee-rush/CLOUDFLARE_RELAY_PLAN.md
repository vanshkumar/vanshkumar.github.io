# Cloudflare Relay Implementation Plan

Verified against official Cloudflare and Vite documentation on 2026-06-25.
This plan is for the Cloudflare Workers + Durable Objects relay option only; it
does not remove the existing local Python relay or Trystero fallback.

Security revision implemented after review: the Cloudflare relay is a blind
relay for Coffee Rush app payloads. The relay validates room admission and
encrypted envelope shape, but game actions and snapshots are encrypted in the
browser with AES-GCM before they are placed in `ROOM_MESSAGE.data`.

## 1. Architecture and Protocol

Recommended shape: one Cloudflare Worker front door and one Durable Object per
Coffee Rush room.

- Browser client connects to `wss://<relay-host>/room?room=ABC123`.
- The Worker validates method, `Upgrade: websocket`, path, room-code shape,
  optional origin allowlist, and coarse rate limits before touching Durable
  Objects.
- The Worker routes the request with `env.COFFEE_RUSH_ROOMS.idFromName(roomId)`
  and forwards the upgrade request to that Durable Object.
- The Durable Object owns room membership, room secret hash, socket attachments,
  peer join/leave notifications, target lookup, and cleanup.
- The Durable Object should use Cloudflare's WebSocket Hibernation API:
  `ctx.acceptWebSocket(server)`, `webSocketMessage`, `webSocketClose`, and
  `serializeAttachment`/`deserializeAttachment`. Do not use plain
  `server.accept()` for production because it keeps the object duration-billable
  while sockets are open.

The existing relay protocol can stay mostly intact:

Client to relay:

```json
{"type":"JOIN","protocol":1,"roomId":"ABC123","clientId":"...","roomAuth":"...","hostAuth":"host-only-token","role":"host"}
{"type":"JOIN","protocol":1,"roomId":"ABC123","clientId":"...","roomAuth":"...","role":"peer"}
{"type":"ROOM_MESSAGE","roomId":"ABC123","target":"optional-peer-id","data":{"v":1,"alg":"A256GCM","iv":"...","ciphertext":"..."}}
```

Relay to client:

```json
{"type":"JOIN_ACK","clientId":"...","peerIds":["..."]}
{"type":"PEER_JOIN","peerId":"..."}
{"type":"PEER_LEAVE","peerId":"..."}
{"type":"ROOM_MESSAGE","from":"...","data":{"v":1,"alg":"A256GCM","iv":"...","ciphertext":"..."}}
{"type":"ERROR","code":"ROOM_FULL","message":"Room is full."}
```

Important client adjustment: the current client opens `new WebSocket(relayUrl)`
before the relay knows the room. Add a helper in `src/network/roomSync.js` that
appends the normalized `room` query parameter to the configured relay URL before
opening the socket. Keep sending `JOIN` after open so `scripts/dev-relay.py`
continues to work. The local Python relay ignores the WebSocket request path and
query, so `?relay=ws://127.0.0.1:8787` remains compatible.

Inner Coffee Rush sync messages should stay unchanged:

- Peer sends `HELLO`, `RESYNC_REQUEST`, or `ACTION_REQUEST`.
- Host validates `ACTION_REQUEST` by running `applyAction`.
- Host broadcasts `ACTION_ACCEPTED`, `ACTION_REJECTED`, or `STATE_SNAPSHOT`.
- Relay treats `data` as a validated opaque app payload; game-rule authority
  stays at the host reducer boundary.

## 2. Security Model

Room code vs secrets:

- The six-character room code is a public locator and Durable Object key. It is
  for typing, display, and routing only. It is not authentication.
- Add high-entropy secrets generated with `crypto.getRandomValues`:
  - `relayAuth`: shared invite token used only for relay admission
  - `gameKey`: shared AES-GCM key used only by browsers for app payloads
  - `hostAuth`: host-only relay token kept out of invite links
- Store all secrets in the host remote session, but include only `relayAuth`
  and `gameKey` in invite URLs. Put private invite values in the hash fragment,
  not the URL query, for example
  `/coffee-rush/?room=ABC123#/?auth=<relayAuth>&key=<gameKey>`.
- Update the join UI to accept either a full invite URL or
  `ABC123.<relayAuth>.<gameKey>`.
  Do not allow code-only joins on the Cloudflare relay or local dev relay.
- On first authenticated host `JOIN`, the Durable Object stores only hashes of
  `relayAuth` and `hostAuth`. Subsequent joins must match the relay auth hash;
  host-only relay actions must also match host auth. The relay should never
  broadcast secrets.
- Anyone with the invite secret can join and submit valid game actions. This is
  a bearer-link model, not identity or per-player authorization.

Message validation:

- Reject non-text WebSocket messages.
- Reject JSON parse failures and envelopes over a small app limit, such as
  256 KiB. Cloudflare Durable Objects allow much larger received WebSocket
  messages, but Coffee Rush does not need them.
- Accept only known relay envelope types: `JOIN`, `ROOM_MESSAGE`, `CLOSE_ROOM`,
  and optional `PING`.
- Normalize and verify `roomId` with the existing six-character code rules.
- Verify `clientId` is a short generated identifier and never trust a client
  supplied `from`; the relay sets `from` from authenticated socket attachment.
- Require successful `JOIN` before forwarding any `ROOM_MESSAGE`.
- If `target` is set, require it to be an active client in the same room.
- For `data`, validate only the AES-GCM envelope shape and cap the serialized
  relay envelope size. The relay cannot inspect encrypted Coffee Rush payloads.
- Close abusive sockets with standard WebSocket policy/too-large close codes
  after sending one `ERROR` where practical.

Rate limits:

- Worker-level: validate upgrade request before routing to Durable Objects.
  Add Cloudflare Rate Limiting binding if available for the account, keyed by
  room code and path rather than IP where possible. Cloudflare's own docs warn
  that IP can over-limit shared mobile/proxy users.
- Durable Object room-level: token bucket per socket, for example burst 20 and
  refill 10 messages per second, with a lower cap for large snapshots.
- Room-level aggregate: cap total messages per room, for example 120/minute
  sustained. Coffee Rush turn actions are sparse, so this is generous.
- Join-level: close unauthenticated sockets that do not send a valid `JOIN`
  within 5 seconds.

Room limits:

- Cap active sockets per room at 4 for the 2-4 player game, or 5 if we want one
  reconnect grace slot.
- Cap room lifetime at 6 hours from creation and idle lifetime at 30 minutes
  after the last socket disconnects.
- If a host closes the game, broadcast `ROOM_CLOSED`, close sockets, delete room
  storage, and allow the room code to be reused later with a new secret.
- If a new host races an existing room code with a different secret, reject with
  `ROOM_EXISTS` and have the client generate a new code.

Idle cleanup:

- Track `createdAt`, `lastActiveAt`, `closedAt`, `hostClientId`, `roomAuthHash`,
  and `hostAuthHash` in Durable Object storage.
- Use alarms to delete storage when a room has no sockets and has been idle for
  the configured TTL.
- Update `lastActiveAt` on `JOIN`, `ROOM_MESSAGE`, and close.
- Local `wrangler dev` can verify logic, but production metrics are needed to
  verify real hibernation/idle billing behavior.

## 3. Repo Changes Needed

New relay package:

- Add `relay/package.json` with scripts:
  - `dev`: `wrangler dev --port 8788`
  - `deploy`: `wrangler deploy`
  - `test`: `vitest run`
- Add `relay/wrangler.toml`:
  - `main = "src/index.js"`
  - `compatibility_date = "2026-06-25"` or the implementation date
  - `[[durable_objects.bindings]] name = "COFFEE_RUSH_ROOMS"`
  - `[[migrations]] tag = "v1"; new_sqlite_classes = ["CoffeeRushRoom"]`
  - optional `[[ratelimits]]` binding if we choose Cloudflare's Rate Limiting
    API
- Add `relay/src/index.js` for Worker + Durable Object implementation.
- Add `relay/src/protocol.js` for shared validators and constants.
- Add `relay/src/protocol.test.js` for message, room, and rate-limit helper
  tests.

Client updates:

- `src/persistence/remoteSession.js`
  - Add `relayAuth`, `hostAuth`, and `gameKey` to saved sessions.
  - Add token generation helpers.
  - Add invite URL parsing for `room` plus hash-fragment `auth` and `key`.
  - Keep normalizing room codes exactly as today.
- `src/network/roomSync.js`
  - Add `createRelaySocketUrl(relayUrl, roomId)`.
  - Include `protocol: 1`, `roomAuth`, and host-only `hostAuth` in `JOIN`.
  - Encrypt/decrypt app payloads before/after relay transport.
  - Handle relay `ERROR` and close reasons with useful UI errors.
- `src/pages/SetupPage.jsx`
  - Host creates room code, relay auth, host auth, and game key.
  - Join input accepts full invite URL or `CODE.relayAuth.gameKey`.
- `src/pages/GamePage.jsx`
  - Pass `relayAuth`, host-only `hostAuth`, and `gameKey` to `connectRoom`.
  - Copy invite link with the room code, relay auth, and game key.
- `src/tests/remoteSession.test.js` and `src/tests/roomSync.test.js`
  - Cover secret persistence, invite parsing, and socket URL query handling.
- `README.md`
  - Document Cloudflare relay commands and GitHub Pages env wiring.

Deploy workflow:

- Update `../.github/workflows/deploy.yml` under the existing `Build
  coffee-rush` step:

```yaml
      - name: Build coffee-rush
        run: npm run build
        working-directory: coffee-rush
        env:
          VITE_COFFEE_RUSH_RELAY_URL: ${{ vars.COFFEE_RUSH_RELAY_URL }}
```

Do not put room secrets or API tokens in a `VITE_` variable. The relay URL is
public by design.

## 4. Cloudflare Setup and Deploy Steps

One-time setup:

1. Install relay dependencies in `coffee-rush/relay`, including `wrangler`.
2. Run `npx wrangler login`.
3. Choose a Worker name, for example `coffee-rush-relay`.
4. Configure `wrangler.toml` with the Durable Object binding and SQLite-backed
   class migration.
5. Configure allowed origins as plain vars, for example:
   - `https://vanshkumar.github.io`
   - the custom Pages domain if the site uses one
   - `http://localhost:5173` for local tests only
6. Optional: add a custom domain like `coffee-rush-relay.<domain>`; otherwise
   use the generated `workers.dev` hostname.

Local deploy checks:

```bash
cd coffee-rush/relay
npx wrangler dev --port 8788
```

Production deploy:

```bash
cd coffee-rush/relay
npx wrangler deploy
```

After deploy:

- Confirm `wss://<worker-host>/room?room=ABC123` rejects missing or invalid
  `JOIN`.
- Confirm Worker logs show rejected malformed upgrades before Durable Object
  routing where possible.
- Confirm Durable Object metrics show low request volume and hibernation-friendly
  duration behavior during idle sockets.

## 5. GitHub Pages Env Wiring

Current Coffee Rush deploy flow builds the Vite app in `../.github/workflows/deploy.yml`
and copies `coffee-rush/dist` into the final Pages artifact. Wire the relay URL
only on the Coffee Rush build step.

Repository variable:

- Name: `COFFEE_RUSH_RELAY_URL`
- Value: `wss://<worker-host>/room`

Workflow:

- Add `VITE_COFFEE_RUSH_RELAY_URL: ${{ vars.COFFEE_RUSH_RELAY_URL }}` to the
  `Build coffee-rush` step.
- Keep the existing `?relay=ws://HOST:PORT` override for local and emergency
  testing.
- Since Vite exposes `VITE_*` variables in the browser bundle, treat this as
  public configuration, not a secret.

Validation after Pages deploy:

- Load `https://<pages-host>/coffee-rush/`.
- Open devtools and confirm the production bundle attempts `wss://<worker-host>/room?room=...`
  after hosting or joining an online room.
- Copy an invite link and confirm the URL contains `room` and `key`.

## 6. Local and Browser Testing Plan

Unit tests:

- Existing app tests:
  - `src/tests/remoteSession.test.js` for secret generation, save/load, and URL
    parsing.
  - `src/tests/roomSync.test.js` for relay URL precedence and room query
    appending.
- Relay tests:
  - room code validator
  - secret hashing/compare helper
  - envelope validator
  - rate-limit token bucket
  - room full and target validation

Local integration:

1. Start the Worker relay:

   ```bash
   cd coffee-rush/relay
   npx wrangler dev --port 8788
   ```

2. Start Vite with the local relay:

   ```bash
   cd coffee-rush
   VITE_COFFEE_RUSH_RELAY_URL=ws://127.0.0.1:8788/room npm run dev
   ```

3. Open two isolated Chrome contexts:
   - host online game in one context
   - open copied invite link in the other
   - verify initial snapshot, setup placement, peer action request, host
     acceptance, undo snapshot, and room close

Browser regression matrix:

- Chrome desktop, two profiles.
- Mobile Safari or Chrome on LAN against deployed Worker.
- Reload peer mid-game and verify host snapshot resync.
- Reload host mid-game and verify peer can reconnect once host returns.
- Invalid invite secret rejects without exposing room state.
- Fifth socket rejects with `ROOM_FULL`.
- Malformed large message closes without affecting other clients.
- Idle room disappears after TTL and cannot be joined with the old secret.

Production smoke:

- Deploy Worker first.
- Set GitHub Actions repository variable.
- Trigger Pages workflow manually.
- Host one real room from Pages and join from a second browser/device.
- Tail Worker logs during the session and inspect Durable Object metrics after
  the room idles.

## 7. Cost and Free-Tier Assumptions

Current official documentation supports the Cloudflare relay as a plausible
free-tier feature for casual Coffee Rush traffic, assuming we use hibernatable
Durable Object WebSockets and keep storage tiny.

Workers:

- Workers Free includes 100,000 requests per day and 10 ms CPU per invocation.
- A WebSocket connection to a Worker counts as the initial Upgrade request;
  WebSocket messages routed through a Worker do not count as Worker requests.
- Workers Paid is a minimum $5/month account plan with 10 million included
  requests/month and no additional egress/throughput charge listed in the
  pricing page.

Durable Objects:

- Durable Objects are available on Workers Free and Paid plans.
- Free plan supports only SQLite-backed Durable Objects, which is fine for this
  relay.
- Free plan includes 100,000 Durable Object requests per day and 13,000 GB-s per
  day of duration.
- Durable Object requests include HTTP requests, WebSocket messages, and alarm
  invocations.
- Incoming WebSocket messages use a 20:1 billing ratio for compute requests, so
  100 incoming messages are billed as 5 Durable Object requests for billing
  purposes. Outgoing WebSocket messages and protocol pings are not charged as
  Durable Object requests.
- Hibernatable idle Durable Objects are not billed for duration while eligible
  for hibernation; calling plain `accept()` on a WebSocket would incur duration
  charges for the whole connection, so use the WebSocket Hibernation API.
- Current Durable Object limits list unlimited object count, 100 classes on
  Free, 5 GB total storage on Free, 10 GB per SQLite-backed object, 32 MiB
  received WebSocket message size, and 30 seconds default CPU per request.

Rough Coffee Rush estimate:

- One 2-client game creates about 2 Worker WebSocket upgrade requests and 2
  Durable Object connection requests.
- Even a chatty game with 500 incoming relay messages would be roughly 25
  billable Durable Object message requests under the documented 20:1 ratio.
- Storage is one tiny room metadata record plus alarms, far below free storage
  limits.
- The main cost risk is accidentally using non-hibernatable WebSockets or
  allowing abusive long-lived/large-message rooms. The security limits above are
  meant to contain that.

Official docs checked:

- Cloudflare Workers WebSockets:
  https://developers.cloudflare.com/workers/runtime-apis/websockets/
- Cloudflare Durable Objects WebSockets and hibernation:
  https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- Cloudflare Durable Objects limits:
  https://developers.cloudflare.com/durable-objects/platform/limits/
- Cloudflare Workers pricing, including Durable Objects:
  https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare Workers Rate Limiting binding:
  https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- Cloudflare Wrangler commands:
  https://developers.cloudflare.com/workers/wrangler/commands/
- Vite environment variables:
  https://vite.dev/guide/env-and-mode
