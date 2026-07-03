# Learnings

## What Has Worked

## Patterns and Preferences

**2026-06-16 — Dev server workflow**
- Observation: The user brings up this project's dev server through mise with `mise x -- npm run dev -- --host 127.0.0.1`.
- Action: Prefer the mise-wrapped command from the repo root when starting or documenting the dev server; leave the terminal/session running to keep Vite up.
- Confidence: high

**2026-06-17 — Local npm workflow**
- Observation: `npm` is not directly available on this Codex shell PATH for this repo, but `mise x -- npm ...` runs tests, lint, build, and dev successfully.
- Action: Use `mise x -- npm <script>` for project npm commands in this workspace.
- Confidence: high

**2026-06-17 — Shelf cover assets**
- Observation: Shelf notes use `coverImage: /assets/shelf/...` as a vault-relative path, with the actual files under `../vault/assets/shelf`.
- Action: Resolve shelf covers through the vault asset middleware and only render cover cards when the referenced file exists inside the vault.
- Confidence: high

**2026-06-17 — Route tab titles**
- Observation: The Vite `index.html` title is shared by all local routes, so new weather surfaces keep the old tab title unless React sets `document.title`.
- Action: Set the browser title from the active route config whenever adding another weather surface.
- Confidence: high

**2026-06-17 — Create note frontmatter**
- Observation: The user prefers create buttons to avoid writing `slug` or `title`; question `slug`/`title` are normalized by the main repo commit hook, and shelf display can fall back to the filename.
- Action: Keep fresh note frontmatter minimal; write date fields, require an explicit shelf rating, and do not stamp `slug` or `title` from the weather app.
- Confidence: high

**2026-06-25 — Activity weighting investigation**
- Observation: Question Weather and Shelf Weather both use `buildActivity` for raw edit scores, then call `assignActivityLevels` separately on each collection.
- Action: Change shared weighting in `scripts/question-data.mjs`; remember that visual activity levels are relative within each surface, not globally comparable across questions and shelf items.
- Confidence: high

**2026-06-25 — Frontmatter activity source**
- Observation: Question Weather and Shelf Weather now treat `lastmod`/`lastMod` frontmatter as the single activity event for each note, instead of reading git history.
- Action: When changing salience, update `buildActivity` and the frontmatter extraction path; do not reintroduce git-log based activity unless explicitly requested.
- Confidence: high

**2026-07-03 — Hunch surface**
- Observation: Hunches live in `../vault/hunches` and use the same plain note frontmatter shape as questions (`title`, `date`, `lastmod`/`lastMod`), without shelf-only rating or cover fields.
- Action: Route hunch changes through `buildHunchData`/`writeHunchData` and keep hunch cards on the plain note layout rather than the shelf cover layout.
- Confidence: high

## What Has Failed
