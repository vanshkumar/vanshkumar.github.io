# Independent foundation package audit

Date: 2026-09-10. Auditor: `/root/foundation_audit`, independent xhigh audit of
task 1. The auditor authored none of the reviewed foundation documents. This
audit's only durable output is this file; scratch work was confined to ignored
`tmp/pdfs/foundation-audit/` and removed after the checks.

**Verdict: pass for handoff to source-research tasks 2 and 3.** One pagination
description defect was found, corrected by the foundation author, and rechecked.
No unresolved blocking defect was found in the checked revisions and source
sample. This verdict is bounded package QA, not a whole-book coverage finding,
clinical verification, or either of the two independent reviews required for an
eventual published entry. No entry is approved for publication by this audit.

## Scope and revisions checked

The six requested foundation artifacts were read in full against
`POPULATION_PLAN.md`. Both source-note files were read in full as investigation
context. `READ_LOG.md` was subsequently read to check that its consolidated
account distinguishes readers, extraction, navigation, and visual inspection.
The final `HANDOFF.md` was read in full and checked against those documents and
the audit outcome.
The project and parent-repository `LEARNINGS.md` files and the PDF skill were
also read. The source PDFs below were accessed directly, without substituting
another edition or a web summary.

Repository HEAD during this audit:
`45450605722613da80632e34b70f406bf45f46f8`. These are working-tree artifacts,
untracked at the time of review, so HEAD alone does not identify the reviewed
text. The SHA-256 values below identify the exact checked revisions. Paths in
this table are relative to `montessori-books/`.

| Artifact | SHA-256 of checked revision |
| --- | --- |
| `POPULATION_PLAN.md` | `c1b656278ff5f79f305821d51af0f199f9527b1dc221a2bba2bcf6e82e5d9508` |
| `LEARNINGS.md` | `30ef878a61809078ea3700ec34512ccadabd233e09d25920e85cd446a16ac3a1` |
| `research/foundation/EDITORIAL_CHARTER.md` | `cea3328203303cd9b6460a3959832d92865c8f26eb8dcdafe72a0ecbc8a6ee08` |
| `research/foundation/SOURCE_MANIFEST.md` | `f065d7a3378d62143c682807681a12b3cd30906225d35bda73c7f49e02a9fab6` |
| `research/foundation/EVIDENCE_CONTRACT.md` | `62f9e1f60740b33899cb4929b10e0cadcfde33deaed0effc93b0f8d2a41bc464` |
| `research/foundation/EXAMPLE_RECORDS.json` | `7dd0545c27bb91d9f09f1e11a2c9aeb6a2f05db94096e355c410f8dbc7f8d77d` |
| `research/foundation/TOPICS.md` | `e00f06102ebe700afbe9742af081b8af258105e90d8b8f03c228a1124849f9a8` |
| `research/foundation/TONE_EXAMPLES.md` | `a438aa1429a71f2fc9724f3d5fb29b3407635ba14e0cae1fa842818c253107d0` |
| `research/foundation/BABY_SOURCE_NOTES.md` | `73ba504e45b4c2230e3c6d83a54ef593e9880d357334cfcea18f38b7a6f8ac11` |
| `research/foundation/TODDLER_SOURCE_NOTES.md` | `3ff4c931d3065cab6baac6db42062502993003121c4147852be14663d2eae08a` |
| `research/foundation/READ_LOG.md` | `7fd3478f44364da211171d3677fd2352841462fe6dea5fc893cb3e76a123facf` |
| `research/foundation/HANDOFF.md` | `786da351c5ef1fa53efa754ab30b011a470b6e9a5c7327a73cfb4e2826a15155` |

The initial source manifest had hash
`f3dffea888dae4ccd31998f0186347d26f9dd800940fc0913120233927b297b4`;
finding F1 below applies to that revision and is resolved in the table's revision.
The evidence contract and JSON example were reread after the author added,
respectively, sparse-extraction guidance and a bounded section-register example.

`HANDOFF.md` was initially being written concurrently. After the author finalized
it, the auditor reread the entire file and verified the hash above. Its completed
QA status, separate zero-publication-review counts, source-research instructions
and remaining obligations are consistent with this audit and the approved plan.
All ten reviewed foundation artifacts were then rehashed; the table records those
final frozen revisions. Shared files are not assumed frozen: the coordinator's
concurrent `LEARNINGS.md` update was also read in full. Its population-scope and
accepted-round-16 entries align with the plan and charter.

## Direct source verification

`pypdf.PdfReader` reopened the original files to recompute size, SHA-256, physical
page count, all page dimensions, metadata, and `/PageLabels`. Complete selected
page text was extracted directly from those files and read. Poppler rendered the
listed original pages to PNG at a 1,200-pixel maximum dimension; the auditor
inspected the full rendered pages, including the relevant headings, tables,
qualifications, continuation boundaries, and visible folios. No cached extraction
was used as the authority for these source checks.

| Source | Independently verified file identity |
| --- | --- |
| `baby-2021` | `the-montessori-baby-a-parents-guide-to-nurturing-your-baby-with-love-respect-and-understanding-9781523514069.pdf`; 310 pages; 10,117,663 bytes; SHA-256 `517a095024dff9cc43d72fd2ba60516bc50ee6aba686ee8277d0e695b785f04f` |
| `toddler-2019` | `The Montessori Toddler - Simone Davies _Worldfreebooks.com_.pdf`; 257 pages; 7,036,292 bytes; SHA-256 `d4d66faa1169ae6c3623a4adaa23f611cb94c67625932b5dc53db48ffe91864b` |

All page numbers in the following read log are **one-based physical PDF pages**.
Reading a complete extracted page does not mean that every section beginning or
ending on that page was read to completion. The source-verification results below
identify which bounded claims were evaluated.

| Source / mode | Exact pages actually read or inspected | Purpose and limit |
| --- | --- | --- |
| Baby / complete extracted page text | 3, 18-21, 41, 96-97, 119-120, 238-242, 247, 249-251, 294, 310 | Identity; collaboration, materials and author influences; mixed prenatal/family boundary; deterministic trust claims; activity-age qualification and selection; adult reflection, personal-practice framing, help-seeking and imperfection; caregiver communication and contact exception; appendix opening. Relevant claims only, not coverage dispositions for every idea on these pages. |
| Baby / full-page visual | 1-3, 119, 238-239, 247, 294, 310 | Blank first page, image cover and title; age paragraph and split selection box; adult chapter boxes/continuation; family safety exception; appendix border and headings; copyright identity. |
| Toddler / complete extracted page text | 2-3, 11, 14, 17, 19, 26, 29, 33-35, 99-102, 105-106, 187-189, 192, 194-195, 198, 203, 207-211, 245 | Identity; approximate toddler scope and author framing; table-level and activity-level age qualifications; partial participation, practical constraints and help; observation; adult help/repair; diverse families, caregiver differences and full separation discussion; appendix row structure. The activity appendix is not researched in full. |
| Toddler / structural/navigation text | 10, 257 | Complete opener and index extraction inspected for structural checks; this is not new substantive coverage. Page 1 returned no extracted text; no conclusion about its visual content was inferred from that result. |
| Toddler / full-page visual | 2-3, 10, 26, 33-35, 187-189, 198, 207-211, 245, 257 | Identity, opener versus folio, sensitive-period table, activity caveat and partial-participation continuation, adult framing/support/repair, full family-contact context, appendix rows and last index folio. |

Visible Toddler folios independently checked in those renders:
26 -> 17; 33-35 -> 24-26; 187-189 -> 178-180; 198 -> 189;
207-211 -> 198-202; 245 -> 236; 257 -> 248.
Physical page 10 has the large chapter number 1 and no small printed folio.
The title and copyright pages have no visible Roman folios in the inspected
renders. Viewer labels were separately checked as `Cover`, `i-viii`, and `1-248`;
they were not used to claim visual verification of additional printed references.

## Findings and disposition

Severity: P1 means a blocking fidelity or contract defect; P2 means a concrete
error requiring correction; P3 means a minor clarity issue. Only actual defects
are listed as findings; expected later work is listed separately.

### F1 - P2 - Baby physical-page origin described incorrectly - resolved

The initial `SOURCE_MANIFEST.md` said the Baby file's 310 pages were counted from
the cover as page 1. The actual first physical page is visually blank, the image
cover is page 2, and the text title page is page 3. Following the former wording
could have led a later researcher to shift otherwise correct physical locators.

The author corrected the statement to count from the first physical PDF page,
explicitly including blank/image pages and naming the cover as page 2. The auditor
visually verified pages 1-3 and reread the corrected manifest. No page references,
file fingerprints, or counts needed changing. **Resolved in the checked revision.**

No P1 or unresolved P2/P3 finding remains in this bounded audit.

## Passed checks and evidence

| Check | Result and basis |
| --- | --- |
| Source identity and pagination | Pass after F1. Baby title page 3 credits both Davies and Uzodike; copyright page 310 supports 2021 and the stated eISBN, with no numbered printing statement. Toddler pages 2-3 support the author, illustrator, ISBN and February 2019 first-printing statement. Counts, sizes, hashes, metadata/dimensions and viewer-label description match the original files. The prohibition on inventing Baby printed-page offsets is appropriate. |
| Baby age qualification and worked example | Pass. Page 119 explicitly rejects accelerating/slowing individual development and retains support-seeking for concerns. Page 294 places the general guideline below the preceding table and before the first activity-age heading. The example's claim, locator, context-only disposition and empty editorial-age allocation match that bounded paragraph. It does not borrow the preceding climbing instruction or approve a particular activity. |
| Toddler age qualification and participation | Pass. Page 33 / printed 24 directly qualifies activity ages and relates selection to interest and difficulty. Page 26 / printed 17 places individual timing above the sensitive-period table. Pages 34-35 / printed 25-26 support repetition of a small part, with help available when the child struggles. The charter and tone examples preserve these distinctions without requiring a completed sequence. |
| Adult framing, practical limits and repair | Pass for the sampled claims. Baby 238-239 supports nonjudgmental self-reflection and help-seeking; 239-241 identifies the calm list as the authors' personal suggestions; 241-242 rejects perfection. Toddler 187-189 / printed 178-180 explicitly limits the universality of the author's practices and includes outside help; 198 / printed 189 supports apology and considering a different response. Toddler 99-102 supports slower/messier participation, real time limits and helping this time. Tone examples do not promise a calm child or treat adult needs as merely decorative reassurance. |
| Family boundaries | Pass. Baby 41's opening paragraph supports varied family arrangements despite its location in the prenatal chapter. Baby 247 expressly qualifies contact with both parents by child safety. Toddler 203 and 207-209 support varied families, shared priorities and different caregiver relationships. The separation section spans 210-211 / printed 201-202; its psychological/physical contact exception and safety priority precede the continuation about stability, honest explanation and keeping adult conflict off the child. The foundation preserves that context. |
| Source tensions and attribution | Pass for sampled examples. Baby 96-97 really does contain the time-limited trust and broad outcome claims flagged by the charter. Baby 241 includes the frequency-music claim flagged in the notes. These are identified as source assertions for later disposition, not laundered into validated facts. Baby 20-21 and Toddler 19/195 support distinguishing the authors' synthesis and other influences from direct Maria Montessori statements. |
| Coverage and research contract | Pass. Read log, section register, idea disposition and evidence are distinct. All four dispositions have meaningful targets/reasons; pending substantive coverage cannot masquerade as a completed handoff. Whole-book accounting includes mixed/out-of-scope sections, tables, captions, continuations, and cross-references. Source age wording, readiness and editorial placement remain separate. The added sparse-extraction warning explicitly avoids treating its checklist as exhaustive visual QA. |
| Example integrity | Pass. JSON parses. The added section example resolves the referenced section ID and clearly limits `readState: read` to the opening paragraph. The section, read logs, source reference, idea, evidence and charter-principle target can be followed. `research-ready` is explicitly not publication approval, and publication review fields remain null. This is a single-context demonstration, not a final application schema. |
| Independent review contract | Pass. Each published entry, including the six prototypes, requires two fresh xhigh reviewers distinct from its author and each other. The source reviewer must read original cited pages/context; the tone reviewer checks the presented entry and relevant framing. Durable identity, exact revision, pages, verdict, issues and resolution/re-review are required. Changed meanings and materially different age presentations cannot inherit stale passes. |
| Approved scope and task boundaries | Pass. Birth through three, seven editorial browsing bands, five approved topics, the adult/family experience, no content quota, canonical reuse, optional steps, and descriptive treatment of sensitive material match the plan. Task 4 retains the final app-contract responsibility. The foundation's lack of completed whole-book ledgers and publication reviews is explicit and appropriate to task 1. |

## Limits and next action

This was selective source verification, not a recheck of every citation or every
claim in both investigator notes. No full care procedure, clinical assertion,
image-based activity appendix, newborn setup, or final artwork was approved.
Several inspected pages contain claims beyond the narrow purposes listed above;
their presence in this log is not an inclusion decision or endorsement. External
references were not fetched, and the books' empirical claims were not independently
validated. No app code, public asset, PDF, shared plan, or shared learning file was
edited by this auditor; no build or browser test was warranted for this audit file.

The publication-review count remains **zero**. A source check in this audit is not
a transferable source-review pass for future prose. Reviewers must assess the
actual final entry and its age/context presentation against the required source
pages, even when the foundation already cites them.

Tasks 2 and 3 can proceed with the checked charter/contract: register their whole
books, read by section, inspect visual material and continuations, resolve
cross-references, and account for each substantive idea. They must supply the
complete source evidence and explicit held questions needed by task 4. No new
unresolved prerequisite for starting that research was identified here.
