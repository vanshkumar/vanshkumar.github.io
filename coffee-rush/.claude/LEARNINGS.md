# Learnings

- Project start: the official base-game rulebook is kept local for reference,
  but should not be published as an app asset.
- v1 implementation uses original CSS/emoji-style visuals rather than published
  board or card artwork.
- Tooling: plain `node`/`npm` may not be on PATH, but `mise exec node -- npm ...`
  works. Use it for `npm ci`, `npm test -- --run`, `npm run build`, `npm run lint`,
  and `npm run dev`.
