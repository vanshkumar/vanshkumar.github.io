# Coffee Rush

Hot-seat web adaptation of Coffee Rush for 2-4 local players.

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

Online rooms use a WebSocket relay when either of these is set:

- `?relay=ws://HOST:PORT` in the app URL, useful for local testing.
- `VITE_COFFEE_RUSH_RELAY_URL=wss://relay.example.com` at build time, useful
  for the deployed GitHub Pages app.

For local testing:

```bash
python3 scripts/dev-relay.py 8787
```

Then open `/coffee-rush/?relay=ws://127.0.0.1:8787#/`, host a room, and share
the copied invite link with another browser/profile on the same network.
For phones on your LAN, bind the relay and app server to all interfaces and use
your Mac's LAN IP in the relay URL:

```bash
python3 scripts/dev-relay.py 8787 0.0.0.0
```

## Where Things Live

- `src/App.jsx` sets up the hash-routed setup, game, and results pages.
- `src/engine/` contains the pure, serializable game rules. Start with
  `technical_reqs.md` before changing engine behavior.
- `data/*.csv` are source data; `src/data/` contains app-consumable modules.
- `src/tests/` covers reducer mechanics, exports, and replay fixtures.
- `product_reqs.md` is the compact rules reference for product behavior.
