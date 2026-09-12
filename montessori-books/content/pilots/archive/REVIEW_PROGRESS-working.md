# Full pilot review progress

The immutable r03 input contains 101 canonical entries and 115 age placements:
30 Baby entries, 56 Toddler entries and 15 shared entries (14 reused at both ages).
This is review input. The app still uses the development prototype adapter until
all required exact passes and issue resolutions are complete.

`REVIEW_BATCHES.json` defines 9 bounded source-unit batches. Each gets a fresh
independent xhigh source reviewer and a distinct fresh xhigh tone reviewer. Original
source/context reading, short and full rendered surfaces, exact age/topic metadata,
and applicable image contexts are recorded per placement. Counts impose no quota.

| Batch | Entries | Source | Tone |
| --- | ---: | --- | --- |
| Baby play/home | 13 | r01 pass; 5 changed entries need renewal | r01: 8 pass, 5 revise; r02 corrections need renewal |
| Baby care | 10 | r01: 9 pass, 1 revise; eating-place r02 correction needs renewal | Fresh r02 review running |
| Baby sleep/connection | 7 | r01: 7 pass | Pending |
| Shared adult/family/principles | 15 / 29 placements | r01 pass; 6 changed entries / 12 placements need renewal | r01: 17 pass, 12 revise; r02 corrections need renewal |
| Toddler play | 13 | Fresh r02 review running | Coordinator's fresh r02 review running |
| Toddler practical/home | 13 | r01: 12 pass, 1 revise; handwashing r02 correction needs renewal | Fresh r02 review running |
| Toddler daily care | 11 | r01: 9 pass, 2 revise; coat and toileting r03 corrections need renewal | Pending, use r03 |
| Toddler limits | 11 | Pending | Coordinator's fresh r02 review running |
| Toddler family/connection | 8 | Pending | Coordinator's fresh r02 review running |

Immutable reports are under `reviews/final/`. Earlier passes remain applicable
only to unchanged components. The two narrow original prototype review files
remain separate history. Root inspected all returned source/tone assessments,
issues and read-log coverage through the six r01 batches listed above.

The coordinator's title-readability observation is included in tone assignments:
keep parent-recognizable subjects visible, and flag specific repeated room-for or
small-part wording across lists without a blanket title rewrite. Actual edits
require immutable revisions and renewed affected reviews.

## Mechanical and visual checks to date

- All 617 Baby and 692 Toddler source ideas resolve to original ledger IDs. Evidence
  IDs, retained content targets, placement pairs and 7 valid private foundation
  context references resolve. The first check's 7 target errors were a checker
  classification error; `revisions/r01/COVERAGE_INTEGRITY_CHECK2.json` preserves
  that correction and the original record.
- `revisions/r02/COVERAGE_RECONCILIATION.jsonl` supplies all 1,309 stage records in
  the four-state contract. The 63 Baby author-held rows retain explicit held details
  and become context-only qualification/omission decisions. No operational content
  is promoted by that normalization. Original author records and hashes remain.
  An explicit r02 amendment moves the removed wall-bar comparison to context-only.
- Actual component static renders exist for 115 placements. The unused Vite SSR
  WebSocket bind is rejected by the sandbox; all renders complete successfully.
  No extra HTTP preview server was started.
- Current Baby movement, corrected Baby conversation and Toddler pouring desktop openings fit the accepted
  layout. The actual frozen pouring detail at 390×844 is readable, with 390px
  content width and no overflow. This is static render QA; final interactive
  runtime/build verification remains due after integration.
- Seven synthetic structural checks of `integrate-reviewed.mjs` passed in an
  isolated ignored fixture workspace. Missing roles, a superseding revise, absent
  image inspection, unresolved source reads and changed renderer each prevent
  output; a complete synthetic package emits only public collections. These
  fabricated fixture records are never editorial review and never enter the app.

Final contract/allocation/registry, exact issue resolutions, approved export and
production bundle checks remain required before task 4's completion handoff.
