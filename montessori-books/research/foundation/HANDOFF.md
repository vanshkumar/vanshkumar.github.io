# Task 1 handoff: editorial foundation

Date: 2026-09-10. Scope: `research/foundation/` only, plus ignored task scratch.
The source investigation and foundation artifacts are complete. Independent
xhigh package QA passed with its sole finding corrected; see
`FOUNDATION_AUDIT.md`. This is bounded foundation work, not
whole-book research, population, or publication approval.

## Artifacts

| File in this directory | What the next task uses it for |
| --- | --- |
| `EDITORIAL_CHARTER.md` | Source-grounded editorial purpose, eight reusable principle candidates, age/family/tone/sensitive-content rules and publication boundary. |
| `SOURCE_MANIFEST.md` | Exact PDF paths, title-page authorship, edition/printing statements, ISBNs, physical counts, file hashes, and separately verified pagination conventions. |
| `TOPICS.md` | Five approved browsing topics with stable research keys, boundaries, overlap decisions, and age/scope rules. |
| `EVIDENCE_CONTRACT.md` | Section register, actual-read log, idea ledger, evidence fields, qualified source references, and the later independent review trail. This does not preempt task 4's app content schema. |
| `EXAMPLE_RECORDS.json` | A real, paragraph-sized context example using Baby PDF p. 294, including a section/register row, read logs, source reference, evidence and coverage disposition. Unpublished; not a population seed. |
| `TONE_EXAMPLES.md` | Eight concise original paraphrases with exact source basis and preserved limits; calibration only. |
| `BABY_SOURCE_NOTES.md` | Fresh xhigh Baby investigation: principles, adult/family realities, tone examples, source tensions, exact text/visual reading and continuation requirements. |
| `TODDLER_SOURCE_NOTES.md` | Equivalent fresh xhigh Toddler investigation with independently checked printed folios and source qualifications. |
| `READ_LOG.md` | Index of exact investigator spans and main's separate text, visual, navigation and metadata work. |
| `FOUNDATION_AUDIT.md` | Fresh independent xhigh package audit, artifact versions, sampled original-source checks, findings/resolutions and limitations. |

All source text is paraphrased in durable notes. Raw text caches and rendered book
pages remain under ignored `tmp/`; no PDF or copied artwork was added to the app.
No app code, assets, shared learnings, plan/status files, other task directories,
parent-site files, commits or publication were changed by this task.

## Source identity and pages actually read

- **Baby:** supplied Workman 2021 eISBN 9781523514069; both Simone Davies and
  Junnifa Uzodike credited on title page; 310 physical PDF pages. Physical page 1
  is blank and cover is page 2. Cite physical PDF pages only. The investigator
  read full extracted text on **3-10, 12-23, 25-38, 40-43, 96-117, 119-128,
  222-231, 234-242, 244-258, 260-264, 310**; main additionally read **294**.
  These spans include explicitly labeled front matter, boundary material and
  out-of-scope context, not a claim that all are included advice.
- **Toddler:** supplied Workman file states first printing February 2019,
  ISBN 978-1-5235-0689-7; 257 physical PDF pages. Numbered-body folios inspected
  agree with physical minus nine, but each new printed citation still needs
  visual verification. Investigator full substantive text: **11-19, 21-30,
  33-41, 82-85, 95-110, 187-200, 203-211, 241-242**, plus front matter **2-4**.
  Main additionally read full text **5, 8, 244-245**, plus overlapping spot checks.

`READ_LOG.md` and the investigator logs give exact visual and navigation-only
spans. The package auditor's reads are recorded separately in its report.
None of these records certifies the remaining pages as read. No whole-book
coverage percentage or completed activity inventory is claimed.

## Instructions for both full-book research tasks

1. Read project `LEARNINGS.md`, `POPULATION_PLAN.md`, this handoff, the charter,
   manifest, evidence contract, topic definitions, and the relevant source notes.
   Read the PDF skill. Work directly in the saved project and preserve its
   uncommitted accepted round 16 state. Baby owns only `research/baby/`; Toddler
   owns only `research/toddler/`. Use disjoint ignored scratch directories.
2. Recheck the supplied PDF against its manifest identity/count/hash. Use original
   pages as authority. The coordinator's `tmp/book-text/*-pages.json` files help
   locate/read text but do not replace visual examination or prove full coverage.
3. Build a complete source-order section register covering every physical page,
   with headings, tables, callouts, captions, appendices and cross-reference
   obligations. Read the entire book, including scope-excluded material for
   accounting. Distinguish substantive reading, visual checks, navigation, and
   non-substantive pages. Do not assign a blank/excluded disposition from empty
   extracted text. Inspect complete units across page boundaries.
4. Record each substantive idea under the evidence contract, preserving the
   authors' viewpoint, readiness/age basis, family conditions, cautions, external
   attribution and unresolved questions. Choose included/combined/context-only/
   excluded dispositions with concrete reasons and targets. No arbitrary record
   quota. Do not turn every principle or family perspective into activity steps.
5. Only after section-level research, map candidate ideas to topics and browsing
   bands. Preserve source ages separately from editorial placement. Propose
   canonical overlap/reuse; keep meaningful differences between books visible.
   A shared principle alone cannot support a new activity, setup or age claim.
6. Describe safety-sensitive passages as the authors' perspective, retain their
   qualifications and precise references, and record ambiguous/unsupported
   practical details as held. No new instructions, clinical verification claim,
   silent external advice, or invented resolution of a source tension.
7. Use bounded fresh xhigh subagents as approved. Keep author and reviewer roles
   traceable. The required pair of independent xhigh source/tone reviews attaches
   to eventual exact reader entries; foundation notes are not those reviews.
   Do not bulk-populate or write app code during book research. Task 4 needs both
   handoffs before architecture and reviewed pilots; the six prototypes also
   require fresh review there.
8. Deliver an owned `HANDOFF.md`, full source/section register, exact read log,
   idea coverage ledger, source-linked evidence records, and unresolved-question/
   overlap list. Recommended names: `SOURCE_MAP.md`, `READ_LOG.md`,
   `COVERAGE_LEDGER.jsonl`, `EVIDENCE.jsonl`, `OPEN_QUESTIONS.md`; readable equivalent
   formats are fine if they preserve the contract. Report project-specific new
   learnings in the owned handoff for the coordinator; do not edit shared files.

At handoff, every substantive idea needs a disposition and traceable evidence or
reason. Unresolved interpretive candidates may remain held while research/coverage
is complete, but unexamined source sections and unresolved visual obligations do
not count as complete research.

## Baby-specific next actions and unresolved source issues

- Begin with the complete original PDF, not only these foundation-selected pages.
  Detailed newborn context, home setup, care/feeding/sleep, activity sections,
  real stories and appendices remain for full investigation. The conception/birth
  chapter also contains newborn material; its chapter title does not justify
  excluding all of it. Keep pregnancy and birth-preparation ideas explicitly out
  of the reader product.
- The coordinator's sparse-extraction list is **1, 2, 11, 23, 39, 175-177, 232,
  259, 276, 282, 295-303**. It is saved in ignored
  `tmp/book-text/extraction-qc.json`. Inspect every listed original page; pages
  **175-177 and 295-303** in particular cannot be researched through the text
  cache alone. Also inspect meaningful visuals on pages with abundant text.
- Preserve complete units: perspective boxes **21-23**; observation **35-37**;
  praise alternatives **101-102**; activity choice **119-120**;
  effort/frustration **121-122**; adult reflection **238-239**; calm ideas
  **239-241**; caregiver choice **253-255**; goodbye **256-257**; visitor note
  **257-258**. The general age-guideline paragraph at **294** is outside the
  preceding table border and applies to the activity list, not that prior row.
- Resolve the book's internal page-number links by actual named destination in
  this reflowed file. Do not copy a linked print-style number into `pdfPages`.
- Explicitly account for the time-limited trust/outcome claims at **96-97** and
  related deterministic language. Do not turn them into age deadlines or silently
  rewrite them as the opposite claim. Keep book assertions, personal experience
  and project editorial exclusions distinguishable.
- Family inclusion at **41 opening paragraph**, developmental support at **119**,
  limits of specialist coverage at **230**, adult help-seeking at **238, 241**,
  and family-contact safety at **247** qualify broader themes. Preserve them
  when those themes are reused.
- Mentions of sleep surfaces, materials, positioning, food and water in the
  foundation pages are not a completed safety-context investigation. Read the
  dedicated sections and related cautions before proposing any practical reuse
  or illustration. Strong science/health assertions and personal calm-list
  suggestions require explicit attribution/disposition, not automatic promotion.

## Toddler-specific next actions and unresolved source issues

- Read the full book, including detailed activities, home examples, cooperation/
  limits, daily care, changes, useful skills, home tours and all appendix tables.
  Foundation coverage of the adult and family chapters is an orientation aid,
  not a waiver of full research and idea accounting.
- The coordinator's sparse-extraction list is **1, 4, 9, 32, 59, 61, 63, 65, 67,
  74, 87, 94, 116, 144, 186, 202, 231, 244**. Inspect the originals. The full-page
  apron/rolling-pin illustration at **202** contains no extracted text; it is
  not blank. Activity-image pages also need visual reading.
- Verify printed folios on every cited page instead of extending the sampled
  minus-nine pattern unquestioningly. Unnumbered openers can use PDF locators and
  headings. Keep table rows and table-level conditions together, including the
  timing qualification on **26 / printed 17**, activity-age framing on
  **33 / printed 24**, and the material/supervision context on **39 / printed 30**.
- Inspect appendix row labels as written. On **245 / printed 236**, the table
  mixes all-ages rows, numerical ages, and a standing-readiness label; its
  self-expression row also qualifies eye contact by cultural appropriateness.
  Neither ages nor caveats may be copied from an adjacent row. This foundation
  spot check is not full appendix research.
- Keep the complete separation discussion **210-211 / printed 201-202**, including
  child-safety/contact exceptions. The adult pause discussion at **194 / printed
  185** has an immediate-danger exception; adult self-care at **188 / printed
  179** includes medical help-seeking. Do not detach those qualifications.
- A generic small-space example mentions high beds at **85 / printed 76** without
  a toddler-specific qualification. Foundation has not authorized turning it into
  birth-to-three sleep guidance or artwork. Hold the concrete proposal for full
  source/context review rather than relying on the home-organization theme.
- The author defines toddler approximately as one to three (**14 / printed 5**).
  "All ages" within this book is not blanket newborn suitability. Material
  beyond age three must receive a reasoned scope/context disposition.

## Validation and review state

- Two fresh independent source investigations ran at xhigh, each authoring only
  its owned foundation note. Main assembled the common contract and charter.
- A third fresh xhigh agent audited the foundation package and selected original
  source pages. Verdict: pass for tasks 2 and 3, with no unresolved findings.
  Its one correction clarified that Baby physical page 1 is blank and the cover
  is page 2; all physical citation locators and counts were already correct.
  The exact checked versions and source sample are in `FOUNDATION_AUDIT.md`.
- Required independent **publication** source reviews: none completed.
  Required independent **publication** tone reviews: none completed.
  No publishable entries were authored, so this is an explicit downstream gate,
  not unfinished population within task 1.
- Final mechanical checks passed for JSON parse/reference integrity, source
  hashes/bytes/page counts, artifact presence, named local references, Markdown
  whitespace and ignored scratch. File status and authored paths confirm scope.
  App builds/browser checks are not required for this documentation-only task.

## Project-specific learnings for the coordinator

Shared `LEARNINGS.md` was intentionally not edited under task ownership. These are
new candidates, not restatements of the existing printed/PDF pagination learning.

**[2026-09-10] — Montessori source identity**
- Observation: Baby's PDF metadata lists only Simone Davies and a 2026 calibre
  creation date, while its title/copyright pages credit Davies and Junnifa Uzodike
  and identify the 2021 publication.
- Action: Use the supplied title and copyright pages for authorship/edition;
  keep converter metadata out of bibliographic attribution.
- Confidence: high

**[2026-09-10] — Montessori source extraction**
- Observation: Empty/sparse extraction can conceal meaningful pages: Toddler PDF
  202 is a full-page illustration, and Baby 175-177 and 295-303 are flagged as
  sparse by the coordinator's quality check and still require visual research.
- Action: Use `tmp/book-text/extraction-qc.json` to trigger original-page checks,
  and inspect visual material on other pages too; never equate no text with blank.
- Confidence: high

**[2026-09-10] — Montessori source continuity**
- Observation: Baby's observation checklist spans PDF 35-37 and caregiver-choice
  discussion spans 253-255; Toddler's separation discussion spans PDF 210-211,
  with its safety exception on the first page and further family context on the
  second. Short extracts can omit material conditions.
- Action: Record and review complete list/paragraph/table units, not only the
  page containing the appealing line; retain separate claim and context spans.
- Confidence: high

**[2026-09-10] — Montessori age evidence**
- Observation: Toddler's activity-age qualification is at PDF 33 / printed 24 and
  its sensitive-period caveat sits above the table at PDF 26 / printed 17; Baby
  repeats its activity-age qualification at PDF 119 and the appendix opening at
  PDF 294.
- Action: Attach those broader qualifications to later row/activity evidence,
  while recording source age, readiness and editorial browsing placement separately.
- Confidence: high

## Immediate next action

The coordinator can now start task 2 (Baby source research)
and task 3 (Toddler source research) concurrently in the saved project with their
disjoint ownership above. No further foundation decision or user approval is
needed before those already approved tasks begin.
