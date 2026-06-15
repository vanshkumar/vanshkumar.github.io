# Question Weather

A local-only Vite app for browsing questions from `../vault/questions`, seeing computed recent-activity salience, and opening a selected question in Obsidian.

## Commands

- `npm install`
- `npm run generate`
- `npm run dev`
- `npm run test`
- `npm run build`

`npm run dev` and `npm run build` regenerate `src/data/questions.generated.json` before starting. That file is ignored because the vault is the source of truth.

## Salience

Salience is generated, not manually saved. The generator reads git history for each question over the last 30 days and sums recent edits with a quadratic recency discount: an edit today contributes much more than an edit several weeks ago. An uncommitted local edit is counted as activity today.
