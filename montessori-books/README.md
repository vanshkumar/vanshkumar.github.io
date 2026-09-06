# Small beginnings

Ten local Montessori design prototypes, with shared, source-checked guidance for
6–9 months and 18–24 months. Other age bands are explicitly unfinished previews.

## Run

```sh
pnpm install
pnpm dev
```

Open the URL printed by Vite, normally
`http://127.0.0.1:5173/montessori-books/`.

```sh
pnpm build
pnpm preview
```

The comparison index links to all ten concepts. The direction picker preserves
the selected age. Hash links work without a server-side SPA fallback, for example
`/montessori-books/#/windows?age=18-24`.

## Edit

- `src/content.js`: six original guidance records, readiness cues, practical
  steps, and verified references. Baby references use physical PDF pages;
  Toddler references include verified printed pages and physical PDF pages.
- `src/concepts.js`: the ten random seeds, interpretations, and palette notes.
- `src/main.jsx` and `src/styles.css`: shared controls and ten distinct layouts.
- `public/art/`: four original generated illustrations, optimized to WebP.
  `ARTWORK.md` records the generation briefs. Images are conceptual; repeated
  crops in the comic study are a prototype treatment, not distinct instructional frames.

The PDFs are local research inputs. They are ignored by Git and never copied to
the public directory or built output. The prose is paraphrased; no book artwork
is reproduced. All pages carry `noindex, nofollow` during this comparison phase.

## Later deployment

This is a standalone sibling app. The root Astro build does not include it.
When a direction is selected, add a pnpm install/build step to the parent Pages
workflow, copy this app's `dist/` into `site/montessori-books/`, and verify its
`index.html` alongside the existing sibling apps. Add the root site's documented
analytics snippet at that point. No parent workflow changes or publication are
included in this prototype.

Validation is intentionally limited to a production build and a brief browser
smoke check. No automated test suite was added.
