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

## Where Things Live

- `src/App.jsx` sets up the hash-routed setup, game, and results pages.
- `src/engine/` contains the pure, serializable game rules. Start with
  `technical_reqs.md` before changing engine behavior.
- `data/*.csv` are source data; `src/data/` contains app-consumable modules.
- `src/tests/` covers reducer mechanics, exports, and replay fixtures.
- `product_reqs.md` is the compact rules reference for product behavior.
