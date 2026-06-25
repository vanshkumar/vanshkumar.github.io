# Coffee Rush

Hot-seat and online web adaptation of Coffee Rush for 2-4 players.

Deployed as a sibling Vite app at `/coffee-rush/`. The main Astro site is not
involved beyond the GitHub Pages assembly step.

## Commands

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

## Online Room Testing

Newly hosted online rooms use async protocol v2. The Cloudflare relay stores
encrypted canonical snapshots, encrypted completed-turn commits, sequence hashes,
and timing metadata. It does not store plaintext player names, actions, active
player, phase, order deck, or game state.

Invite links contain bearer secrets:

- a public `room` query parameter for relay routing
- a hash-fragment `auth` token for relay/storage admission
- a hash-fragment `key` token for browser-side AES-GCM encryption

Anyone with the full invite link can join the cooperative room. Do not post
invite links publicly, and do not put invite auth, game keys, or Cloudflare API
tokens in Vite environment variables.

Async rooms use HTTP endpoints derived from the configured relay URL. Existing
protocol v1 WebSocket rooms remain supported for older saved sessions and local
compatibility when either of these is set:

- `?relay=ws://HOST:PORT` in the app URL, useful for local testing.
- `VITE_COFFEE_RUSH_RELAY_URL=wss://relay.example.com/room` at build time, useful
  for the deployed GitHub Pages app.

For local testing:

```bash
python3 scripts/dev-relay.py 8787
```

Then open `/coffee-rush/?relay=ws://127.0.0.1:8787#/` when intentionally testing
protocol v1 compatibility, and share the copied invite link with another
browser/profile on the same network. The local Python relay is protocol v1 only;
true async play needs the Cloudflare Worker relay because the host browser no
longer stores the room head.
For phones on your LAN, bind the relay and app server to all interfaces and use
your Mac's LAN IP in the relay URL:

```bash
python3 scripts/dev-relay.py 8787 0.0.0.0
```

For the Cloudflare relay:

```bash
cd relay
npm install
npm run dev
npm run deploy
```

Set the public GitHub Actions repository variable `COFFEE_RUSH_RELAY_URL` to
the deployed Worker URL, for example `wss://coffee-rush-relay.example.workers.dev/room`.
The parent Pages workflow maps that to `VITE_COFFEE_RUSH_RELAY_URL` only while
building the Coffee Rush Vite app.

Async room undo is local-only for the current uncommitted draft turn. Once an
`END_TURN` commit is accepted, there is no global online undo/delete operation.
Async rooms expire 14 days after the last accepted commit. Reads, joins, and sync
checks do not extend the expiry.

## Where Things Live

- `src/App.jsx` sets up the hash-routed setup, game, and results pages.
- `src/engine/` contains the pure, serializable game rules. Start with
  `technical_reqs.md` before changing engine behavior.
- `data/*.csv` are source data; `src/data/` contains app-consumable modules.
- `src/tests/` covers reducer mechanics, exports, and replay fixtures.
- `product_reqs.md` is the compact rules reference for product behavior.
