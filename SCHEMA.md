# Content Schema

Source of truth is the Obsidian vault in `vault/`. Build sync copies public content to
`src/content/` (generated; ignored by git).

## Collections

- **terrain** → root-level `vault/*.md` → canonical `/posts/<slug>` or `/notes/<slug>`
  - `type` (`post` or `note`) `slug?` `title?` `description?` `date?` `lastmod?` `tags?[]` `draft?` `coverImage?`
    `aliases?[]` `comic?` (`assetDir`, `pageCount`, `width`, `height`)
  - Root-level Markdown is public by default. Posts (`type: post`) may set
    `draft: true` to stay out of the generated site, including detail/redirect routes, archives,
    RSS, wiki lookup, and backlinks. Remove `draft` or set `draft: false` to publish on the next
    deployment. Use a YAML boolean, not a quoted string; `draft: true` on a Note fails sync
    because this first version supports Posts only. A Terrain slug must be one flat path segment.
  - Every entry must declare `type: post` or `type: note`. Optional `tags` are topic metadata
    only; the former `projects`, `posts`, `hunches`, and `questions` classification tags are retired.
    Change `type` to move an entry between Posts and Notes without changing its slug.
- **logs** → `vault/logs/<project>/` → `/posts/<project>/logs/<slug>`
  - `date` (required) `lastmod?` `parent` (required or inferred from folder) `day?` `title?`
    `aliases?[]`
  - A log parent must resolve to a Terrain entry classified as a Post. Logs belonging to draft
    Posts are also excluded until the parent is published.
- **shelf** → `vault/shelf/` → `/shelf/<slug>`
  - Common fields: `status` (`reading` or `recommended`), `author`, `title?`, `description?`,
    `date?`, `lastmod?`, `coverImage?`, `aliases?[]`
  - Ratings are intentionally unsupported. `status: recommended` adds a book to the curated
    recommendation grid; a non-empty Markdown body independently adds its `notes` link and
    detail route. Changing `status` never changes the Markdown file or its potential URL.
- **poems** → `vault/poems/` → `/poems/<slug>`
  - `title?` `description?` `date?` `lastmod?` `aliases?[]`
  - Poems are listed newest-first on `/poems`. Ordinary single newlines inside poem paragraphs
    remain visible as line breaks, while blank lines separate stanzas.
- **reading-log** → `vault/reading-log/` → inline on `/shelf#reading-log`, aggregated at `/shelf/stats`
  - `title`, nonempty `authors[]`, `finished?`, `status?`, `isbn?`, `amazonAsin?`,
    `contributors?`, `dateAdded?`, `owned?`, `shelfSlug?`, `pageCount?`, `bookType?`,
    `genres?[]`, `moods?[]`, `pace?`, `publicationYear?`, `metadataSources?[]`
  - ISBN and positive integer `pageCount` describe a reference edition, not
    necessarily the edition read. `publicationYear` is the original publication
    year (1–9999), not an edition date. `bookType` is `fiction` or `nonfiction`;
    `pace` is `slow`, `medium`, or `fast`.
  - Each metadata source has `url`, exact calendar date `retrieved`, and optional
    `fields[]` naming the metadata it supports. Labels are locally owned after import.
  - `title` and `authors` remain required even when mobile capture collects less
    information: enrichment must complete required fields before insertion.
    Astro and the capture helper share `src/lib/reading-record.mjs`; new captures
    additionally require an exact completion date, metadata sources, and provenance.
  - One Markdown file per book, with one `finished` date. Calendar dates are strings
    in `YYYY-MM-DD`, `YYYY-MM`, or `YYYY` format. `finished: null` retains a completed
    book with an unknown date; omitted `finished` means no completion.
  - Optional `status` is `read`, `currently-reading`, `to-read`, or `did-not-finish`.
    The completed log derives from `finished`, independently of the current status;
    to-read and abandoned books without a completion are retained but omitted.
  - These records have no detail routes or wiki index entries. `shelfSlug` can
    connect a separate `(my notes)` link to an existing Shelf notes route without
    adding a recommendation. Titles link to Amazon using `amazonAsin` or a
    title/author search fallback. Keep `isbn` and `amazonAsin` quoted.
- **pages** → `vault/pages/` → static pages, archive copy, and shared site copy
  - Common fields: `title?` `description?` `date?` `lastmod?` `aliases?[]`
    `heroTitle?` `heroAccent?`
  - `home.md` owns the live homepage prose, its `home` display settings, and Word
    Garden labels through `wordGarden`. Keep exactly one `<!-- home-comic -->`
    marker where the comic belongs. Lowercase blog, notes, and poems navigation lives in the
    Markdown directory. `home.selected.title` and `home.selected.slugs` control the selected
    posts heading and ordered list; every selected slug must resolve to a Post. Draft selections
    are omitted during sync without changing the authored list, and return when published.
  - `about.md` and `now.md` own their respective page prose.
  - `posts.md`, `notes.md`, `poems.md`, and `shelf.md` own archive titles and optional archive
    introductions. Shelf section headings and surrounding prose live directly in the
    `shelf.md` Markdown body around `<!-- shelf-currently-reading -->` and
    `<!-- shelf-recommendations -->`, and `<!-- shelf-reading-log -->`; its `shelf` frontmatter is limited to generated-copy
    templates that depend on book data.
  - `reading-stats.md` owns stats labels through `readingStats`. The page keeps
    data and controls without introductory or methodology prose. The Shelf route
    slug `stats` is reserved for this page.
  - `terrain.md` owns the legacy archive hero and Posts/Notes section labels through `terrain`.
  - `site.md` owns shared visitor-facing copy through `site`, including the site
    name, description, footer, content and writing labels, comic-reader controls,
    redirect messages, RSS metadata, and `subscription` embed URL/title. The Substack signup
    iframe appears below the homepage Word Garden and at the bottom of Post detail pages.
  - Structured page-copy fields are validated in `src/content.config.ts`; text
    templates use named placeholders such as `{title}`, `{author}`, or `{date}`.

Folders such as `scratch/`, `writing inbox/`, `_voice_inbox/`, `logs/`, `poems/`, `shelf/`, `reading-log/`, and `pages/`
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
  structured collections, validates that each required log parent matches its project
  folder, and removes retired generated `projects`, `questions`, and `hunches` directories.
- `scripts/sync-assets.mjs` copies `vault/assets/` to `public/assets/`. Numeric PNG sequences in an
  asset subfolder also receive optimized copies under `web/`.
- Drafts remain editable in Obsidian/Weather. Website exclusion does not hide committed source
  files or assets in `vault/assets/`. The Word Garden still counts aggregate writing activity;
  it does not publish entry titles or text.

## URLs and Compatibility

- `/posts` (Blog) and `/notes` (Notes) are the public archives. Posts are sorted by `date` (falling back to
  `lastmod`); Notes are sorted by `lastmod` (falling back to `date`), with slug tie-breakers.
- `/poems` is the poetry archive; `/poems/<slug>` renders each poem.
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
- Tag-qualified targets such as `[[posts/foo]]` resolve to the entry; `projects`, `hunches`, `questions`, and `essays` remain legacy
  wikilink prefixes. Retired `/terrain/<tag>/<slug>` routes redirect to the canonical writing URL.
- Poems, logs, Shelf entries, and special pages participate in lookup and backlinks while preserving
  their own canonical URLs.
