# LEARNINGS

## Signposts
- 2026-02-26: This repo requires maintaining `.codex/LEARNINGS.md` in every Codex session.

## Friction Log
- 2026-06-16: Shared wiki routing helpers between Astro config and backlink
  code. `npm` was not on PATH in this shell, so build verification used the
  bundled Node runtime to run sync scripts and `astro build` directly.
- 2026-06-16: Minimal docs orientation pass added a root README and refreshed
  project READMEs; no build/test/code friction encountered because changes were
  documentation-only.
- 2026-02-26: No build/test/code friction encountered while mapping repo structure.
- 2026-03-02: One-off markdown parser check failed with `ERR_MODULE_NOT_FOUND` for `remark` because `remark` is not a direct dependency in this repo.
  - Root cause: attempted to run a standalone `remark` script outside Astro's internal markdown pipeline.
  - Fix: verified footnote support via Astro config defaults/types (`markdown.gfm` default true) instead of direct `remark` scripting.
- 2026-03-02: Footnote reference rendered as plain text because definition syntax used `[^1] ...` instead of `[^1]: ...`.
  - Root cause: missing colon after footnote label.
  - Fix: update note to valid markdown footnote definition form and resync `src/content`.
