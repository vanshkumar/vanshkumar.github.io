# Vault Weather

A local-only Vite app for browsing vault surfaces, seeing computed recent-activity salience, and opening selected notes in Obsidian.

This app is for local use and is not assembled into the GitHub Pages deploy.

## Surfaces

- `/` shows Question Weather from `../vault/questions`.
- `/shelf-weather` shows Shelf Weather from `../vault/shelf`. Shelf cards use `coverImage` frontmatter when it points to an existing vault asset such as `/assets/shelf/book.webp`.

## Commands

- `npm install`
- `npm run generate`
- `mise x -- npm run dev -- --host 127.0.0.1`
- `npm run test`
- `npm run build`

`npm run dev` and `npm run build` regenerate `src/data/questions.generated.json` and `src/data/shelf.generated.json` before starting. Those files are ignored because the vault is the source of truth.

When the dev server is running, use the in-app Refresh button to regenerate the current surface and reload the page. Use the plus button to create a new note in that surface from a title and open it in Obsidian.

## Where Things Live

- `scripts/question-data.mjs` reads the vault, computes activity, resolves shelf covers, and creates new notes.
- `vite.config.js` adds local-only refresh/create endpoints and cover asset serving for the dev server.
- `src/data/*.generated.json` is generated and ignored by git.
- `src/lib/questionState.js` owns shared sorting and activity tone logic.

## Salience

Salience is generated, not manually saved. The generator reads git history for each note over the last 30 days and sums recent edits with a quadratic recency discount: an edit today contributes much more than an edit several weeks ago. An uncommitted local edit is counted as activity today.
