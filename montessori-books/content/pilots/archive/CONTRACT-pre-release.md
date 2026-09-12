# Pilot content contract — groundwork v0

2026-09-10. Architecture is implemented; the 6–9 and 18–24 month pilots and the
final population allocation are **in progress after both final research handoffs**.
This provisional contract does not approve the six prototypes or authorize bulk
population. Finalize it using the reviewed pilots, without speculative fields.

## Runtime boundary

`src/guide/index.js` explicitly supplies public `entries`, `placements`, and
`scenes` to `createGuideStore`. It currently uses the existing local prototype
adapter. No reviewed-content manifest exists yet. There is no publication-ready
flag and no runtime filtering of imported research records.

- `src/content.js` remains the six-record legacy source for the nine other studies.
  It now also owns the accepted home's existing action labels and short invitations.
  The adapter selects those records by ID; it does not rewrite them.
- `src/guide/prototype.js` selects reader fields explicitly. Its citation strings
  remain unchanged prototype references, with no new printed-folio verification.
- Later, only the sole app writer emits and imports an explicit public payload
  after review. Never glob-import `content/` or `research/`. Filtering a private
  object in React is too late: that object would already be in the bundle.
- `content/pilots/` contains private draft snapshots, review records, evidence
  links, and handoffs. Raw extracts/page renders stay under ignored `tmp/`.
  None belongs in `public/`, app imports, or reader copy.
- Keep `stages.ready` unchanged for legacy studies. Guide placement/scene presence
  describes local availability only; it confers no review approval.

## Public records

Plain JSON-compatible objects; `undefined` fields are omitted in saved JSON.
Keep absent steps absent. Do not use a blank or invented activity to fill a topic.

| Record | Fields and meaning |
| --- | --- |
| Entry | `id`, `kind`, `title`, `summary`, `references[]`; `actionLabel` and `invitation` for an opening; `cue` for observation or situation context; optional `category`, `detail[]` paragraphs, `steps[]`, `principle: {id?, text}`, `illustration` |
| Placement | `id`, `entryId`, `ageId`, `topicIds[]` (primary first), optional `openingOrder: 1/2/3`, optional public `ageContext: {bookAge?, readiness?, note?}` |
| Scene | `id`, `ageId`, `src`, `alt`, `width`, `height`, `layout`, `caption`, `sourceId` |
| Key moment | Entry's optional `illustration: {src, alt, width, height, caption?}`. No image is required for a perspective. Add more only if pilot evidence makes it useful. |

`kind` is exactly `invitation`, `perspective`, or `everyday-situation`. Summary,
short opening invitation, and observation/context are separate reviewed public
wording. An invitation need not have steps; the view omits empty steps. Perspectives
use “Read more” and do not inherit an activity heading or imperative template.
Safety-sensitive summaries describe the book; their kind alone is not a safety
gate. Review the actual rendered wording and surrounding presentation.

Canonical text exists once. A placement links it into one age and one or more
topics. Never copy the entry to alter an age label or fill another topic. If
materially different qualifications require a different entry, resolve that with
the sole integrator and keep an explicit relationship in private evidence.

`ageContext.bookAge` preserves source age wording as source framing;
`readiness` and `note` can express supported interest/context and the public
qualification needed for the editorial age grouping. Private age evidence must
separately record source wording/locator, readiness/locator, and editorial reason.
No age rationale has been invented for the unchanged prototypes in this groundwork.

Scene `src` and key-moment `src` are paths relative to the app's `public/`, e.g.
`art/home-paper-baby.webp`. They are resolved with Vite's base URL. The two current
layout tokens are `open-left` and `above-scene`; the latter uses the existing
toddler placement CSS. New ages require explicit layout metadata and review.
Neither the age name nor “not baby” chooses a scene layout.

## Stable IDs and routes

Age IDs remain `0-3`, `3-6`, `6-9`, `9-12`, `12-18`, `18-24`, `24-36` (last label:
2–3 years). Topic IDs exactly match the foundation: `play-discovery`,
`everyday-care`, `connection-feelings`, `home-that-helps`, `you-family`.

Preserve issued content IDs when titles change. Existing IDs are reserved:
`baby-movement`, `baby-language`, `baby-connection`, `toddler-pouring`,
`toddler-drawing`, `toddler-shoes`. No new content IDs are allocated until the
research overlaps and pilots establish ownership. Placement IDs currently use
`{ageId}.{entryId}` and must be unique, with one placement per entry/age pair.
Reusing the same entry across two topics uses one placement with two topic IDs.

| URL shape | Behavior |
| --- | --- |
| empty hash, `#`, `#/`, `#/home?age=6-9` | Chosen home, default 6–9 when age is absent/invalid |
| `#/home?age=6-9&idea=baby-language` | Select an opening by stable ID; no global scroll-to-top |
| `#/home?age=6-9&view=topics` | Five everyday topics |
| `#/home?age=6-9&topic=play-discovery` | Entries for that topic at that age |
| `#/home?age=6-9&topic=play-discovery&entry=baby-language` | Full reading view; entry must have that age/topic placement |
| `#/home?age=6-9&entry=baby-language` | Direct entry at that age; no topic context implied |
| `#/studies?age=18-24` | Development comparison index; links preserve age |
| `#/windows?age=…`, other existing concept IDs | Existing studies and empty-age behavior remain compatible |

`idea` may accompany topic/entry links to restore the previously selected opening.
Only that age's opening IDs qualify; a random/global ID cannot become an opening.
Unknown topics/entries show a recovery view. An entry found globally but absent
from the age/topic placement does not render under that context. Changing age
returns to that age's home; browser Back/Forward restores the previous hash state.
Entry/topic navigation focuses the reading heading; returning from an entry to
its topic restores focus to the entry link. A local opening choice stays in place.

## References and evidence

Each final reader reference is:

```text
id, sourceId, section, locator,
pdfPages: [{start, end}, ...],
printedPages?: [{pdfPage, printedPage}, ...]
```

`sourceId` is `baby-2021` or `toddler-2019`. Page spans are one-based physical,
inclusive and nonempty. Discontinuous spans stay separate. Baby printed pages
are absent. Toddler printed mapping must contain individually visually verified
folios only. Reader references omit verification-state language; private full
references retain `printedVerification`, verifier/date/pages, `contextRead`, and
`readLogIds` under the foundation contract. Multiple references may cite either
book, with each section/locator/pagination shown separately.

The prototype-only `legacyPageLabel` is an adapter escape hatch, not acceptable
in a final approved entry. Do not parse its old strings into visually verified
folios. Re-review all six prototypes from original pages after research handoff.

Private provenance links stable idea/evidence IDs and exact research revisions,
file paths + hashes, source fingerprints, full source references, qualifications,
sensitivity, unresolved issues, age basis, and illustration implications. Retain
the foundation meanings; do not weaken them into a bibliography-only record.

## Exact independent review

Use immutable per-revision files, for example `drafts/{entryId}/r01.json`,
`snapshots/{entryId}/r01.{placementId}.json`, and
`reviews/{entryId}/r01.{placementId}.{role}.json`. Changed drafts create a new
revision, preserving the prior draft, finding, resolution and re-review link.

`review-snapshot.mjs` is a small offline helper, not an approval engine. It
allowlists public fields and produces separately addressable components:

- `textPlacementSha256`: exact reader entry prose, source labels/locators, one
  placement including public age context and topic order, plus `displayContext`
  containing the age/topic/kind labels, formatted reference labels, relevant
  UI headings/CTAs and shared public framing used for review. This context is
  required and allowlisted by the helper; pass `ageLabel`, `topics: [{id,label}]`,
  `kindLabel`, `headings[]`, `referenceLabels: [{title,pages}]`, `footer`, and
  `openingCTA` when an opening. Include applicable `colophon`, `bookline`, and
  `referenceNote` too. Do not put private evidence in these fields.
- `artContextSha256`: actual scene/key-moment metadata, SHA-256 of each image's
  bytes, and the complete `textPlacementSha256` so changing a qualification
  anywhere cannot carry old art approval forward. Use `scene: null` for
  an entry not shown as an opening. No image means no art component.
- `publicProjectionSha256`: the combined public text/placement and art projection.
  `provenance` remains separate and does not enter these public-content hashes.

Create one text/placement snapshot for every intended age placement; its topic
list and opening order are review context, not merely navigation metadata. A
reviewer must inspect every listed topic/opening presentation and the actual
reader surfaces. No copied private caveat counts as preserved public meaning.
Necessary context/cautions must be visible in the relevant public summary,
observation/context, or detail. The shorter opening and topic summaries need
their own judgment, even when the longer detail is accurate.

Each review records `id`, reviewer task/identity, `reasoning: xhigh`, date,
`component` (`text-placement` or `art-context`), exact component SHA, immutable
snapshot path + file SHA, draft path/revision + file SHA, actual source/context
pages read, verdict (`pass`, `revise`, `hold`), issues, and resolution/re-review
links. Source and spirit/tone reviewers must be distinct from the author and
each other. They read original cited pages and framing as the foundation requires.

Keep textual and illustration approval distinguishable. An image replacement
or new scene invalidates its art-context approval even at the same path; obtain
fresh supplemental source and tone art-context reviews. Identical approved prose
does not require a new source read solely because an illustration changed. The
art reviewer still reads the current public context and approves that exact
combination. Changed public prose, age/context, references or qualifications
requires affected textual review to be renewed. Evidence-only metadata changes
do not manufacture approval; substantive new evidence issues can reopen a held
or previously approved claim even if public wording has not yet changed.

Before emitting a final public payload, the sole integrator checks matching
independent passes for each exact text/placement and each actual art/context,
all issues resolved, valid evidence/reference links, no legacy page labels,
unique IDs, supported ages/topics, three distinct reviewed openings per released
age, and actual assets. Keep these checks offline. No private review objects
or “approved” status text go into the reader payload.

## Ownership before tasks 5–7

This groundwork reserves only task 4's app code and `content/pilots/`. Research
remains in its owners' directories. **Do not start bulk population yet.** After
both pilot reviews pass, finalize an explicit allocation table in this directory:
one writer/path per canonical entry, cross-age reuse targets, disjoint new ID
namespaces, and the owner of each shared adult/family idea. Transfer/reuse pilot
IDs without renaming them. Tasks 5–7 own their content/review files and return
handoffs; the sole integrator owns runtime exports, routes and shared indexes.
The provisional API above supports this division but does not preempt the
research-dependent ownership decisions.
