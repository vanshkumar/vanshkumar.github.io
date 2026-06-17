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

## Patterns and Preferences

## What Has Failed
