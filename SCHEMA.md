# Content Schema

Source of truth is the Obsidian vault in `vault/`. Build sync copies to `src/content/` (generated; ignored by git).

## Collections

- **probes** → `vault/probes/` → `/probes/<slug>`
  - `title?` `description?` `date?` `lastmod?` `tags?[]` `aliases?[]`
- **attractors** → `vault/attractors/` → `/attractors/<slug>`
  - `title?` `description?` `date?` `lastmod?` `kind` (`project|essay`) `tags?[]` `coverImage?` `aliases?[]`
- **traces** → `vault/traces/` → `/traces/<slug>`
  - `title?` `description?` `date?` `lastmod?` `tags?[]` `aliases?[]`
- **logs** → `vault/logs/<parent>/` → `/logs/<parent>/<slug>`
  - `date` (required) `parent` (inferred) `day?` `title?`
- **pages** → `vault/pages/` → `/`, `/about`, `/now`, `/shelf`, `/terrain`
  - `title?` `description?` `aliases?[]` `heroTitle?` `heroAccent?` `brandSubtitle?`

## Sync Rules

- `scripts/sync-content.mjs`: copy + slugify filenames; fill missing `title`; infer log `parent`.
- `scripts/sync-assets.mjs`: `vault/assets/` → `public/assets/`.

## Wikilinks + Backlinks

- Resolve by slug, then `aliases`, then collection path (e.g. `[[traces/foo]]`).
- Folder paths supported; backlinks include probes/attractors/traces/logs/pages.
