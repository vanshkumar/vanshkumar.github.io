# Terminal Desires Ranker

Client-only React/Vite app for comparing terminal desires and viewing a ranked
result list. It is deployed as a sibling app at `/terminal-desires-ranker/`.

## Commands

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

## Where Things Live

- `src/App.jsx` sets up the hash-routed list, compare, and results pages.
- `src/data/seedDesires.js` contains the default desire set.
- `src/pages/` contains the three page-level views and their CSS.
- The current comparison flow shuffles all unique pairs, records wins as
  scores, and sorts results from highest score to lowest.
- `product_reqs.md` and `technical_reqs.md` are historical implementation
  references; check the current code before assuming they are exact.
