# Learnings

## What Has Worked

**[2026-07-19] — Discord domain verification DNS**
- Observation: Namecheap's Advanced DNS Host field automatically appends `vanshkumar.net`; entering Discord's full `_discord.vanshkumar.net` name publishes the TXT record at `_discord.vanshkumar.net.vanshkumar.net`, which Discord cannot find.
- Action: For Discord DNS verification on Namecheap, set the TXT Host to `_discord` only and put the complete `dh=...` token in Value.
- Confidence: high

**[2026-07-21] — Unified Terrain corpus**
- Observation: Public general writing now consists only of Markdown files directly at the vault root; projects, essays, questions, hunches, topics, and untagged notes are views over one optional `tags` array, while project logs and Shelf entries remain structured collections.
- Action: Route, sync, normalize, index wikilinks/backlinks, and publish RSS through the `terrain` collection; preserve retired collection paths as redirects or lookup aliases, and never make a root-level Markdown file private.
- Confidence: high

**[2026-07-21] — Unified Terrain dev verification**
- Observation: The in-app browser exercises HTML pages and meta-refresh redirects correctly on the Astro dev server, but blocks direct display of the `/rss.xml` document even though the endpoint returns normally.
- Action: Use the browser for Terrain, legacy redirects, logs, Shelf, and interactive reader checks; verify the dev RSS payload with a direct local Node fetch and assert its item/link counts.
- Confidence: high

**[2026-06-17] — Markdown architecture assessment**
- Observation: The site's Markdown rendering is mostly Astro content collections plus remark/rehype plugins; custom behavior is concentrated in vault-to-content sync, wikilink routing/backlinks, Obsidian callouts, and a terrain excerpt helper.
- Action: Prefer consolidating small Astro/unified helpers over replacing the renderer with Pandoc unless the goal is non-web export or wholesale Markdown dialect conversion.
- Confidence: high

**[2026-06-17] — Markdown image captions**
- Observation: `@flowershow/remark-wiki-link` preserves Obsidian embed aliases on `embed.data.alias`, but images can share a paragraph with preceding text if there is no blank line before the embed.
- Action: For Obsidian image caption behavior, transform parsed remark `embed` nodes and split mixed paragraphs around captioned images; use `astro build --force` when validating changes to imported Markdown plugin helpers because Astro's content cache may not notice those helper edits.
- Confidence: high

**[2026-06-21] — Sibling app routing check**
- Observation: `/terminal-desires-ranker/` is not produced by the root Astro `dist/` alone; GitHub Actions builds `terminal-desires-ranker/` separately and copies its `dist/` into `site/terminal-desires-ranker/`.
- Action: Treat absolute vault links to `/terminal-desires-ranker` as valid for deployed Pages, but include the sibling app build/copy step when doing local full-site verification.
- Confidence: high

**[2026-06-25] — Terrain card UI verification**
- Observation: The package `build` script runs vault/content and asset sync before Astro, while direct Astro verification can run with the bundled Node binary via `node node_modules/astro/astro.js build`.
- Action: For source-only UI changes when the worktree has unrelated vault edits, verify with direct Astro first so generated content/assets are not rewritten from unrelated changes.
- Confidence: high

**[2026-06-25] — Terrain question card spacing**
- Observation: Question cards inherit the full `.terrain-card` top padding even after their meta row is removed, so the title can still look like it is leaving space for the old date/arrow row.
- Action: Override spacing on `.terrain-card-question` in `src/styles/global.css` when question-specific card chrome changes, instead of changing the shared project/essay card padding.
- Confidence: high

**[2026-06-26] — Site typography scaling**
- Observation: The shared layout mostly scales through rem units, but placing the footer inside `.page` makes it inherit the page shell instead of behaving like a full-width bottom band.
- Action: For global type increases, scale the root font size, convert fixed content/card/footer dimensions that frame text to rems, and keep `.site-footer` as a sibling of `.page` with its own centered `.site-footer-inner`.
- Confidence: high

**[2026-06-26] — Obsidian math rendering**
- Observation: Astro emits Obsidian-style `$...$` and `$$...$$` math delimiters as plain prose text unless the shared content layout opts pages into a client-side math renderer.
- Action: Gate MathJax loading through `BaseLayout` with an `enableMath` prop, enable it from `ContentLayout`, and keep MathJax sizing/overflow rules in the `.prose` CSS block.
- Confidence: high

**[2026-06-26] — Mixed root and sibling app changes**
- Observation: Root-site tasks can share a worktree with unrelated sibling app changes such as `coffee-rush/LEARNINGS.md`.
- Action: When committing root-site fixes, stage explicit root paths instead of broad `git add -A` so sibling app edits stay untouched.
- Confidence: high

**[2026-06-27] — Analytics setup**
- Observation: User-facing Astro pages share `src/layouts/BaseLayout.astro`, while `/traces/[...slug].astro` is a standalone zero-delay redirect document with its own `<head>`.
- Action: Put global head scripts in `BaseLayout.astro` for normal site pages, and handle the traces redirect separately only when the redirect page itself needs instrumentation.
- Confidence: high

**[2026-06-27] — Direct publish**
- Observation: The active branch for this site repo is `main` tracking `origin/main`, and explicit "commit and push" requests are intended as direct publishes rather than PR branch work.
- Action: Commit scoped site changes on the current tracking branch and push `origin/main`, while staging explicit paths when the worktree contains unrelated edits.
- Confidence: medium

**[2026-06-27] — Side-app analytics**
- Observation: Deployed sibling apps `coffee-rush/` and `terminal-desires-ranker/` are separate Vite builds with their own `index.html`; their GitHub Pages SPA fallbacks live in each app's `public/404.html`.
- Action: Global root-site head changes do not reach sibling apps; add shared analytics snippets directly to each app's `index.html`, and include the app `public/404.html` fallback only when redirect/fallback hits should be measured.
- Confidence: high

**[2026-06-27] — Analytics documentation**
- Observation: `README.md` is the clearest durable orientation point for cross-app implementation rules; `SCHEMA.md` should stay focused on content collections and vault sync.
- Action: Document shared analytics requirements in the root README editing notes when adding or changing deployed sub-app patterns.
- Confidence: high

**[2026-07-02] — Content collection rename**
- Observation: Published collection names are repeated across Astro content config, vault sync/normalize scripts, wiki routing/backlink helpers, and route files; Astro's wiki index reads generated `src/content/<collection>` during config evaluation.
- Action: When renaming a published collection, update `src/content.config.ts`, `scripts/sync-content.mjs`, `scripts/normalize-content.mjs`, `src/lib/wiki-routing.mjs`, `src/lib/wiki.ts`, and page routes together, then run `scripts/sync-content.mjs` before direct Astro build verification.
- Confidence: high

**[2026-07-02] — Collection terminology follow-up**
- Observation: A collection can accumulate multiple public names during terminology changes; `src/lib/wiki-routing.mjs` already supports arrays of legacy prefixes, and old route files can each redirect to the current route.
- Action: Preserve every prior public prefix as a wiki alias and route redirect when renaming collection terminology, even if an intermediate name was short-lived.
- Confidence: high

**[2026-07-03] — GitHub Pages Node 24 deployment**
- Observation: The Pages workflow builds the root Astro site plus `terminal-desires-ranker/` and `coffee-rush/`; all three direct production builds run under the bundled Node 24 runtime even when host `node`/`npm` are not on PATH. `actions/upload-pages-artifact@v5` excludes dotfiles unless `include-hidden-files: true` is set, which matters because the assembled artifact intentionally creates `site/.nojekyll`.
- Action: Keep the Pages workflow on Node 24 and current GitHub-owned action majors, and keep `include-hidden-files: true` when uploading the Pages artifact. For local workflow-only verification, use the bundled Node binary to run Astro/Vite CLIs directly when avoiding repo sync scripts that would rewrite dirty vault-derived content.
- Confidence: high

**[2026-07-03] — Root npm ci lockfile validation**
- Observation: With the Pages workflow using `npm ci` under newer npm, the root lockfile must include package entries for every `sharp` optional dependency; missing `@img/sharp-*linuxmusl*` entries cause npm to fail before build even though they are platform-specific optional packages.
- Action: When changing Sharp or regenerating the root lockfile, keep the linux musl optional package entries in `package-lock.json` and verify that each `optionalDependencies` item has a matching `node_modules/<package>` entry.
- Confidence: high

**[2026-07-03] — Pages artifact asset filenames**
- Observation: A Pages deployment can fail in the deploy job even after all build/upload steps pass, and the backend may only report `Deployment failed, try again later.` Comparing successful and failed `github-pages` artifacts with `gh run download` is useful for narrowing the changed deployment surface; in one failure the only artifact delta was a newly added timestamped screenshot asset.
- Action: Prefer stable, slug-like names for new vault assets that are embedded in published pages, and compare downloaded Pages artifacts when the deploy step fails without a build error.
- Confidence: medium

**[2026-07-03] — Pages artifact size reduction**
- Observation: The published artifact included both raw `partition-summer/*.png` comic pages and optimized `partition-summer/web/*.webp` pages; the raw PNGs dominated the deploy artifact size while the reader already served the optimized copies.
- Action: Keep raw comic source pages in `vault/assets`, but prune numeric comic PNGs from generated `public/assets` after web optimization and link the reader click-throughs to the optimized assets.
- Confidence: high

**[2026-07-05] — Removed side app deployment cleanup**
- Observation: Removing a deployed sibling app directory can leave `.github/workflows/deploy.yml` install/build/copy/verify steps and app-specific workflows pointing at a missing working directory, causing Pages builds to fail before artifact upload.
- Action: When removing a side app from the parent repo, update the Pages deploy assembly and delete or rewrite any app-specific workflows in the same change; verify with `rg` for the app path outside `.git`.
- Confidence: high

**[2026-07-05] — Branch drift after side app removal**
- Observation: Feature branches based before `tennis-prize-money/` was removed can show the entire app as locally deleted even though `origin/main` already removed it cleanly.
- Action: Before staging side-app deletions from an older branch, compare with `origin/main` and move fixes onto main or merge main first so already-published removals are not recommitted from stale branch state.
- Confidence: high

**[2026-07-06] — Obsidian Git detached checkout diagnosis**
- Observation: Obsidian Git commit-and-sync can fail with `ambiguous argument 'undefined'` and `No upstream-branch is set` when the vault checkout is on detached `HEAD`; in this repo that can happen while `main` is checked out in a separate Codex worktree.
- Action: Before troubleshooting Obsidian Git settings, check `git status --short --branch` and `git worktree list`; if another Codex worktree holds `main`, remove that clean worktree, fast-forward local `main` to `origin/main`, then `git switch main` in the vault checkout.
- Confidence: high

**[2026-07-06] — Content header metadata**
- Observation: `src/layouts/ContentLayout.astro` is shared by Terrain entries, Shelf items, logs, and static pages, but only general Terrain entries should show the start-to-last-modified date range in the header.
- Action: Keep date-range header metadata opt-in from the unified Terrain detail route; Terrain pages should not display a required classification label.
- Confidence: high

**[2026-07-07] — Terrain accent-only hero**
- Observation: `src/pages/terrain.astro` now supports a terrain hero with no normal `heroTitle`: a lone `heroAccent` renders in the existing title position, and empty page body content no longer emits the subtitle wrapper.
- Action: For a single accent-styled terrain prompt, omit `heroTitle` in `vault/pages/terrain.md`, set `heroAccent`, and keep accent-only spacing scoped through `.terrain-hero-title-accent-only`.
- Confidence: high

**[2026-07-07] — Terrain accent-only hero sizing**
- Observation: The generic `.terrain-hero-title span:first-child` selector is more specific than `.terrain-hero-accent`, so a lone accent span inherits the normal green title color unless the generic selector opts out.
- Action: For accent-only terrain heroes, exclude `.terrain-hero-title-accent-only` from the generic first-child color rule, then use scoped single-line sizing rules and the wider `.terrain-hero-content-accent-only` wrapper.
- Confidence: high

## Patterns and Preferences

**[2026-06-26] — Typography size tuning**
- Observation: A 20% root font-size increase made the site feel oversized against existing article and terrain content; a 10% increase preserves the readability bump without overwhelming the layout.
- Action: Prefer `html { font-size: 110%; }` for this site's global readability scale unless a larger type treatment is explicitly requested.
- Confidence: medium

**[2026-06-26] — Top-level documentation orientation**
- Observation: The top-level README, SCHEMA, and TECH_STACK docs are intended as minimal agent orientation; `SCHEMA.md` should describe content collections and vault sync, not every route or redirect.
- Action: For documentation upkeep, fix factual drift such as app names or deploy status, but avoid expanding `SCHEMA.md` with non-collection route details unless they affect content editing.
- Confidence: high

## What Has Failed

**[2026-06-25] — Terrain question card vertical balance**
- Observation: Moving the updated date into normal flow to match the top title gap made question cards feel wrong; the preferred layout keeps the updated date locked to the card bottom.
- Action: Do not remove `margin-top: auto` from `.terrain-card-question .terrain-card-footer` to chase equal top/title-to-date spacing.
- Confidence: high
