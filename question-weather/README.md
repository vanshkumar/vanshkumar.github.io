# Question Weather

A local-only Vite app for browsing questions from `../vault/questions`, seeing computed recent-activity salience, and opening a selected question in Obsidian.

This app is for local use and is not assembled into the GitHub Pages deploy.

## Commands

- `npm install`
- `npm run generate`
- `npm run dev`
- `npm run test`
- `npm run build`

`npm run dev` and `npm run build` regenerate `src/data/questions.generated.json` before starting. That file is ignored because the vault is the source of truth.

When the dev server is running, use the in-app Refresh button to regenerate from `../vault/questions` and reload the page. Use the plus button to create a new note in `../vault/questions` from a title and open it in Obsidian.

## Where Things Live

- `scripts/question-data.mjs` reads the vault, computes activity, and creates
  new question notes.
- `vite.config.js` adds local-only refresh/create endpoints for the dev server.
- `src/data/questions.generated.json` is generated and ignored by git.
- `src/lib/questionState.js` owns sorting and activity tone logic.

## Salience

Salience is generated, not manually saved. The generator reads git history for each question over the last 30 days and sums recent edits with a quadratic recency discount: an edit today contributes much more than an edit several weeks ago. An uncommitted local edit is counted as activity today.
