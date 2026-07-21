# Content Schema

Source of truth is the Obsidian vault in `vault/`. Build sync copies public content to
`src/content/` (generated; ignored by git).

## Collections

- **terrain** → root-level `vault/*.md` → `/terrain/<slug>`
  - `slug?` `title?` `description?` `date?` `lastmod?` `tags?[]` `coverImage?`
    `aliases?[]` `comic?` (`assetDir`, `pageCount`, `width`, `height`)
  - Every root-level Markdown file is public. A Terrain slug must be one flat path segment.
  - Tags are optional and may represent either format or topic. Current format views use
    `projects`, `essays`, `questions`, and `hunches`; entries may have multiple tags or none.
- **logs** → `vault/logs/<project>/` → `/terrain/<project>/logs/<slug>`
  - `date` (required) `lastmod?` `parent` (required or inferred from folder) `day?` `title?`
    `aliases?[]`
- **shelf** → `vault/shelf/` → `/shelf/<slug>`
  - `title?` `description?` `date?` `lastmod?` `rating` (`0`–`5`) `coverImage?`
    `aliases?[]`
- **pages** → `vault/pages/` → `/`, `/about`, `/now`, `/contact`, `/terrain`
  - `title?` `description?` `lastmod?` `aliases?[]` `heroTitle?` `heroAccent?`
    `brandSubtitle?`

Folders such as `scratch/`, `writing inbox/`, `_voice_inbox/`, `logs/`, `shelf/`, and `pages/`
are not part of the root Terrain collection.

## Sync Rules

- Terrain files keep three independent pieces of identity:
  - vault filename: local Obsidian/workspace ergonomics
  - `slug`: stable public URL identity
  - `title`: living display name
- Change `title` freely without changing the public URL. Once published, avoid changing `slug`
  unless you also retain a redirect.
- Fresh root-level files may omit both `slug` and `title`. `.githooks/pre-commit` and
  `.githooks/pre-merge-commit` run `scripts/normalize-content.mjs`, which fills and stages them
  before a commit.
- `slug` is source-only frontmatter for Terrain. Sync consumes it to choose the generated content
  filename, then omits it from generated Astro content.
- `scripts/sync-content.mjs` syncs only direct root Markdown into Terrain, recursively syncs the
  three structured collections, validates that each required log parent matches its project
  folder, and removes retired generated `projects`, `questions`, and `hunches` directories.
- `scripts/sync-assets.mjs` copies `vault/assets/` to `public/assets/`. Numeric PNG sequences in an
  asset subfolder also receive optimized copies under `web/`.

## URLs and Compatibility

- `/terrain/<slug>` is the canonical Terrain URL.
- `/terrain/<tag>/<slug>` is a generated redirect for every tag currently attached to an entry.
- Existing `/projects/<slug>`, `/questions/<slug>`, `/hunches/<slug>`, `/notes/<slug>`,
  `/guesses/<slug>`, and `/traces/<slug>` paths redirect to the canonical Terrain URL.
- Existing `/projects/<project>/logs/<slug>` paths redirect to the canonical Terrain log URL.
- Shelf URLs remain unchanged.

## Wikilinks and Backlinks

- Wikilinks resolve by Terrain slug, title-derived slug, alias, current collection path, or a
  retired prefix. For example, `[[foo]]`, `[[questions/foo]]`, and `[[notes/foo]]` can all resolve
  to `/terrain/foo`.
- Tag-qualified targets such as `[[essays/foo]]` resolve when that tag is attached to the entry.
- Logs, Shelf entries, and special pages participate in lookup and backlinks while preserving
  their own canonical URLs.
