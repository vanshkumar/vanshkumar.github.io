# Deployment

## Recommended GitHub Pages Path

`tennis-prize-money/` is an app-local React + Vite project inside the parent `vanshkumar.github.io` repo. The recommended deployment path is the existing parent GitHub Pages workflow pattern:

1. Install root Astro dependencies and build the root site.
2. Install `tennis-prize-money/` dependencies with `npm ci`.
3. Build the app with `npm run build` from `tennis-prize-money/`.
4. Create `site/tennis-prize-money/` in the combined Pages artifact.
5. Copy `tennis-prize-money/dist/.` into `site/tennis-prize-money/`.
6. Preserve `site/.nojekyll` and deploy the combined artifact.

The app Vite config already uses:

```ts
base: '/tennis-prize-money/'
```

The parent workflow currently builds other deployed side apps. Add analogous install/build/copy steps for this app when promoting it into the Pages artifact.

## Static Runtime Boundary

GitHub Pages serves static files only. Do not deploy server-side refresh code as part of the Vite bundle, and do not add app-local `/api/refresh` assumptions for Pages.

The static dashboard can safely receive:

- `VITE_REFRESH_DISPATCH_URL`: public external dispatch endpoint URL.
- `VITE_REFRESH_DOCS_URL`: public docs URL.

The static dashboard must not receive:

- `GITHUB_TOKEN`
- `REFRESH_TOKEN`
- signed or secret source URLs
- any other server-side credential

## Data Refresh Deployment

The manual data refresh workflow lives in the parent repo at:

```text
.github/workflows/tennis-prize-money-refresh.yml
```

Run it with `workflow_dispatch` to validate, refresh, commit changed static JSON, and push back to the selected branch.

If an external source manifest is needed, set:

```text
TENNIS_PRIZE_MONEY_REFRESH_SOURCE_MANIFEST_URL
```

as a GitHub Actions secret.

## Optional Serverless Refresh Backend

Browser-triggered refresh is optional. To enable it, deploy `serverless/refresh-dispatch.mjs` to a separate serverless host and configure its server-side environment variables:

- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_REF`
- `REFRESH_TOKEN`
- optional `REFRESH_WORKFLOW_ID`
- optional `REFRESH_ALLOWED_ORIGIN`

Then set the static app variable:

```text
VITE_REFRESH_DISPATCH_URL=https://your-refresh-backend.example.com/dispatch
```

The backend dispatches the GitHub Action; it does not refresh data directly in the browser.
