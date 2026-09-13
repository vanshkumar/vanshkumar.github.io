# Small beginnings

A visual Montessori companion from birth through age three, based on
*The Montessori Baby* and *The Montessori Toddler*. Each age opens with three
starting invitations, followed by five everyday topics and focused readers.
The refresh icon replaces all three choices with age-matched activities, working
through the available invitations before repeating. The current trio travels in
the URL through readers and topics; seen activities are remembered per age for
the current browser session.
The complete content has 174 reusable entries with age-specific presentations.
Suggestions, readiness and family circumstances take precedence over deadlines
or completion tracking.

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

Hash links work without a server-side SPA fallback, for example
`/montessori-books/#/home?age=12-18` or
`/montessori-books/#/home?age=24-36&entry=later-window-cleaning`.
The ten earlier visual studies remain available in development; their data and
application code are excluded from production.

## Edit

- `src/guide/approved.json`: generated public content with reviewed source material. Do not edit it
  directly: exact content, independent decisions and integration receipts live
  under `content/`. References identify physical PDF pages; verified Toddler
  printed-page references are retained where available.
- `content/editorial/starting-ideas.json`: the 21 distinct starting selections.
  `node content/editorial/curate-openings.mjs full-rNN content/editorial/starting-ideas.json`
  records a new immutable curation release. It only selects existing age
  placements and adds missing navigation labels; every rendered reader body must
  remain identical. Its receipt distinguishes local curation from the historical
  independent source and artwork reviews.
- `src/guide/store.js` and `routes.js`: shared age/topic selectors and hash routes.
- `content/editorial/navigation-labels.json`: short labels for every entry.
  `node content/editorial/label-navigation.mjs full-rNN` records label changes and
  the refresh presentation in an immutable release, checks reader bodies against
  the previous release and verifies complete refresh cycles for every age.
- `src/guide/ideas.js`: invitation selection, validation of trios from links,
  and session history. Refresh excludes every currently visible choice, even
  when starting another cycle after the pool is exhausted.
- `src/HomeStudy.jsx` and `src/home.css`: the refined second direction, with a
  compact age selector, an open illustration for each populated age, and three
  idea choices above a focused reading panel with an observation cue.
- `public/art/`: original artwork, including historical prototypes. The build
  emits only the eight images referenced by the reviewed release. New generation
  records are in `research/art-direction/GENERATIONS-2026-09-12.json`.
- `content/APPROVED_RELEASE.json`: the full release's content, receipt, image and
  presentation fingerprints. The build rejects changes outside that recorded
  integration. Earlier releases and their review evidence stay intact.
- `research/`: the source crosswalks and editorial foundation; the consolidated
  allocation is in `content/editorial/coverage/RESOLVED_COVERAGE.jsonl`.

The PDFs are local research inputs. They are ignored by Git and never copied to
the public directory or built output. The prose is paraphrased; no book artwork
is reproduced. The published companion is indexable and declares its canonical URL.

## Deployment

Live URL: https://vanshkumar.net/montessori-books/.

The parent GitHub Pages workflow installs from this app’s frozen pnpm lockfile,
builds it separately, and copies only `dist/` to `site/montessori-books/`.
Hash navigation needs no extra server routing. The HTML includes the parent site’s
Google Analytics tag and canonical URL. The release fingerprint records these
publishing metadata changes; all reviewed content, artwork and visible layouts
remain unchanged.

Validation is intentionally limited to a production build and a brief browser
smoke check. No automated test suite was added.
