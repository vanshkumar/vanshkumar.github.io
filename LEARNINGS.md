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

## Patterns and Preferences

## What Has Failed
