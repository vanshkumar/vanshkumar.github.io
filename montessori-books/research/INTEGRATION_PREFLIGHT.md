# Integration preflight

Read-only findings from the accepted prototype, recorded by the coordinator.
Use with POPULATION_PLAN.md; the reviewed source work controls editorial content.
The initial constraints below describe the pre-migration baseline; task 4's
handoff records the implemented architecture.

## Current implementation constraints

- src/content.js contains only six records for two ages. src/HomeStudy.jsx duplicates
  their titles, action labels, and invitations in a second positional array.
  Canonical records should eliminate this positional coupling for the chosen design.
- The shared IdeaDialog assumes one source and mandatory steps. New perspectives,
  book-only safety summaries, and multiple references require a purpose-appropriate
  detail view. Preserve old study behavior with a compatibility adapter or a separate
  home detail view; do not force missing steps into made-up activity instructions.
- main.jsx's readRoute currently reads concept and age only. A hashchange scrolls
  the entire page to the top, and Study is keyed by concept and age. Add topic/entry
  navigation deliberately: browser back/forward and selected age should work without
  accidentally discarding the selection or making every local choice jump to page top.
- The root route is a ten-study comparison index. The chosen home can become the
  primary experience while keeping the other studies reachable as development
  references. Preserve existing #/home?age= links and all seven age IDs.
- stages.ready currently means only two ages are populated, shared with old studies.
  Do not mark data ready before review or accidentally crash old concepts when their
  legacy data lacks new ages. Treat chosen-guide availability separately if needed.
- The accepted home uses original transparent 1536×1024 WebP images, Literata/DM Sans,
  cream paper, integrated scene headlines, and one reading panel. There are currently
  separate baby and toddler placement rules. New art needs explicit layout metadata
  rather than assuming every non-baby age shares identical blank areas for headlines.
- The current active artwork is home-paper-baby.webp for 6–9 and
  home-paper-toddler.webp for 18–24. Earlier assets remain for design history.
- No backend, installation, migration, new component library, or test suite is needed.
  Keep noindex,nofollow during this local phase. Update stale ten-direction metadata
  when the home becomes the primary entry; no publication or analytics changes.

## Source and environment handoff

- Local PDFs: 310 physical pages for Baby; 257 for Toddler. Foundation owns verified
  metadata and reference policy. Ignored text caches live in tmp/book-text/ as JSON
  with physical pdfPage values. They do not replace inspecting tables/illustrations.
- The existing Vite server was serving http://127.0.0.1:5174/montessori-books/.
  Reuse it when available; do not scan ports or create duplicate servers.
- Bundled Node: /Users/vanshkumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
- Bundled Python: /Users/vanshkumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
- Current direct build: bundled Node followed by node_modules/vite/bin/vite.js build.
- All raw PDFs and tmp/ are gitignored. Never place extracts under public/ or import
  evidence ledgers into app runtime data. Only selected reviewed public fields ship.
- The whole accepted prototype is uncommitted in the shared working directory.
  Do not reset/rebase/commit it, or start work from an older default-branch checkout.

## Publication boundary follow-up

The coordinator's 2026-09-10 architecture read found that main.jsx still statically
imports the six legacy records and renders them in the other nine studies. Switching
the chosen home to reviewed data alone will not remove that older wording/frames
from the production bundle. Preserve the studies as local development references;
use a small development-only boundary so final production contains only reviewed
companion content. Home reviews do not cover the old studies' different short copy,
mandatory steps or illustrations. Task 4 reports that the development-only module
and route boundary is now implemented. Its final pilot build, then task 8's final
integration check, must verify that the old copy is absent from production. There
is no need to reopen all nine design studies.
