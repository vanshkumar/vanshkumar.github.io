# Learnings

## What Has Worked

**[2026-08-23] — Editorial background warmth study**
- Observation: The active editorial `:root` block overrides the earlier `--bg` token; in homepage captures, the user selected the moderate `#fbf7ef` “warm paper” option over the subtler previous-site `#fdfbf7` and the visibly grayer older `#f6f3ee` palette.
- Action: Keep the effective editorial background at `#fbf7ef`; when revisiting page warmth, edit the later editorial token rather than the stale first `:root` value.
- Confidence: high

**[2026-08-23] — Homepage comic attribution**
- Observation: The live homepage renders `home.comic.caption` verbatim from `vault/pages/home.md`; the local comic PNG's low-resolution syndication line looks like `3/16`, but GoComics and a contemporary March 13, 1995 newspaper page identify the pictured “inscrutable exhortations” strip as March 13, 1995.
- Action: Treat the homepage comic caption as authored copy, not inferred metadata, and verify publication dates against an archive or contemporary print page rather than the pasted-image filename or a blurry syndication line.
- Confidence: high

**[2026-08-23] — Static page removal**
- Observation: A vault-backed static page remains independently represented by its authored Markdown file, its Astro route, and any shared navigation entry in `vault/pages/site.md`; content sync removes the generated page entry after the source Markdown is deleted.
- Action: When retiring a static page entirely, delete both `vault/pages/<page>.md` and `src/pages/<page>.astro`, remove its shared links, update page-inventory documentation, then sync and confirm the build emits no route.
- Confidence: high

**[2026-08-23] — Vault-backed site copy**
- Observation: The live site's authored prose and display labels can all use the existing pages collection: Markdown bodies hold page prose, typed frontmatter holds structured page/global labels, and Astro stays responsible for layout. Empty frontmatter-only page entries may have an undefined `body`.
- Action: Edit live copy under `vault/pages/`—especially `home.md` for the homepage and `site.md` for shared text—keep optional-body checks null-safe, and leave the isolated `src/pages/homepage-variants/` sample copy with those noindex prototypes.
- Confidence: high

**[2026-08-22] — Fresh-checkout corpus tests**
- Observation: `src/content/terrain` is generated and absent from a fresh checkout, so corpus classification tests that read it fail in CI when `npm test` runs before the site build.
- Action: Keep `npm test` self-contained by running `sync-content` before tests that validate the generated Terrain corpus; do not rely on a prior local dev or build command having populated `src/content`.
- Confidence: high

**[2026-08-21] — Canonical Posts/Notes over internal Terrain**
- Observation: The Astro site can preserve Terrain as its vault, sync, backlink, and collection identity while exposing a strict Posts/Notes split; generating both public namespaces for every entry makes later category changes redirect-safe without rewriting authored Markdown.
- Action: Keep classification, ordering, canonical writing URLs, log URLs, wiki resolution, archives, homepage queries, RSS, and legacy redirects routed through `src/lib/writing.mjs`; require exactly one tag group and Post-only log parents at build time.
- Confidence: high

**[2026-08-21] — Isolated homepage concept routes**
- Observation: Standalone, `noindex` routes under `/homepage-variants` make it possible to compare homepage directions against the same real content without disturbing `/`; Astro compiles `getStaticPaths` independently, so it cannot close over a frontmatter-local concepts array.
- Action: Keep exploratory homepage studies out of primary navigation, define their descriptors inside `getStaticPaths` (or import them from a module), and use a separate comparison index while the live homepage remains unchanged.
- Confidence: high

**[2026-08-21] — Personal timeline ingestion path**
- Observation: The Astro build regenerates collection directories in `src/content/` from `vault/`, while root Terrain sync intentionally ignores nested vault folders; a publishing worker that copies the reference implementation's `src/content/timeline/` target would bypass this repo's source-of-truth model.
- Action: Store bot-authored micro-posts in `vault/timeline/`, add a dedicated timeline collection to the vault sync and Astro content config, and render that collection inline on one reverse-chronological page without per-post routes.
- Confidence: high

**[2026-08-23] — Homepage Word Garden placement**
- Observation: The Word Garden is now a standalone homepage section after Recent notes, so its labels can live in `vault/pages/home.md` and the About page no longer needs marker-based Markdown splitting.
- Action: Render the Word Garden after `recent-notes-title` in `src/pages/index.astro`, keep About on the normal `<Content />` path, and preserve the homepage ordering/absence-from-About assertions in `scripts/verify-build.mjs`.
- Confidence: high

**[2026-08-23] — Homepage Word Garden visual review**
- Observation: At the desktop 1280×720 viewport, one normal screenshot can frame Recent notes, the complete Word Garden, and the footer; the in-app browser's stitched full-page capture duplicated the homepage ending.
- Action: Review the homepage garden with a regular viewport capture focused on the page ending rather than a stitched full-page screenshot.
- Confidence: medium

**[2026-08-19] — Build-time word activity history**
- Observation: The homepage Word Garden derives daily word edits from current and legacy public vault paths during the Astro build; a shallow GitHub Pages checkout silently loses the history, while a broad vault glob would include private writing folders.
- Action: Keep the Pages checkout at `fetch-depth: 0`, and update the Word Garden public-path allowlist whenever a published collection path changes instead of widening it to all vault Markdown.
- Confidence: high

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

**[2026-08-23] — Mixed-file direct publish**
- Observation: Homepage work can share `src/styles/global.css` and `LEARNINGS.md` with concurrent archive or article edits, so staging those whole files would include unrelated work even when every other path is scoped.
- Action: Before a direct publish from a dirty `main`, recheck the current HEAD and use hunk-level staging for shared files in addition to explicit path staging.
- Confidence: high

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

**[2026-08-23] — Article phase heading rhythm**
- Observation: Article H3 phase headings followed directly by lists looked crowded with the generic `0.9rem` heading-to-content gap, while other heading transitions were not part of the requested change.
- Action: Keep the larger `1.25rem` gap scoped to `.prose h3 + :is(ul, ol)` so phase-style lists breathe without loosening heading-to-paragraph spacing.
- Confidence: high

**[2026-08-23] — Vault article heading hierarchy**
- Observation: `ContentLayout` supplies the page H1; before the hierarchy cleanup, 39 published Markdown entries also authored an H1, and the representative Aliveline post rendered six H1s before jumping to H4 phase headings.
- Action: Keep vault source aligned with the rendered document by authoring top-level body sections as H2 and nested sections consecutively below them; retain build-wide checks that every article has exactly one H1 and no skipped heading levels.
- Confidence: high

**[2026-08-23] — Narrow prose with wide article media**
- Observation: The `ContentLayout` default slot places normal Markdown, Shelf grids, image paragraphs, and comic mounts inside the same `.prose` wrapper, so narrowing that wrapper would also squeeze media-heavy content.
- Action: Keep `.prose` at the 710px article width, use a centered 36rem grid track for text-flow children, and explicitly span figures, image paragraphs, code/tables, Shelf grids, and comic mounts across the wide track; verify article, Shelf, image, and comic layouts at desktop and mobile widths.
- Confidence: high

**[2026-08-23] — Link and quotation color differentiation**
- Observation: The editorial link green `#315c39` has strong contrast against the cream page but only modest visual separation from body copy; its pale underline is also easy to overlook. For quotations, the user prefers normal body-colored text on a light green-tinted background rather than green quote text, and favored a lighter wash after the first preview.
- Action: Keep UI accents on the moss palette, use dedicated saturated-green link tokens with a more visible underline, and style standard blockquotes with inherited prose color plus a restrained green fill and sage border; do not carry that quote treatment into callouts.
- Confidence: high

**[2026-08-23] — Long-form article readability**
- Observation: The editorial article template shares one 710px width between display headers and running prose, which produces roughly 75–85-character body lines in desktop captures; its Post/Note kind is also repeated in the kicker and metadata row, while the metadata and tracked uppercase kicker render at about 12px and 11px.
- Action: For article readability tuning, keep the established global type scale but test a separate 35–37rem prose measure, balanced headline wrapping, slightly larger small-print text, and a date-only metadata row; preserve the wider measure for headers and media.
- Confidence: high

**[2026-08-23] — Article gutter breakpoint**
- Observation: The editorial `.page` removes horizontal padding above the 640px breakpoint, so viewports from 641px through the 710px content maximum can place article text directly against the viewport edge.
- Action: Keep an outer horizontal gutter until the viewport is wider than the article measure plus both gutters, rather than adding article padding only at 640px and below.
- Confidence: high

**[2026-08-23] — Writing archive separators**
- Observation: On `/notes/` and `/posts/`, linked titles distinguish entries without pale horizontal rules; on the Posts archive, `2.15rem` of both margin and padding created an overly loose 76px visual gap, while `1.5rem` of each produces a calmer 53px gap at the site's 110% root scale.
- Action: Keep `.note-archive-list` entries and adjacent `.archive-post` entries borderless, retain the rule beneath the archive heading, and use the tighter `1.5rem` margin-plus-padding rhythm between Posts unless the user explicitly revises it; do not apply this preference to homepage lists without an explicit request.
- Confidence: high

**[2026-08-23] — Homepage writing-list rhythm**
- Observation: On the desktop homepage, the `0.45rem` gap between Recent note items is barely distinct from the spacing inside a wrapped title, while the `1.5rem` gap between Recent post blocks also reads tighter than the surrounding editorial scale; section-level gaps are already generous.
- Action: Fix homepage crowding locally: prefer about `0.8rem` between Recent note items and `2rem` between Recent post blocks, while leaving title-to-description and section-to-section spacing unchanged.
- Confidence: high

**[2026-08-23] — Minimal footer navigation**
- Observation: The user wants the global footer limited to About, Shelf, Twitter, Substack, and RSS, in that order; Posts, Notes, and Now should remain accessible elsewhere rather than appearing in the footer.
- Action: Preserve that exact footer link set and order in `vault/pages/site.md` unless the user explicitly revises the global navigation.
- Confidence: high

**[2026-08-21] — Posts and notes architecture**
- Observation: The user no longer wants the site framed as a digital garden because maintaining interlinked, perpetually tended material raises the activation energy of writing; they prefer a simple public split where projects and essays are “Posts,” while hunches and questions are “Notes.”
- Action: Preserve the unified Terrain source collection, existing detail URLs, content, tags, wikilinks, and backlinks, but present separate Posts and Notes archives; remove Terrain/garden language from primary navigation and show “Recent posts (see all)” followed by “Recent notes (see all)” on the homepage, with no subscription UI.
- Confidence: high

**[2026-08-21] — Homepage comic continuity**
- Observation: The existing Calvin and Hobbes strip on `/` is an intentional front-page element the user wants to preserve while moving toward the warm, author-centric Generous Hello direction.
- Action: Treat the strip as part of the homepage identity—prefer a masthead, frontispiece, or epigraph placement that remains visually prominent, then place the concise personal introduction and selected/recent reading below it.
- Confidence: high

**[2026-08-21] — Refined homepage comparison**
- Observation: After seeing the broad first round, the user preferred a blend of Plainspoken’s directory structure and Quiet Editorial’s typography; the useful design space is now subtle hierarchy, density, metadata, and color rather than cards or garden metaphors.
- Action: For the eventual homepage, keep one narrow serif column with a brief personal introduction plus selected and recent lists, and use further comparisons to tune information density instead of reintroducing taxonomy-heavy UI.
- Confidence: high

**[2026-08-21] — Homepage editorial direction**
- Observation: The user is increasingly drawn to a calm, author-centric homepage like `ponnekanti.net` and feels the visual garden makes a modest body of finished writing seem thinner than it is.
- Action: Prefer a concise introduction plus small curated lists of selected and recent writing; keep Terrain available as the fuller notes archive, and label unfinished material as notes rather than forcing everything to read as a finished post.
- Confidence: medium

**[2026-08-20] — Word Garden visual encoding**
- Observation: The Word Garden reads more clearly when plot color communicates only words touched; the burgundy deletion-heavy corner and separate pruning classification added unnecessary visual semantics.
- Action: Keep added, edited, and removed counts in summaries and accessible labels, but encode daily plots only with the moss-green words-touched intensity scale.
- Confidence: high

**[2026-08-23] — Understated homepage Word Garden**
- Observation: The user prefers the homepage activity plot to stand entirely on its own, without a visible title, explainer, totals row, or separating rule.
- Action: Keep the section named accessibly as “Writing activity,” begin visually with the calendar, and do not reintroduce introductory chrome or summary totals unless explicitly requested.
- Confidence: high

**[2026-08-16] — Editorial inventory**
- Observation: The strongest post-ready ideas are distributed across public Terrain notes, private `writing inbox` fragments, project reflections, and sibling-app documentation; clusters with both a personal stake and a concrete artifact are substantially more developed than their individual filenames suggest.
- Action: When mining this repo for essays, group related notes across those surfaces and prioritize clusters that already contain a lived hook, a defensible thesis, and implementation or research evidence; check existing Substack links before treating a topic as unpublished.
- Confidence: high

**[2026-06-26] — Typography size tuning**
- Observation: A 20% root font-size increase made the site feel oversized against existing article and terrain content; a 10% increase preserves the readability bump without overwhelming the layout.
- Action: Prefer `html { font-size: 110%; }` for this site's global readability scale unless a larger type treatment is explicitly requested.
- Confidence: medium

**[2026-06-26] — Top-level documentation orientation**
- Observation: The top-level README, SCHEMA, and TECH_STACK docs are intended as minimal agent orientation; `SCHEMA.md` should describe content collections and vault sync, not every route or redirect.
- Action: For documentation upkeep, fix factual drift such as app names or deploy status, but avoid expanding `SCHEMA.md` with non-collection route details unless they affect content editing.
- Confidence: high

## What Has Failed

**[2026-08-23] — Homepage Markdown paragraph styling**
- Observation: `src/pages/index.astro` renders both sides of the comic marker inside `.home-static`, so the broad `.home-static > p` rule styles every authored homepage paragraph as oversized intro copy and removes its margin; adding ordinary paragraphs after the comic therefore makes them look like headings and collide with the following Recent posts section even though Markdown produced correct `<p>` elements.
- Action: Keep display typography scoped to `.home-static-intro > h1`, keep post-comic prose and directory styling under `.home-static-directory`, and preserve the explicit gap from that fragment to the first `.home-section`.
- Confidence: high

**[2026-06-25] — Terrain question card vertical balance**
- Observation: Moving the updated date into normal flow to match the top title gap made question cards feel wrong; the preferred layout keeps the updated date locked to the card bottom.
- Action: Do not remove `margin-top: auto` from `.terrain-card-question .terrain-card-footer` to chase equal top/title-to-date spacing.
- Confidence: high
