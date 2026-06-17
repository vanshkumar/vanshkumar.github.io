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

## What Has Failed
