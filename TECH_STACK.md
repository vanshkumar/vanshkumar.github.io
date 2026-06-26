# Tech Stack (Minimal)

- Astro 5 static site at the repo root.
- Markdown content collections synced from `vault/`.
- Obsidian-style wikilinks, aliases, callouts, and backlinks.
- Vanilla CSS for the main site.
- RSS feed via `@astrojs/rss`.
- Asset sync from `vault/assets/` to `public/assets/`, with comic-page
  optimization via `sharp` or macOS `sips`.
- React 18 + Vite sibling apps:
  - `coffee-rush/` - hot-seat board game app with a pure reducer engine.
  - `terminal-desires-ranker/` - static pairwise ranking app.
  - `vault-weather/` - local-only vault question browser/generator.
- Vitest and ESLint inside the Vite apps.
- GitHub Actions deploys the root Astro build plus deployed sibling app builds
  to GitHub Pages.
