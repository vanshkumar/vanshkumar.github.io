# Adult/family research notes and handoff

Date: 2026-09-10. Researcher: `/root/adult_family`, xhigh, task 3 subtask.
Owned output is confined to `research/toddler/adult-family/`; scratch is confined to
ignored `tmp/toddler-research/adult-family/`. No app, public asset, original PDF,
shared learning file, parent-site file or commit was changed.

The assigned research is complete. All physical PDF pages **187-243** were
examined, all substantive ideas were given a disposition, and all necessary
internal references were followed. This is research, not authored reader copy or
publication approval. Source reviews completed: **0**. Tone reviews completed:
**0**. Both remain required against later exact reader entries.

## What is here

- `SOURCE_MAP.jsonl`: 52 source-order sections, including all chapter openers,
  decorative image pages, home-tour photos, dense tables and continuation pages.
- `READ_LOG.jsonl`: 39 exact reading records, distinguishing complete extracted
  text, full-page visual inspection, enlarged visual details and navigation.
- `COVERAGE_LEDGER.jsonl`: 100 source ideas: 24 included candidates, 31 combined,
  38 context-only and 7 excluded. These counts describe coverage, not a quota.
- `EVIDENCE.jsonl`: 100 linked records with source qualifications, age/readiness
  distinctions, candidate use, sensitive details, original-source locators and
  individual revision hashes. Nine records hold unresolved practical or empirical
  applications; the source passages themselves are fully read/accounted.
- `RESOURCE_INVENTORY.jsonl`: 38 bibliography/resource entries plus 12 material
  sourcing entries. These inventory the book's references and channels; no
  third-source contents, current availability or product approval were imported.
- `VALIDATION.json`: mechanical integrity, source identity and artifact hashes.

## Source and actual reading

The original supplied Toddler PDF has 257 physical pages, 7,036,292 bytes and
SHA-256 `d4d66faa1169ae6c3623a4adaa23f611cb94c67625932b5dc53db48ffe91864b`,
matching the foundation manifest. Every assigned cached page's text was compared
with fresh `pypdf` extraction from that original file: no mismatch. The original
PDF was rendered with Poppler; images did not come from a different edition.

All citations deliberately use physical PDF pages with `printedPages: null`.
Although folios are visible in many images, this handoff does not certify a
printed-page mapping. No offset was used to invent a printed citation.

Assigned complete text reads were performed in bounded outputs for 187-194,
195-203, 204-211, 212-220, 221-230, 231-237 and 238-243. The outputs were not
truncated. Within those spans, 201, 212, 220 and 232 are navigation/openers;
202 and 231 have no extracted body text and were positively identified as
illustrations. The other 51 assigned pages contain substantive body text or
reference material. The empty extraction was never treated as a blank page.

Every assigned original page was inspected in a full-page 2x2 contact sheet,
with each page about 640x906 pixels. This resolved full-page layout, illustration,
photo, sidebar and continuation obligations in conjunction with complete text
reading; it is not a claim to have read microscopic text from a thumbnail.
Dense pages 217, 233, 234, 241, 242 and 243 were separately inspected at a
1300-pixel maximum dimension. Classroom tour 226 was also enlarged to distinguish
a circular opening in a wooden furnishing from an unsupported identification of
its purpose. All four photographs on each of the six tours are inventoried.

Additional complete text reads for context were: 14, 22-23, 33-35, 39, 53,
82-85, 95-113, 117-127, 132-139 and 165-171. Original pages 22, 106, 121 and
138 were separately visually inspected at 1300 pixels. These are supporting
reads, not primary coverage claims over peers' sections. Navigation-only reads
at 185-186 established the adult-chapter boundary; the parent's separate visual
record accounts for illustration 186.

Important exact log IDs:

- `toddler.family.read.text.187-194`: adult nonperfection, medical help,
  differences/support, personal rituals, observation and immediate-danger pause
  exception.
- `toddler.family.read.text.195-203`: guide, home helper, choices, repair,
  self-awareness, chapter transition and family forms.
- `toddler.family.read.text.204-211`: complete family discussion, including the
  full two-page contact/safety context at 210-211.
- `toddler.family.read.text.238-243`: school continuation, contributed tables
  and recipe; `toddler.family.read.visual.243-detail` verifies all recipe details.
- `toddler.family.read.context.cooperation` and
  `toddler.family.read.context.limits-siblings`: source context for the compressed
  alternative-phrase table.
- `toddler.family.read.context.additional`: toddler definition, clay link,
  feedback, notes and public-place sharing exception.

## Candidate distinctions worth preserving

Adult needs have substantive evidence: physical support and doctor help when
feeling depressed (188), learning about differences and seeking support (189),
self-awareness and legitimate limits (199-200), and family needs (204-206).
The rituals are Davies's examples and include the alternative of a morning
ritual with children. They are not mandatory schedules or ways to earn a calm
child. The opening at 187 explicitly says her practices may not fit every family.

The ordinary pause at 194 explicitly excludes immediate danger. It also contains
slower demonstrations and processing time, which should not become a rigid
countdown before responding. The guide at 195 remains available to help.

The entire separation section is 210-211. Both-parent involvement is expressly
conditional on no psychological or physical reason against contact; child safety
comes first. Stability, honest age-appropriate updates, adult support and keeping
adult conflict off the child must retain that context. The ordinary active
listening exercise at 209-210 is not a universal reconciliation requirement.

The six home/classroom accounts at 221-226 are family-specific testimony and
photographic context. No ages, care procedures, hazard approvals or furnishings
are inferred from photos. The Canadian interviewee's claim that no other
pedagogy centers peace is separately excluded, so it cannot travel unnoticed with
otherwise useful family context.

School preparation, school selection and school-day descriptions are retained as
context. Later planes, school transfer and wider educational advocacy are not
repurposed into toddler activities or early achievement requirements. The source
age distinctions in 214-217 remain distinct from the seven editorial bands.

## Explicit holds and tensions

| Evidence ID suffix (`toddler.family.ev.`) | Why held / downstream action |
| --- | --- |
| `planes-neuroscience` | The book's brain-research corroboration claim is excluded, not established by the supplied passage. Do not publish as scientific validation of Montessori planes. |
| `early-personality` | The broad early-years-to-adult-personality assertion is excluded rather than turned into an irreversible parenting deadline. |
| `table-sign` | The oven sign example at 234/127 cannot become a protective safety measure. Adult intervention for danger at 133/194 remains essential. Generic communication use can be reviewed separately. |
| `table-amends` | The table compresses a calm-place example without its age context: prose 136 says around 3; chart 138 says over 3. Keep that detail out of an unqualified toddler invitation. Calm-then-supported-amends remains separately sourced in the care package. |
| `table-kind-limit` | The apple-to-bite alternative at 234/133 lacks food-form/readiness detail. Keep it descriptive or omit/hold the concrete food suggestion; protective limit-setting has independent support. |
| `table-sibling-responsibility` | Shared responsibility in a bathroom-absence example at 234/113 must not become sibling supervision of an infant or toddler. Preserve the main prose's age-appropriate qualifier. |
| `materials-glass` | Author preference and named glassware are not universal safety certification; retain breakability/material context in any later summary. |
| `materials-furniture` | Appendix 236 gives 47in/120cm length, 12in/30cm depth and 16in/40cm height; the core researcher found different imperial values in main text 76. Do not silently combine them into one specification. |
| `playdough-storage` | The book states up to six months sealed without refrigeration, but supplies no conditions/testing. Do not convert this into a verified safe-storage promise. |

The feelings/needs tables at 241-242 are credited to Yoram Mosenzon. Their use is
reflection and nonblaming communication, not a diagnostic tool. The final note
about blame-implying feeling words must not become denial that a harmful event
occurred. Doctor help for depression remains explicit elsewhere in this chapter.

## Peer links and immediate next action

The alternative-language table's 24 research units target existing core/care
records rather than inventing 24 new app entries. This includes actual care IDs
`sharing-turns`, `picture-checklist`, `bounded-choices`, `concise-information`,
`written-note`, `make-amends`, `biting-alternative`, `sibling-conflict` and
`sibling-individual`. The public-place exception at 171 qualifies ordinary
turn-taking; neutrality in sibling arguments retains protective intervention.
All external evidence targets were mechanically resolved against the durable
core, care and activity packages before this handoff.

Recipe IDs are `toddler.family.ev.playdough-method`, `playdough-regular`,
`playdough-chocolate` and `playdough-storage`. The method targets
`toddler.activities.ev.clay` and follows the actual arts-and-crafts pointer at 53.
The explicit adult-only boiling-water step and cool-enough child kneading are
inseparable from any recipe description. The two variants' exact ingredients are
in structured source details; neither is described as edible. The activities
researcher received these record and read-log IDs directly.

Parent task can assemble this package and run fresh independent research QA.
Later task 4 can choose canonical entries using all books' evidence, resolve
held presentation questions and obtain the required two exact-revision reviews.
There is no remaining reading or visual blocker within this assigned span.

## New observations for the coordinator

**[2026-09-10] - Toddler appendix language compression**
- Observation: The short calm-place alternative at PDF 234 omits the differing
  age wording in the complete prose (around 3 at 136) and summary chart (over 3
  at 138); the public sharing example at 171 also qualifies the general
  finish-before-turn table wording at 233.
- Action: Use appendix language as an index to complete context, and retain
  explicit age/public-place exceptions in canonical records instead of drafting
  directly from a short table cell.
- Confidence: high

**[2026-09-10] - Toddler shelf dimensions**
- Observation: Appendix PDF 236 prints 47in/120cm by 12in/30cm by 16in/40cm for
  the classroom shelf, whereas the core research records different imperial
  values beside the same approximate metric values at PDF 76.
- Action: Preserve both locators as a source tension and prefer functional
  accessibility over publishing one normalized exact shelf specification.
- Confidence: high
