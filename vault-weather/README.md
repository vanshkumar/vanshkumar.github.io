# Vault Weather

Vault Weather is a personal Obsidian plugin for browsing local vault writing, poems, and shelf items by
recent activity:

- **Writing Weather** reads Markdown files directly at the vault root, including draft Posts. Its All, Posts, and
  Notes views mirror the public site's writing model while Terrain remains the internal collection
  name.
- **Poems Weather** reads Markdown files directly in `poems/` and opens them in Obsidian.
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

Clicking a card focuses an existing Obsidian tab for that file, including background tabs restored
with the workspace. If the file is not open, Weather opens it in a new tab.

Card activity comes only from each note's `lastmod` or `lastMod` frontmatter. Updates from the last 30
days receive a quadratic recency discount, and visual levels are assigned relative to other notes
within the active Writing view, Poems surface, or Shelf surface.

Posts (`type: post`) with the boolean property `draft: true` stay visible in Weather with
a dashed card border and a **Draft** label. Activity colors keep their existing meaning. Set
`draft: false` or remove the property to publish on the site's next deployment; Weather picks up
the property change automatically. Draft support currently applies only to Posts, and new entries
keep the existing published-by-default behavior.

Vault Weather listens for Obsidian metadata and vault file events, refreshes whenever its view
becomes active, and recalculates activity at each UTC date boundary. The plus button creates a note
with minimal `date` and `lastmod` frontmatter. Writing entries use `type: post` or `type: note`;
there are no subtype tags. Creating from Posts or Notes automatically uses that type. The All view
asks only whether to create a Post or Note. Shelf notes additionally require an
integer `rating` from 0 to 5. Poems are created in `poems/` with no required type or rating.
New notes intentionally omit `slug` and `title`.

The selected surface and Writing filter are stored in the Obsidian workspace layout and
restored with the view. Saved legacy Untagged and tag filters migrate to the closest current view.

The plugin source is tracked here. Installed artifacts under the vault's `.obsidian` directory and
the local `dist/` directory are ignored by the parent repository.

## Words touched

Above the cards, Weather shows today's words touched, an added/edited/removed breakdown, and
the homepage's green year calendar. It reuses the site's counting and public-path allowlist
(including draft writing), so private folders are excluded. Git must be available on desktop.

Committed history is cached until HEAD or the local date changes. Saved tracked changes (staged
and unstaged) are compared with HEAD, and untracked Markdown is included as additions. The view
updates on vault events, activation, and once a minute. No commits or files are written by the tracker.

All outstanding saved changes are attributed to today; edits carried overnight can move to the
next day until committed. Repeated rewrites between commits count only their resulting diff,
not every intermediate edit. This is an approximate writing signal, not a keystroke/session log.
The homepage retains its existing committed-only behavior and date convention.
