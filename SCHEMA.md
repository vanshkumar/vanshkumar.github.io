# Content Schema

Source of truth is the Obsidian vault in `vault/`. Build sync copies to `src/content/` (generated; ignored by git).

## Collections

- **projects** → `vault/projects/` → `/projects/<slug>`
  - `title?` `description?` `date?` `lastmod?` `kind` (`project|essay`) `tags?[]` `coverImage?` `aliases?[]`
- **questions** → `vault/questions/` → `/questions/<slug>`
  - `title?` `description?` `date?` `lastmod?` `tags?[]` `aliases?[]`
- **notes** → `vault/notes/` → `/notes/<slug>`
  - `title?` `description?` `date?` `lastmod?` `tags?[]` `aliases?[]`
- **logs** → `vault/logs/<project>/` → `/projects/<project>/logs/<slug>`
  - `date` (required) `lastmod?` `parent` (inferred) `day?` `title?`
- **pages** → `vault/pages/` → `/`, `/about`, `/now`, `/contact`, `/shelf`, `/terrain`
  - `title?` `description?` `aliases?[]` `heroTitle?` `heroAccent?` `brandSubtitle?`

## Sync Rules

- `scripts/sync-content.mjs`: copy + slugify filenames; fill missing `title`; infer log `parent`.
- `scripts/sync-assets.mjs`: `vault/assets/` → `public/assets/`.

## Wikilinks + Backlinks

- Resolve by slug, then `aliases`, then collection path (e.g. `[[notes/foo]]`).
- Folder paths supported; backlinks include projects/questions/notes/logs/pages.
