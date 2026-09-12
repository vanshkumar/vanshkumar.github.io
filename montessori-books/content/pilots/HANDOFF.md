# Task 4 final handoff

2026-09-10 — **Complete. Both r08 pilots passed exact independent source and tone
review, integration, production build and browser checks.** The app now imports
`src/guide/approved.json`. The coordinator can start Tasks 5–7 from this frozen
registry and allocation. This handoff is local; nothing has been committed or
deployed, and the other five age bands are not represented as complete.

## Reviewed content

| Pilot | Canonical entries available at age | Ordered openings | Topics |
| --- | ---: | ---: | ---: |
| 6–9 months | 45 | 3 | 5 |
| 18–24 months | 70 | 3 | 5 |

There are 101 unique canonical entries: 30 Baby, 56 Toddler and 15 shared.
Fourteen shared entries appear at both ages; caregiver choice appears at 6–9.
The 115 placements reuse canonical bodies across age/topic views. Content kinds
are 31 invitations, 48 perspectives and 22 everyday situations. Counts result
from full source consideration and editorial combination, not a reduced quota.

All 115 current text placements have distinct independent xhigh source and tone
passes, obtained in bounded related-source batches. Both roles personally read
original cited pages and complete relevant units/continuations, with actual
original-page visual reads for meaningful tables and illustrations. Each of the
six illustrated opening combinations also has separate source and tone art
passes bound to the actual existing image bytes and current text. Forty immutable
reports record the initial reviews and required renewals. The editor did not
approve its own corrections.

`revisions/r08/ISSUE_DISPOSITIONS.json` links all 64 historical prototype/pilot
findings to exact approved replacements; zero remain open. Earlier findings,
author read logs, drafts and reports remain intact. The final revisions preserve
source qualifications, distinguish actual source ages from browse ages, name
subjects clearly, and use original source subsection headings in references.

## Final artifacts

| Artifact | Use |
| --- | --- |
| `CONTRACT.md` | Final public/private format, reference/age semantics, exact review and runtime rules |
| `CANONICAL_REGISTRY.json` | One immutable authoring record per canonical ID, public digest/pointer, provenance, source ideas and exact placement approvals |
| `POPULATION_ALLOCATION.md` | Final disjoint canonical and placement ownership for Tasks 5–7 |
| `CONTRIBUTION_WORKFLOW.md` | Executable owned freeze/render/verify commands, input examples and final-art boundary |
| `revisions/r08/MANIFEST.json` and `payload.json` | Explicit immutable drafts, renderer fingerprints and frozen public records |
| `revisions/r08/REVIEW_INPUTS.json` | All 40 applicable report paths and hashes, in chronological application order |
| `revisions/r08/RENDERED_SURFACES.json` | Actual HomeStudy opening, topic-row and full-entry review text |
| `revisions/r08/INTEGRATION_RECEIPT.json` | Both exact current role approvals for all text/art components |
| `revisions/r08/COVERAGE_RECONCILIATION.jsonl` and `COVERAGE_RECEIPT.json` | Complete stage-level source-idea accounting with original traceability |
| `APPROVED_RELEASE.json` | Public payload, integration receipt and actual asset byte identities |
| `VALIDATION.json` | Gate, research integrity, helper checks, emitted production files and actual browser observations |
| `CONTRACT_HISTORY.json` and `archive/` | Exact pre-release contract mapping and preserved working handoffs |

The final authored inputs are Baby `drafts/baby/draft-r05.json`, Toddler
`drafts/toddler/draft-r07.json`, shared `drafts/shared/draft-r02.json` and
`drafts/scenes-r01.json`. The manifest records their exact hashes. All pilot
citations use physical PDF pages; no unverified printed folios are introduced.

## Source accounting

Both complete final research ledgers were inputs: Baby 310 pages / 617 ideas /
531 evidence records, Toddler 257 pages / 692 ideas / 534 evidence records.
All 74 frozen research package files including the two independent audits still
match the recorded hashes in `RESEARCH_INPUTS.json`.

The reconciled pilot ledger has exactly 1,309 original idea IDs. Shared author
coverage overlaps 153 of those IDs and adds no invented source rows.

| Source | Included | Combined | Context-only | Excluded |
| --- | ---: | ---: | ---: | ---: |
| Baby | 91 | 48 | 294 | 184 |
| Toddler | 0 | 330 | 245 | 117 |

Every disposition retains the concrete reason and target/context trace. The 63
original Baby held rows remain traceable as context-only records with held
practical details, not implied approvals. The explicit r02 amendment preserves
the omitted wall-bar comparison as private context. These are pilot-age
accounting decisions, not product-wide exclusions; later tasks must cover their
actual source-supported ages and return source/age coverage. Research holds
neither publish an entry nor automatically exclude a whole topic. Exact review
may support a narrower attributed perspective while a practical detail stays held.

## Independent population work

Tasks 5–7 read the same immutable registry. Task 5 owns new `early-*` content and
birth–6 primary ages; Task 6 owns new `infant-*` content and 6–18 primary ages;
Task 7 owns new `later-*` plus additional general `family-*` content and 18–36
primary ages. A new canonical owner supplies all supported age placements for
its new ID. Additional placements of frozen pilot IDs belong to the primary age
owner. Existing entry/age pairs and canonical bodies are immutable inputs.

This separates files and ownership without requiring another task's mutable
draft. A named allocation to another owner remains outstanding coverage until
a concrete reviewed target exists. Primary age owners choose three openings
from frozen IDs or their own new entries; other cross-age contributions omit
openingOrder. Task 8 resolves any later opening promotion and exact art context.

The helpers `prepare-contribution.mjs`, `render-contribution.mjs` and
`verify-contribution.mjs` write only inside the contributor's owned directory.
They resolve canonical references, freeze new text/placement snapshots, render
actual opening and reading text without displaying any placeholder image, and
verify distinct exact source/tone passes. The resulting receipt is private with
`publication: false`; artwork and composition remain pending Task 8. Thus an age
task can review real opening text without editing the app or waiting for artwork.
No contributor changes public exports, shared indexes, research or shared memory.

## Runtime and validation

The accepted round-16 composition is preserved. The seven stable age IDs end in
`24-36` / “2–3 years”; each pilot has three openings followed by five topics.
Entry kinds support optional steps, concrete body paragraphs, age context and
structured book references. Unknown age/topic/entry combinations recover clearly.
Back/Forward restores the hash state and reading/topic focus.

Production build passed: 34 modules, one JS and one CSS asset, plus exactly the
two unchanged reviewed WebP scenes. The build rejects legacy/prototype/private
content modules and validates release/asset hashes. Nine alternate studies and
`src/content.js` remain development references only. No research file, source
PDF or unused artwork is emitted. Eight isolated integration checks and ten
contribution checks passed; synthetic fixture verdicts never enter real content.

Production browser checks at 1280×720 and 390×844 covered both age openings,
long title wrapping, topic browsing, invitation/perspective detail and references,
Back/Forward and restored focus, unsupported/invalid routes, the unfinished
2–3-year state and production study-route recovery. Measured document widths
matched viewport widths; displayed images loaded, and captured console warning/
error logs were empty. Temporary viewport overrides were reset.

Local production preview: `http://127.0.0.1:4174/montessori-books/`.
The prior development server remains on 5174. Task 4 generated no new artwork
and modified no original PDF or image bytes. Current two-scene passes do not
approve future new-age scenes or unrelated illustration combinations. The final
integrator still owns artwork, complete seven-age reconciliation and deployment.

## Learning candidates for the coordinator

Shared `LEARNINGS.md` is coordinator-owned and was not edited here. Its current
reader-reference and source-variant entries already cover several pilot lessons.
The following specific additions remain useful if not captured elsewhere:

**[2026-09-10] — Pilot source-age separation**
- Observation: Toddler PDF 71 discusses unaged home play, while PDF 103–104 places its separate pretend-play discussion around 2½ and later; combining them under 18–24 implied an earlier expectation.
- Action: Keep the home-play subject separate from the later creativity context in titles, cues, references and public age notes.
- Confidence: high

**[2026-09-10] — Pilot contribution review surfaces**
- Observation: HomeStudy opening navigation displays neighboring action labels; an individual entry digest alone cannot detect a changed neighboring label in the same rendered opening.
- Action: Retain actual rendered-surface equality checks alongside component hashes when carrying earlier pilot or contribution approvals forward.
- Confidence: high
