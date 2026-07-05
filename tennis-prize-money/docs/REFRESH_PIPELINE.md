# Refresh Pipeline

## Current Status

Version `0.1.0` includes the first server-side refresh pipeline. The dashboard remains a static GitHub Pages app by default; refresh work happens through a Node CLI, GitHub Actions, or an optional separately hosted serverless dispatch endpoint.

The browser bundle never receives GitHub tokens or server-side refresh secrets. It only reads public `VITE_REFRESH_DISPATCH_URL` and `VITE_REFRESH_DOCS_URL` values.

## Local Refresh

Install dependencies, then run:

```bash
npm run refresh:data
```

The script compiles `src/refresh/`, reads the current static JSON files, validates them with the same data schema used by the dashboard, optionally fetches a configured JSON manifest, merges validated source and record rows, and writes:

- `src/data/static/seedDatasetMetadata.json`
- `src/data/raw/source-metadata/grandSlam2025Sources.json`
- `src/data/normalized/grandSlam2025MensSingles.json`

Optional local environment variables:

- `REFRESH_SOURCE_MANIFEST_URL`: absolute URL to a JSON manifest with `sources` and `records` arrays.
- `REFRESH_UPDATE_TIMESTAMP`: defaults to `true`; set to `false` to preserve `lastRefreshedAt`.
- `REFRESH_DRY_RUN`: set to `true` to report changes without writing files.

The manifest must follow the existing source and tournament record schema. The pipeline validates merged output before writing any static JSON.

Useful hardening checks:

```bash
npm run build:refresh
npm run refresh:data
```

Set `REFRESH_DRY_RUN=true` to validate and report output status without writing static JSON.

## GitHub Action Refresh

The parent repo workflow `.github/workflows/tennis-prize-money-refresh.yml` can be run with `workflow_dispatch`.

It:

- checks out the selected branch
- installs app dependencies in `tennis-prize-money/`
- runs `npm run test`
- runs `npm run refresh:data`
- commits only changed app static JSON files
- pushes back to the same branch

Optional secret:

- `TENNIS_PRIZE_MONEY_REFRESH_SOURCE_MANIFEST_URL`: passed to `REFRESH_SOURCE_MANIFEST_URL`. Use a secret if the URL contains credentials or signed query parameters.

Without a source manifest, the action still validates and rewrites the current static JSON. `lastRefreshedAt` advances only when the run clock is later than the existing timestamp.

## Optional Serverless Dispatch

`serverless/refresh-dispatch.mjs` is a small optional handler for a separate backend such as a Worker or Node-compatible serverless function. It is not an in-app `/api/refresh` route and is not hosted by GitHub Pages.

Required server-side environment variables:

- `GITHUB_TOKEN`: server-side GitHub token with permission to dispatch the workflow.
- `GITHUB_OWNER`: `vanshkumar`.
- `GITHUB_REPO`: `vanshkumar.github.io`.
- `GITHUB_REF`: branch to refresh.
- `REFRESH_TOKEN`: passphrase users must provide from the dashboard.

Optional server-side environment variables:

- `REFRESH_WORKFLOW_ID`: defaults to `tennis-prize-money-refresh.yml`.
- `REFRESH_ALLOWED_ORIGIN`: CORS allow-origin value; defaults to `*`.

Browser configuration:

- `VITE_REFRESH_DISPATCH_URL`: public URL of the external dispatch endpoint.
- `VITE_REFRESH_DOCS_URL`: optional public docs link.

When `VITE_REFRESH_DISPATCH_URL` is absent or not an absolute `http`/`https` URL, the dashboard shows "Refresh not configured" and links to this document. When configured, the dashboard asks the user for the refresh passphrase and sends it to the external endpoint in `x-refresh-token`.

## Security Caveats

- Never commit real `.env` files.
- Never prefix GitHub tokens, passphrases, or signed source URLs with `VITE_`.
- GitHub Pages cannot keep server-side secrets, so browser refresh requires a separate backend.
- The optional dispatch endpoint returns status messages only; it must not echo GitHub tokens, source manifest URLs, or passphrases.
- The refresh pipeline logs adapter ids, counts, output paths, and sanitized failures. It does not log configured source URLs with query strings.

## v0.1 Readiness Notes

- The generic JSON manifest adapter is intentionally conservative: incoming rows must already match the validated source and record schema.
- Merge behavior is by stable `id`; incoming rows replace matching ids and unrelated rows are preserved.
- Static JSON files are written only after the full merged dataset validates.
- Browser refresh remains a dispatch-only path; it does not fetch, parse, normalize, or commit data from the browser.
