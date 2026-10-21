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
Markdown file with its authors and completed reads in frontmatter. The Shelf
renders these reads newest-first in one continuous list below the recommendation
grid, with the year included in each row's date.
To log a new book, add a file such as `vault/reading-log/example-book.md`:

```yaml
---
title: Example Book
authors:
  - Example Author
reads:
  - finished: '2026-10-21'
---
```

For a reread, append another item to the same book's `reads` list. Optionally add
`started` to that item. Dates can be `'YYYY-MM-DD'`, `'YYYY-MM'`, or `'YYYY'`;
use `finished: null` for a completed read whose date is unknown. Keep partial
dates quoted. A book with `reads: []` is not shown in the completed reading log.

The StoryGraph migration retained all 141 book records, including to-read and
did-not-finish books. The untouched export is archived in
`imports/storygraph/2026-10-21.csv`; future edits belong in the Markdown records,
not that snapshot. Reads recorded without dates appear last with “Date unknown”;
review corrections belong in the local records. Author, edition, format, and available start/finish data are
preserved for future statistics. This export contains no page counts, genres,
ratings, or moods; those would need to be added before building those views.

Curated recommendations and their notes remain in `vault/shelf/`. Reading-log
titles link to Amazon using a print ISBN, or a title/author search when a product
identifier is unavailable. Optional `amazonAsin` supplies a specific product link
for any edition. An optional `shelfSlug` adds a separate `(my notes)` link after
the author when that Shelf entry has notes.
Section headings and placement live in `vault/pages/shelf.md`. Run the normal
site build to publish updated records; no StoryGraph connection is needed.
