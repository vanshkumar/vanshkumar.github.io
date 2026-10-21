# vanshkumar.github.io

Personal static site plus a few small static apps. This repo is easiest to work
on if you treat the main site and each app as separate projects that share one
GitHub Pages deployment.

## Repo Map

- `src/` - Astro site routes, layouts, shared styles, and markdown helpers.
- `vault/` - source of truth for public markdown content, poems, and vault assets.
- `scripts/` - content and asset sync scripts for the Astro site.
- `public/` - committed static files. `public/assets/` is generated from
  `vault/assets/` and ignored by git.
- `coffee-rush/` - React/Vite hot-seat game deployed at `/coffee-rush/`.
- `terminal-desires-ranker/` - React/Vite client-only ranker deployed at
  `/terminal-desires-ranker/`.
- `montessori-books/` - reviewed React/Vite Montessori companion at `/montessori-books/`.
- `vault-weather/` - local-only React/Vite surface over the internal Terrain corpus
  and the separate `vault/shelf/` collection; it is not part of the Pages deploy.
- `SCHEMA.md` - content collections and vault sync rules.
- `TECH_STACK.md` - concise technology inventory.

## Main Site Commands

```bash
npm install
npm run dev
npm run build
npm run normalize-content
```

`npm run dev` and `npm run build` both sync `vault/` into generated Astro
content first. Edit markdown in `vault/`, not `src/content/`.

## Editing Notes

- Edit visitor-facing text for the main site in `vault/`, not in Astro files.
  Page prose and page-specific labels live in `vault/pages/`; global text such
  as the site name, footer links, metadata, writing controls, redirects, and RSS
  labels lives in `vault/pages/site.md`. `vault/pages/home.md` controls the live
  homepage copy around its required `<!-- home-comic -->` and
  `<!-- home-writing-nav -->` placement markers.
- Main site layouts and rendering logic live in `src/pages/` and `src/layouts/`;
  most visual styling is in `src/styles/global.css`. The isolated, noindex
  `src/pages/homepage-variants/` prototypes are design studies and intentionally
  keep their sample copy alongside their standalone markup.
- Root-level Markdown files in `vault/` form the internal Terrain collection.
  Their `projects`/`posts` or `hunches`/`questions` tags classify them into the
  public Blog (`/posts`) and Notes (`/notes`) routes; `slug` frontmatter remains their stable URL
  identity. See `SCHEMA.md` before changing published slugs or classifications.
- Poems live in `vault/poems/` and publish independently at `/poems/<slug>`;
  ordinary source line breaks remain visible in rendered poem paragraphs.
- The sibling Vite apps have their own `package.json`, tests, builds, and
  READMEs. Work from inside the relevant app folder.
- Analytics uses Google tag `G-3HGGFGZK6Y`. The root Astro site loads it from
  `src/layouts/BaseLayout.astro`; deployed sibling Vite apps should include the
  same snippet in their `index.html` and any GitHub Pages SPA fallback
  `public/404.html`.
- GitHub Actions builds the Astro site, then builds `terminal-desires-ranker/`,
  `coffee-rush/`, and `montessori-books/`, then assembles the final Pages artifact.

Math uses `$...$` inline and `$$...$$` on separate lines for display equations, rendered at build time with KaTeX. Escape literal currency signs as `\$` so prices remain prose.

## Reading Log

`vault/reading-log/` is the source of truth for reading history. Each book is a
Markdown file with its authors and one completion date in frontmatter. The Shelf
renders completed books newest-first in one continuous list below the recommendation
grid, with the year included in each row's date.
The footer counts the displayed completions and shows the latest Git commit date for
`vault/reading-log/`, so unrelated builds do not change its updated date.
To log a new book, add a file such as `vault/reading-log/example-book.md`:

```yaml
---
title: Example Book
authors:
  - Example Author
finished: '2026-10-21'
---
```

Dates can be `'YYYY-MM-DD'`, `'YYYY-MM'`, or `'YYYY'`; use `finished: null`
for a completed book whose date is unknown. Keep dates quoted. Omit `finished`
for a book that has not been completed. Current `status` does not determine
whether a book appears in the completed log.

The StoryGraph migration retained all 141 book records, including to-read and
did-not-finish books. The untouched export is archived in
`imports/storygraph/2026-10-21.csv`; future edits belong in the Markdown records,
not that snapshot. Completions recorded without dates appear last with “Date unknown”;
review corrections belong in the local records. The separate
`imports/storygraph/2026-10-21-metadata.json` snapshot records the one-time metadata
backfill for the 124 completed books, its matching evidence, source URLs, and
unresolved source gaps. Archives preserve the original evidence, including fields
that the active model no longer uses.

Curated recommendations and their notes remain in `vault/shelf/`. Reading-log
titles link to Amazon using an explicit `amazonAsin`, or a title/author search
when no product identifier is supplied. Existing product destinations were
preserved as ASINs when edition-format tracking was removed. Keep `isbn` and
`amazonAsin` quoted so leading zeros survive YAML parsing. An optional `shelfSlug`
adds a separate `(my notes)` link after the author when that Shelf entry has notes.
Section headings and placement live in `vault/pages/shelf.md`. Run the normal
site build to publish updated records; no StoryGraph connection is needed.

### Stats

`/shelf/stats` derives completion-based statistics from the same local records:
year/month/all-time views, clickable book breakdowns, and two-year comparisons
(full year or matching year-to-date). No runtime StoryGraph connection is used.
Copy lives in `vault/pages/reading-stats.md`; shared calculations and rendering
live in `src/lib/reading-stats*.mjs`.

Keep `title` and a nonempty `authors` list required. A future phone capture flow
may accept only a book and completion date, but enrichment must supply the
canonical required fields **before** adding the record. That capture workflow is
not implemented here. Statistical metadata can be filled once and edited locally.

The supported statistical metadata is `pageCount`, `publicationYear`, `genres`,
`moods`, `pace`, and `bookType`. Cite the fields supplied by each source in
`metadataSources` with a URL and retrieval date. ISBN and page count describe a
reference edition, which may be a placeholder. Page stats are therefore labeled
**Estimated pages**; `publicationYear` is the original publication year.

Missing labels stay unknown. Omit unknown metadata instead of inventing it.
Genres and moods can overlap. Year-only completion dates count annually,
month-only dates also count monthly, and undated completions appear only in
all-time views. YTD comparisons exclude partial dates whose possible end falls
after the cutoff.

The archived metadata importer is intentionally separate from builds:

```sh
node scripts/import-storygraph-metadata.mjs imports/storygraph/2026-10-21-metadata.json
# Add --apply only to fill still-missing fields from this audited snapshot.
```

It checks every local title, author list, and ISBN before writing anything, never
creates records or changes completion dates, and never overwrites populated metadata.
The subsequent reference-edition corrections intentionally fail its identity check;
do not rerun the original import against the enriched records.
It skips retired archive fields rather than restoring them. It is not a synchronization
mechanism. After local edits, use `npm test` and `npm run build`; the build also
verifies stats and log event identities agree.
