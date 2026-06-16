# vanshkumar.github.io

Personal static site plus a few small static apps. This repo is easiest to work
on if you treat the main site and each app as separate projects that share one
GitHub Pages deployment.

## Repo Map

- `src/` - Astro site routes, layouts, shared styles, and markdown helpers.
- `vault/` - source of truth for public markdown content and vault assets.
- `scripts/` - content and asset sync scripts for the Astro site.
- `public/` - committed static files. `public/assets/` is generated from
  `vault/assets/` and ignored by git.
- `coffee-rush/` - React/Vite hot-seat game deployed at `/coffee-rush/`.
- `terminal-desires-ranker/` - React/Vite client-only ranker deployed at
  `/terminal-desires-ranker/`.
- `question-weather/` - local-only React/Vite surface over `vault/questions/`;
  it is not part of the Pages deploy.
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

- Main site pages live in `src/pages/`; shared page chrome is in
  `src/layouts/`; most visual styling is in `src/styles/global.css`.
- Content URLs are usually controlled by `slug` frontmatter in `vault/` for
  projects, questions, and notes. See `SCHEMA.md` before changing published
  slugs.
- The sibling Vite apps have their own `package.json`, tests, builds, and
  READMEs. Work from inside the relevant app folder.
- GitHub Actions builds the Astro site, then builds `terminal-desires-ranker/`
  and `coffee-rush/`, then assembles the final Pages artifact.

