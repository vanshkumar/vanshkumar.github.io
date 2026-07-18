# Learnings

## What Has Worked

**2026-07-17 — Obsidian plugin runtime**
- Observation: Vault Weather now runs as a desktop-only Obsidian `ItemView`; source stays in `vault-weather`, while `main.js`, `manifest.json`, and `styles.css` are installed into the ignored `../vault/.obsidian/plugins/vault-weather` directory.
- Action: Build and install with `mise x -- npm run install:plugin`; use Obsidian Vault/MetadataCache APIs and the debounced vault-event refresh instead of adding a local server or generated data files.
- Confidence: high

## Patterns and Preferences

**2026-06-17 — Local npm workflow**
- Observation: `npm` is not directly available on this Codex shell PATH for this repo, but `mise x -- npm ...` runs tests, lint, build, and plugin installation successfully.
- Action: Use `mise x -- npm <script>` for project npm commands in this workspace.
- Confidence: high

**2026-06-17 — Shelf cover assets**
- Observation: Shelf notes use `coverImage: /assets/shelf/...` as a vault-relative path, with the actual files under `../vault/assets/shelf`.
- Action: Normalize the vault-relative path, require an existing supported image file, and render it through `app.vault.getResourcePath()`.
- Confidence: high

**2026-06-17 — Create note frontmatter**
- Observation: The user prefers create buttons to avoid writing `slug` or `title`; question `slug`/`title` are normalized by the main repo commit hook, and shelf display can fall back to the filename.
- Action: Keep fresh note frontmatter minimal; write date fields, require an explicit shelf rating, and do not stamp `slug` or `title` from the Weather plugin.
- Confidence: high

**2026-06-25 — Activity weighting investigation**
- Observation: Question Weather, Hunch Weather, and Shelf Weather use the same raw edit scores, then assign visual activity levels separately within each collection.
- Action: Change shared weighting in `src/lib/weatherCore.ts`; remember that visual activity levels are relative within each surface, not globally comparable.
- Confidence: high

**2026-06-25 — Frontmatter activity source**
- Observation: All Weather surfaces treat `lastmod`/`lastMod` frontmatter as the single activity event for each note instead of reading git history.
- Action: Change salience extraction in `src/lib/weatherData.ts`; do not reintroduce git-log based activity unless explicitly requested.
- Confidence: high

**2026-07-03 — Hunch surface**
- Observation: Hunches live in `hunches` and use the same plain note frontmatter shape as questions (`title`, `date`, `lastmod`/`lastMod`), without shelf-only rating or cover fields.
- Action: Keep the hunch collection on the plain note layout and route its behavior through the shared collection config and data service.
- Confidence: high

**2026-07-03 — Git workflow**
- Observation: `vault-weather` is a subdirectory of the parent `vanshkumar.github.io` repository, so Git writes from this app root update `../.git` rather than a local `.git` directory.
- Action: When staging or committing from `vault-weather`, use explicit app-scoped paths and expect Git index/object writes to need elevated filesystem permission.
- Confidence: high

**2026-07-17 — Obsidian button style isolation**
- Observation: Obsidian's global button layout keeps button text on one line and centers intrinsic content, which made long Weather card titles and dates overflow across grid columns.
- Action: Keep card buttons on an explicit `minmax(0, 1fr)` grid column, reset `white-space` and justification, set card children to `min-width: 0`, and wrap long titles inside the card.
- Confidence: high

**2026-07-17 — Refresh lifecycle**
- Observation: Vault and metadata events already cover content changes, so a manual Refresh button duplicated normal plugin behavior; only view reactivation and date-based activity decay needed separate handling.
- Action: Refresh a Weather view when its leaf becomes active and at each UTC date boundary; do not add a manual data-refresh control unless a concrete missed-event case appears.
- Confidence: high

## What Has Failed

**2026-07-17 — Dependency installation**
- Observation: Running npm over an existing pnpm-linked `node_modules` tree makes npm Arborist fail with `Cannot read properties of null (reading 'matches')`.
- Action: Do not mix package-manager layouts; preserve or remove the generated pnpm tree, then run a clean `mise x -- npm install` so subsequent npm commands share one dependency layout.
- Confidence: high
