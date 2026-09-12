# Task 4 working handoff

2026-09-10. **Architecture groundwork complete; full pilots pending. Task 4 is
not complete and bulk population is not authorized.** The coordinator has now
sent **both-books-ready**. Both final research handoffs and completeness audits
are available; complete 6–9 and 18–24 month five-topic pilot drafting is underway.
The final exact-entry reviews and population allocation remain pending.

The coordinator separately authorized the narrow six-prototype re-review before
full-book research finishes. Those two independent xhigh reviews are complete
against `PROTOTYPE_BASELINE.json`. Exact verdicts and held revisions are recorded
in `PROTOTYPE_DISPOSITIONS.md`; they do not constitute pilot approval.

## What changed

- The chosen home is the primary route. `#/studies?age=…` retains all ten visual
  study links; the other nine layouts and their three-item legacy contract remain.
- The six existing home action labels/invitations now live beside their records
  in `src/content.js`. Titles and guidance are selected by stable entry ID rather
  than a second positional array. All pre-existing legacy entry fields survive.
- An explicit prototype adapter supplies the canonical store. Entries are reused
  by age/topic placements; this does not imply review readiness or full age coverage.
- The home retains the accepted round 16 scene/headline/reading panel. A quiet
  Explore more link leads to the five approved topics and stable entry routes.
- Routed reading views support invitation/perspective/everyday-situation kinds,
  optional paragraphs/steps, public age context, multiple structured references,
  and optional key-moment metadata. No made-up content or new illustration fills
  these capabilities. Existing prototype citation strings stay explicitly legacy.
- Hash navigation preserves opening/age/topic selection through browser history.
  Invalid age/topic applicability cannot render a globally existing entry under
  an unsupported context. Root metadata now describes the companion; noindex stays.

## Owned files

| File(s) | Purpose |
| --- | --- |
| `src/content.js` | Existing six legacy records plus their accepted short home copy |
| `src/guide/catalog.js` | Five public topic labels, book identity labels, kind/page labels |
| `src/guide/store.js` | Pure canonical entry/placement/scene selectors and identity checks |
| `src/guide/prototype.js` | Explicit temporary adapter plus ID-based placements and existing scenes |
| `src/guide/index.js` | Single explicit runtime data input; no research/draft imports |
| `src/guide/routes.js` | Hash parser and home/study links |
| `src/HomeStudy.jsx`, `src/home.css` | Accepted home plus layered browse/read views and scoped styles |
| `src/main.jsx`, `index.html` | Root routing, legacy-study links, document metadata |
| `src/LegacyStudies.jsx` | Original alternate studies, imported only in development |
| `content/pilots/CONTRACT.md` | Provisional public/private contract, exact review semantics and future ownership gate |
| `content/pilots/review-snapshot.mjs` | Offline public field projection and separate exact text/art digests |
| `content/pilots/PROTOTYPE_BASELINE.json` | Frozen six-entry local prototype projections; no approval claims |
| `content/pilots/ARCHITECTURE_REVIEW.md` | Independent findings/resolutions, lightweight build/browser checks and hashes |
| `content/pilots/reviews/PROTOTYPE_SOURCE_REVIEW.json` | Complete narrow independent xhigh source review of the frozen baseline |
| `content/pilots/reviews/PROTOTYPE_TONE_REVIEW.json` | Complete narrow independent xhigh spirit/tone review of the frozen baseline |
| `content/pilots/PROTOTYPE_DISPOSITIONS.md` | Both exact verdicts, every finding mapped to a held revision, and resumption requirements |
| `content/pilots/drafts/baby/`, `drafts/toddler/`, `drafts/shared/` | Fresh xhigh authors' disjoint pilot drafts and source/coverage traces; unapproved work in progress |
| `content/pilots/drafts/scenes-r01.json` | Existing scene bytes with corrected toddler alt description, awaiting exact art/context review |
| this file | Current handoff, remaining work and learnings for the coordinator |

Build output is ignored `dist/`; original pre-edit sources are in ignored
`tmp/pilots-architecture/`. No researcher-owned directories, shared
`POPULATION_STATUS.md`/`LEARNINGS.md`, parent-site files, PDFs, or existing image
assets were edited. No commit, publication, site initialization, new dependency,
new user-owned task, or generated art occurred.

## Review and source state

Architecture and contract received two fresh independent xhigh agents' bounded
reviews. Five total findings were corrected and independently rechecked; see
`ARCHITECTURE_REVIEW.md`. This is software QA, not approval of book guidance.

Read the complete project learnings/plan/preflight and the completed foundation
package before implementation. Main did not read original source pages during
source-independent groundwork. Narrow reviewers record their own exact original
page/context/visual spans in their review files; their reads must not be counted
as main's full-book reading or as finished source coverage.

Main consumed the final Toddler `HANDOFF.md`, `COMPLETENESS_AUDIT.md`, `README.md`,
`OPEN_QUESTIONS.md`, readable `SOURCE_MAP.md`, and all four section `NOTES.md` files
after the coordinator's task-3-complete message. The research completeness pass
and two corrected findings are understood. Detailed evidence/coverage reconciliation
and original-page reading for newly drafted entries remain future work; this is
not a claim that main has read all 534 evidence records or all 257 original pages.
Source `research-ready`/`held` states do not approve entries or automatically
exclude topics; narrower faithful summaries still need grounded editorial decisions.

After both-books-ready, main read Baby's final handoff, independent audit,
source-order map, complete open questions/held index, and all 56 crosswalk groups'
relationships, interpretations and evidence targets. Three fresh xhigh drafting
agents own baby-specific, toddler-specific and cross-book shared guidance in
disjoint private directories. They record their own original-page reads and source
idea dispositions; their drafts still require distinct independent source/tone review.

The coordinator identified the alternate studies' static production import as an
additional integration issue. Main moved those original components into
`LegacyStudies.jsx`, behind a Vite development-only lazy import, and restricted
their home navigation links to development. The production boundary will be
verified after the reviewed public payload replaces the prototype adapter.

Frozen reader baseline SHA-256:
`11ea0b6dd6c3f9c6d7900915205569c934642491cae7f26625b59c99ff5e3d83`.
Each of its six snapshots separately hashes complete public text/placement and
art/context, including actual asset bytes. Source/evidence metadata is private.
Adding a private qualification cannot repair omitted public meaning or confer
approval. Future illustration changes require supplemental source/tone art-context
review without discarding identical approved prose solely because art changed.

Both reviewers passed the exact language entry's text and art/context. Findings
on the other prototypes concern movement framing/position scope, short-summary
qualifications, reference coverage and the shared toddler alt description. All
revision groups are explicitly held for pilot drafting; the baseline and app copy
remain unchanged. Neither reviewer requires a replacement bitmap. Main verified
both review bindings, all 18 component/projection digests and preserved source/asset
bytes; the exact review-file hashes are in `PROTOTYPE_DISPOSITIONS.md`.

The installed app still uses only the unchanged six local prototypes. No new
ready flags or public review status were added. Do not treat presence in the
local app, this baseline, or foundation notes as final publication approval.

## Validation

Final direct Vite build passed. Representative desktop/phone navigation and
reading checks passed, including Back/Forward and unsupported-age recovery.
Minimal shape/render and digest checks passed; no new test suite. Private review
and evidence markers were absent from the production bundle scan.
The local Vite server is on `http://127.0.0.1:5174/montessori-books/` (session
62210 at this write); reuse it when available. No visible browser was opened
for this delegated handoff. Full details and limitations are in the QA report.

## Required continuation in this same task

1. Preserve the completed narrow reviews and the held issue groups in
   `PROTOTYPE_DISPOSITIONS.md`. Do not rewrite a reviewed revision in place or
   carry its pass onto changed wording.
2. On coordinator's research-ready follow-up, read both complete research
   handoffs, evidence/coverage ledgers and unresolved-question lists. Do not infer
   full-book completion from individual partial files appearing in the folder.
3. Draft complete 6–9 and 18–24 month pilots across all five topics, including
   adult/family content and canonical overlap. Let the source determine depth.
   Reconcile the six prototype findings and retain supported age/readiness context.
4. Obtain two independent fresh xhigh source and spirit/tone reviews for every
   exact new/revised entry and intended age/topic presentation. Resolve revisions
   or hold entries. Review necessary public qualifications and actual illustrations.
5. Only after both pilots pass, finalize the contract and disjoint allocation of
   canonical IDs, owned content paths, cross-age reuse and shared family guidance
   for tasks 5–7. No speculative new entry namespaces or bulk population now.
6. Integrate only reviewed public projections; preserve private evidence/review
   history. Rebuild and briefly check the actual final pilots. Report the final
   ownership contract and remaining artwork obligations to the coordinator.

## Project-specific learnings for the coordinator

Shared learnings intentionally remain untouched under task ownership.

**[2026-09-10] — Montessori prototype migration**
- Observation: The accepted home uses a shorter invitation than the legacy detail
  summary. Both convey public meaning, and the same three entries also power nine
  old layouts with mandatory frames/steps and a single source.
- Action: Keep the short invitation and detail summary separately reviewable;
  migrate the chosen home through an explicit adapter while preserving the old
  studies' input contract until integration intentionally changes it.
- Confidence: high

**[2026-09-10] — Montessori topic-summary qualifications**
- Observation: HomeStudy topic rows display the title and summary without the
  observation cue. The pouring readiness condition and pickup-can-wait boundary
  can disappear there even when present in another reviewed field.
- Action: Inspect each short surface on its own and retain any condition needed
  to preserve its meaning; a complete entry hash alone does not prove every
  rendered summary communicates the necessary context.
- Confidence: high

**[2026-09-10] — Montessori prototype source distinctions**
- Observation: The source review found that Baby's sitting/standing propping
  distinction became a broader every-position rule. Toddler's carry-a-jug
  prerequisite belongs to the handwashing row beside pouring, not pouring itself.
- Action: Keep position-specific wording and row-specific readiness attached to
  their exact sources when revising these prototypes; do not borrow a neighboring
  activity's condition or generalize a limited source rule.
- Confidence: high

**[2026-09-10] — Montessori review identity**
- Observation: An entry-body hash alone misses changes in its opening copy,
  age/topic context, and scene. A metadata-only image hash misses replaced bytes
  at the same WebP path.
- Action: Bind text review to the exact reader projection and placement, and
  use a separate art-context digest with image-byte hashes and the text digest.
  Private evidence updates cannot manufacture public approval.
- Confidence: high

**[2026-09-10] — Montessori routed reading**
- Observation: The original app remounted an age study and scrolled globally on
  every hashchange. Adding topic/entry hashes would therefore discard local
  selection or cause jumps without separating those route transitions.
- Action: Keep opening selection in a stable ID parameter, scroll to top only
  across age/concept changes, and restore focus within topic/entry navigation.
- Confidence: high
