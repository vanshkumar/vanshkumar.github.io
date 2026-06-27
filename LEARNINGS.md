# Learnings

## What Has Worked

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
