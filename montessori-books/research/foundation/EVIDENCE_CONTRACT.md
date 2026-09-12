# Research and evidence contract

Version 1, 2026-09-10. This is the common research contract for tasks 2 and 3.
It does not choose the app's schema, routes, card count, or final content IDs;
task 4 owns those decisions after both books have been researched.

## Keep four things distinct

1. **Read log:** which original pages and visual material a named reader actually
   examined, and by what method. Extraction alone does not constitute reading.
2. **Section register:** the whole book's ordered structure, including tables,
   appendices, captions, callouts, cross-references, and non-substantive pages.
3. **Idea coverage ledger:** the disposition of each substantive source idea.
4. **Evidence record:** the claims, qualifications, age basis, and precise source
   support available for a later content author. Review of published prose is a
   further record attached to the exact authored revision.

Use readable Markdown and structured JSON/JSONL as useful, with the fields below.
The format can differ between books; meanings and stable identifiers must not.
All durable paraphrases and records belong in each task's owned `research/baby/`
or `research/toddler/`. Raw text, OCR, and rendered pages belong only in ignored
`tmp/`. Never copy a long extract into an evidence file as a substitute for reading.

## Stable identities and source references

Use source IDs `baby-2021` and `toddler-2019` from `SOURCE_MANIFEST.md`.
Recommended research IDs are `baby.ch02.observation` for a section,
`baby.idea.observe-without-judgment` for an idea, and
`baby.ev.observe-without-judgment` for an evidence record (equivalent `toddler.*`
prefix). Once issued, keep IDs stable even when titles or browsing placement change.
Use separate IDs when materially different advice/qualifications need accounting;
avoid splitting every sentence into an artificial new idea.

Each source reference contains:

| Field | Meaning |
| --- | --- |
| `sourceId` | Exact manifest ID, linked to the manifest fingerprint |
| `pdfPages` | Array of one-based inclusive `{start, end}` spans; list discontinuous spans separately |
| `section` | Chapter and subsection heading as printed, allowing normalized whitespace |
| `locator` | Paragraph subject, table row/column, caption, callout, or illustration position |
| `printedPages` | `null` for Baby and unverified/unnumbered Toddler pages; otherwise verified physical-to-printed mapping |
| `printedVerification` | `not-applicable`, `not-yet-verified`, `unnumbered`, or `visually-verified`, with verifier/date/pages for the latter |
| `contextRead` | Adjacent/parent sections and relevant cross-reference pages actually read, not a default padding range |
| `readLogIds` | Durable records showing who read the claim and its necessary context |

All published Toddler printed references must be visually verified. Viewer labels
and the minus-nine offset help find the page; neither alone establishes its printed
folio. A source heading or chapter number is not a page number. Record any missing,
illegible, or apparently broken material explicitly.

## Read log and section register

Each read-log record has `id`, `reader`, `date`, `sourceId`, exact `pdfPages`,
`mode`, and a description of the material examined. Allowed modes:

- `full-text`: the complete text on those pages has been read, including notes;
  complete the visual obligation separately for image text, layout, and tables.
- `visual`: full pages or specified regions inspected; say which, and why.
- `navigation-only`: TOC/index/search snippets/heading scans; this is not research
  coverage and cannot support a claim by itself.

A page can have several modes and readers. A whole-book text cache does not make
every page `full-text`. A visual thumbnail inspection is not a full reading of
small text. Preserve the distinction in the handoff instead of reporting a single
inflated "pages read" count.

Use the coordinator's `tmp/book-text/extraction-qc.json` as a navigation checklist
for sparse-text pages, then inspect those original pages. Empty extraction can
mean an illustration or a table. The checklist is not exhaustive visual QA:
captioned images and tables can also occur on pages with substantial extracted text.

The section register records `id`, source heading and hierarchy, exact page spans,
read state (`unread`, `in-progress`, `read`), read-log IDs, visual obligations and
their resolution, outgoing cross-references, and idea IDs. Non-substantive pages
(cover, blank, publication data, index navigation) can be registered without idea
IDs, with a reason. Index/contents entries point to ideas elsewhere; do not count
them as new substantive advice. A section is fully accounted for only after every
substantive idea has a disposition and every needed visual/cross-reference check
has been resolved.

Full-book research still examines prenatal and later-age sections: record why
their ideas are outside the approved product scope. Do not skip a mixed section
because its title is prenatal; the Baby chapter also contains newborn material.
External resources and bibliography entries are inventoried as references, not
silently imported as third sources. Flag any essential unavailable cross-reference.

## Idea coverage ledger

Each row contains `id`, `sectionIds`, `sourceRefs`, a short `sourceIdea` paraphrase,
`evidenceIds`, proposed topic(s), `disposition`, `reason`, `targetIds`, and unresolved
questions. During research, `disposition: null` with `state: pending` is honest;
it must not survive a completed coverage handoff for a substantive idea.

| Disposition | Required meaning and trace |
| --- | --- |
| `included` | Retained as a distinct content candidate. Link an evidence/candidate ID; this does **not** mean authored, reviewed, or published. Task 4 later maps it to final content IDs. |
| `combined` | Preserved with another idea. Link its surviving idea/candidate ID and name the distinctive detail or qualification carried into it. "Duplicate" without a target is insufficient. |
| `context-only` | Retained to interpret other content, such as the authors' framing, history, or a qualification. Link the principle/evidence/idea it informs and explain why it has no separate reader entry. |
| `excluded` | Outside product scope or unsuitable for inclusion for a specific source-grounded/editorial reason. Preserve its locator and the actual reason; lack of time or a full age band is not a reason. |

Coverage follows **source sections first**. Age/topic synthesis comes afterward.
Repeated statements can combine; materially different conditions cannot disappear.
Tables may need multiple idea rows, and one idea may need several passages. Preserve
row headings, footnotes, dependencies and continuation pages. Do not inherit an age
from the preceding row when the actual row says a skill or "all ages."

Whole-book handoff accounting must show: every physical page registered; every
substantive section read; all visual obligations resolved; every idea given a
reasoned disposition; every included/combined item connected to evidence; all open
interpretive questions explicitly listed. Reading and coverage may be complete
while candidate questions remain unresolved, provided those candidates are held
from publication. Counts describe the work; they never set a content quota.

## Evidence record

An evidence record is a source-based research unit, not polished app copy. Required
fields/sections:

| Field | Content |
| --- | --- |
| `id`, `sourceIdeaIds`, `researcher`, `revision` | Stable identity, coverage trace, author, and revision/hash |
| `claim` | Narrow paraphrase of what the book says; preserve who says it and whether it is an example, belief, observation, or recommendation |
| `sourceRefs` | Precise references using the contract above |
| `qualifications` | Conditions, exceptions, limits, cautions, help-seeking statements, cultural/family context, and adjacent passages needed to avoid distortion |
| `ageBasis` | Book-stated age wording and locator if present; otherwise `not-stated`. Keep readiness/interest wording and its locator separately from editorial browsing bands and placement rationale. |
| `kindCandidates` | `invitation`, `perspective`, and/or `everyday-situation`; no automatic steps |
| `topicCandidates` | Stable topic keys from `TOPICS.md`, with a primary proposal |
| `sharedPrincipleCandidates` | Reuse candidates from the charter or new source-supported ideas; do not write seven variants |
| `sensitivity` | Relevant safety-sensitive subject, the authors' actual position and cautions, and descriptive-only treatment; otherwise `none-identified` |
| `crossReferences` | Other book passages followed, outstanding targets, and whether necessary to interpret the claim |
| `overlapAndTension` | Related ideas within/between books, differences and limits; never silently reconcile them |
| `illustrationImplications` | Source-supported posture/material/action/context if applicable; note what a picture must not imply. `none` is valid. |
| `openQuestions`, `status` | `research-ready` or `held`; unresolved details stay explicit. Neither status means publication-approved. |

Keep factual guidance distinct from an editorial inference about presentation.
For example, Baby PDF p. 294 says activity ages are guidelines; choosing to surface
a supported activity in the 6-9 month browsing band is an editorial decision and
must not become "babies should do this by nine months."

Record safety-sensitive detail even if eventual copy omits it. If omitting it would
change the meaning or imply new instructions, hold the candidate. The source-only
brief is not a claim of independent medical verification. Do not seek, blend, or
invent external advice as a shortcut to resolving a book's ambiguity.

## Later content and independent review

Task 4 defines the concrete content contract using both research handoffs and
reviewed pilots. It must preserve the evidence links while adding stable content
IDs, kind, short action label/summary, observation/context cues, optional detail
and steps, principle, age/readiness rationale, structured references, and
illustration metadata. Evidence and review state remain outside public copy.

Every published entry, including each of the six prototype entries, requires two
fresh **xhigh** reviewers, distinct from the author and from each other:

1. **Source reviewer:** reads the exact source pages and necessary context, checks
   every claim and practical/age/visual detail against them, and checks retained
   qualifications. A citation string or researcher paraphrase alone is insufficient.
2. **Spirit/tone reviewer:** examines the exact proposed entry in its age/topic
   presentation and relevant book framing. Checks respectful agency, usefulness,
   family realities, limits with connection, and freedom from deadlines, shopping
   pressure, performance language, invented reassurance, or added sensitive advice.

Each durable review records reviewer identity/task, reasoning level, date, exact
entry revision/hash, source/context pages read, verdict (`pass`, `revise`, `hold`),
specific issues, and resolutions/re-review references. A changed claim or a changed
meaning/qualification requires affected review to be renewed. Two historical
passes on stale drafts do not approve new copy. Canonical reuse can retain a review
of unchanged shared text, but reviewers must also cover each materially different
age/context presentation and its implications. Unresolved or unreviewed entries
stay unpublished. Research notes and foundation tone examples are not these passes.

## Worked example

`EXAMPLE_RECORDS.json` gives a real, bounded example using Baby PDF p. 294. It is a
contract demonstration and context record, not an app entry, a starter population
set, or a reviewed recommendation. Future researchers issue their own stable IDs
and reconcile this context into their complete section registers.
