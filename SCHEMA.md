# Content Schema

Source of truth is the Obsidian vault in `vault/`. Build sync copies to `src/content/` (generated; ignored by git).

## Collections

- **projects** → `vault/projects/` → `/projects/<slug>`
  - `slug` `title` `description?` `date?` `lastmod?` `kind` (`project|essay`) `tags?[]` `coverImage?` `aliases?[]`
- **questions** → `vault/questions/` → `/questions/<slug>`
  - `slug` `title` `description?` `date?` `lastmod?` `tags?[]` `aliases?[]`
- **notes** → `vault/notes/` → `/notes/<slug>`
  - `slug` `title` `description?` `date?` `lastmod?` `tags?[]` `aliases?[]`
- **shelf** → `vault/shelf/` → `/shelf/<slug>`
  - `title?` `description?` `date?` `lastmod?` `rating` (`0`-`5`) `coverImage?` `aliases?[]`
- **logs** → `vault/logs/<project>/` → `/projects/<project>/logs/<slug>`
  - `date` (required) `lastmod?` `parent` (inferred) `day?` `title?`
- **pages** → `vault/pages/` → `/`, `/about`, `/now`, `/contact`, `/terrain`
  - `title?` `description?` `aliases?[]` `heroTitle?` `heroAccent?` `brandSubtitle?`

## Sync Rules

- For published projects/questions/notes, keep all three names with separate jobs:
  - vault filename: local Obsidian/workspace ergonomics
  - `slug`: stable public URL identity
  - `title`: living display name
- Change `title` freely without changing the public URL. Once published, avoid changing `slug` unless you also add a redirect.
- `slug` is source-only frontmatter for projects/questions/notes. Sync consumes it to choose the generated content path, then omits it from generated Astro content.
- `.githooks/pre-commit` and `.githooks/pre-merge-commit` run `scripts/normalize-content.mjs` locally before commits/merge commits, filling missing `slug` and `title` and staging those additions.
- `scripts/sync-content.mjs`: copy + slugify filenames or `slug`; fill missing `title`; infer log `parent`; omit source-only `slug` from generated content.
- `scripts/sync-assets.mjs`: `vault/assets/` → `public/assets/`.

## Wikilinks + Backlinks

- Resolve by slug, then `aliases`, then collection path (e.g. `[[notes/foo]]`).
- Folder paths supported; backlinks include projects/questions/notes/logs/pages.
