# Content Schema

Source of truth is the Obsidian vault in `vault/`. Build sync copies public content to
`src/content/` (generated; ignored by git).

## Collections

- **terrain** → root-level `vault/*.md` → canonical `/posts/<slug>` or `/notes/<slug>`
  - `slug?` `title?` `description?` `date?` `lastmod?` `tags?[]` `coverImage?`
    `aliases?[]` `comic?` (`assetDir`, `pageCount`, `width`, `height`)
  - Every root-level Markdown file is public. A Terrain slug must be one flat path segment.
  - Every entry must have at least one Post tag (`projects` or `essays`) or one Note tag
    (`hunches` or `questions`), and may not combine tags from both groups. Multiple tags within
    one group and unrelated topic tags remain valid. The Astro build fails on an invalid split.
- **logs** → `vault/logs/<project>/` → `/posts/<project>/logs/<slug>`
  - `date` (required) `lastmod?` `parent` (required or inferred from folder) `day?` `title?`
    `aliases?[]`
  - A log parent must resolve to a Terrain entry classified as a Post.
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

- `/posts` and `/notes` are the public archives. Posts are sorted by `date` (falling back to
  `lastmod`); Notes are sorted by `lastmod` (falling back to `date`), with slug tie-breakers.
- `/posts/<slug>` and `/notes/<slug>` are both generated for every Terrain entry. The namespace
  matching its current classification renders the entry; the other redirects to it, preserving
  URLs when an entry later changes category.
- `/terrain` remains an unlinked, `noindex` legacy archive. `/terrain/<slug>` and
  `/terrain/<tag>/<slug>` redirect to the entry's current canonical Posts/Notes URL.
- Existing `/projects/<slug>`, `/questions/<slug>`, `/hunches/<slug>`, `/notes/<slug>`,
  `/guesses/<slug>`, and `/traces/<slug>` paths redirect or render at the current canonical URL.
- Existing `/projects/<project>/logs/<slug>` and `/terrain/<project>/logs/<slug>` paths redirect
  to the canonical Posts log URL.
- Shelf URLs remain unchanged.

## Wikilinks and Backlinks

- Wikilinks resolve by Terrain slug, title-derived slug, alias, current collection path, or a
  compatibility prefix. For example, `[[foo]]`, `[[posts/foo]]`, `[[questions/foo]]`, and
  `[[notes/foo]]` all resolve directly to the entry's canonical Posts/Notes URL.
- Tag-qualified targets such as `[[essays/foo]]` resolve when that tag is attached to the entry.
- Logs, Shelf entries, and special pages participate in lookup and backlinks while preserving
  their own canonical URLs.
