# Vault Weather

Vault Weather is a personal Obsidian plugin for browsing three local vault surfaces by recent
activity:

- **Question Weather** reads `questions`.
- **Hunch Weather** reads `hunches`.
- **Shelf Weather** reads `shelf` and displays valid vault-relative `coverImage` assets such as
  `/assets/shelf/book.webp`.

The plugin runs entirely inside Obsidian. It does not require a browser, Vite server, generated
JSON, or a background terminal process.

## Install in the local vault

From this directory:

```bash
mise x -- npm install
mise x -- npm run install:plugin
```

The install command builds `main.js`, `manifest.json`, and `styles.css`, then copies them to
`../vault/.obsidian/plugins/vault-weather/`. In Obsidian, open **Settings → Community plugins**,
enable **Vault Weather**, and run **Open Vault Weather** from the command palette or ribbon.

After subsequent code changes, rerun `mise x -- npm run install:plugin` and reload the plugin in
Obsidian.

## Development commands

- `mise x -- npm run dev` watches plugin sources and rebuilds `dist/main.js`.
- `mise x -- npm run test` runs the activity, data-service, creation, and refresh tests.
- `mise x -- npm run lint` runs ESLint and TypeScript checking.
- `mise x -- npm run build` creates the three production plugin artifacts in `dist/`.

## Behavior

Activity comes only from each note's `lastmod` or `lastMod` frontmatter. Updates from the last 30
days receive a quadratic recency discount, and visual levels are assigned relative to other notes
within the current surface.

Vault Weather listens for Obsidian metadata and vault file events, refreshes whenever its view
becomes active, and recalculates activity at each UTC date boundary. The plus button creates a note
with minimal `date` and `lastmod` frontmatter; shelf notes additionally require an integer `rating`
from 0 to 5. New notes intentionally omit `slug` and `title`.

The plugin source is tracked here. Installed artifacts under the vault's `.obsidian` directory and
the local `dist/` directory are ignored by the parent repository.
