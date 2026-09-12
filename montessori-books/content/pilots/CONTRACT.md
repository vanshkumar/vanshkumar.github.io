# Pilot content contract

Final contract, 2026-09-10. The r08 pilots passed exact independent source and
tone reviews and the integration gate. This file specifies the completed
architecture and required population format. The integration receipt and
canonical registry identify the frozen release. Counts describe reviewed
content, not a quota. This is a local pilot release; deployment is separate.

## Canonical content and placements

The pilot has 101 canonical entries: 30 Baby, 56 Toddler and 15 shared entries.
They have 115 placements: 45 at 6–9 months and 70 at 18–24 months. Fourteen shared
entries appear at both ages; one shared caregiver-choice entry appears at 6–9.
Each pilot has three openings followed by all five topics. An entry can appear
in several topics through one placement, without duplicating its body.

The seven stable age IDs are `0-3`, `3-6`, `6-9`, `9-12`, `12-18`, `18-24`,
`24-36`. The last label is “2–3 years.” The five topic IDs are `play-discovery`,
`everyday-care`, `connection-feelings`, `home-that-helps`, and `you-family`.
Preserve every issued entry ID when its title changes. Placement IDs are
`{ageId}.{entryId}`, with one unique pair per entry and age. Topic order names
the primary topic first; it is part of the reviewed presentation.

`CANONICAL_REGISTRY.json` is the final index of immutable canonical authoring
records, their generated public projections, source-idea links, placement
snapshots and independent approvals. It contains one owner/path per entry.
`POPULATION_ALLOCATION.md` assigns tasks 5–7 disjoint new namespaces and placement
ownership. The registry and allocation are final for the r08 handoff.

## Public JSON

The app receives only `entries`, `placements` and `scenes`. These plain objects
contain no research states, source fingerprints, private caveats or review logs.

| Record | Public fields |
| --- | --- |
| Entry | `id`, `kind`, `title`, `summary`, `references[]`; optional `category`, `cue`, `detail[]`, `steps[]`, `principle: {id?, text}`, `illustration`; an opening also has `actionLabel` and `invitation` |
| Placement | `id`, `entryId`, `ageId`, `topicIds[]`; optional `openingOrder` of 1, 2 or 3 and `ageContext: {bookAge?, readiness?, note?}` |
| Scene | `id`, `ageId`, `src`, `alt`, `width`, `height`, `layout`, `caption`, `sourceId` |
| Entry illustration | `src`, `alt`, `width`, `height`, optional `caption` |
| Reference | `id`, `sourceId`, `section`, `locator`, `pdfPages: [{start, end}, ...]`; optional individually verified `printedPages: [{pdfPage, printedPage}, ...]` |

`kind` is `invitation`, `perspective` or `everyday-situation`. The pilot includes
31 invitations, 48 perspectives and 22 everyday situations. Optional steps stay
absent when the source and purpose do not call for a sequence. Perspectives use
“Read more”; they do not acquire an imperative activity template. Kind alone
does not determine whether a sensitive description is faithful or appropriate.

The title names a subject a parent can recognize while browsing. The summary
must carry its own necessary meaning and qualifications. A detail paragraph or
private note cannot repair a misleading topic row. Opening invitation, cue,
title, CTA, scene and full entry are judged in their actual combinations.
Ordinary invitations remain concrete, warm and useful. Do not flatten them into
abstract labels or repeated “room for” and “a small part” wording.

`ageContext.bookAge` reports the source's age wording, when present; `readiness`
reports supported interest or conditions. `note` carries a needed public
qualification about the editorial browsing band. These are not milestones or
automatic permission to import a neighboring activity's age. If book prose,
appendix row or caption differ, preserve relevant differences rather than
inventing a common age. No source age is invented for general family guidance.

References use `baby-2021` or `toddler-2019`. Physical PDF spans are one-based,
inclusive and nonempty; discontinuous spans stay separate. All current pilot
references use physical PDF pages. Baby has no claimed printed-page mapping.
Toddler folios may be added only after individual original-page visual
verification. Omit private verification wording from reader locators. The old
`legacyPageLabel` adapter field is forbidden in released content.

Image paths are relative to `public/`, such as `art/home-paper-baby.webp`, and
resolved with Vite's base URL. Scene layouts are explicit: `open-left` or
`above-scene` for the current two scenes. An age name does not infer a layout.
No image is required for a perspective. A new image or newly illustrated
placement needs separate exact source and tone art-context approval.

## Private authoring and evidence

Keep immutable revisions in the assigned content directory. A changed draft
creates a new file; retain the prior draft, findings, correction, source-read
evidence and replacement reviews. Never overwrite a frozen snapshot or report.

Each canonical entry has private provenance connecting it to stable original
source-idea and evidence IDs, record/file revisions and hashes, original PDF
fingerprint, structured references, relevant source context, actual author read
logs, editorial qualifications, sensitivity, unresolved details and artwork
implications. A bibliography or source status alone cannot replace this chain.

Each age placement needs three distinguishable evidence parts:

1. The source's stated age, or that no age is stated, with exact locators.
2. The actual readiness, interest or situation, with exact locators.
3. The editorial reason for this browsing band, without pretending it is source
   wording or a developmental requirement.

The authored pilot retains each author's original private field names and full
evidence. Later tasks may use a wrapper with `sourceAge`, `readiness` and
`editorialPlacement` for these three parts. Additional placements for frozen
pilot entries reference `entryId`, registry revision and `canonicalEntrySha256`
plus the immutable public-record path. Their wrapper holds the private evidence;
the public projection contains only the placement fields above. Do not copy the
canonical body to change an age label or add a topic.

Follow the foundation editorial charter for source-only sensitive material.
Research holds identify evidence questions. They neither approve publication
nor require a whole-topic exclusion. A narrower attributed perspective can
survive exact review while operational details remain unselected or unresolved.
Do not invent care procedures, reconcile conflicting setups by guessing, or
present book passages as independent clinical verification. Preserve useful
ordinary participation where the complete source supports it.

## Exact independent reviews

Use bounded batches of related source units. Do not ask one reviewer to absorb
the entire pilot plus both books in a single context. Every final entry, age and
topic projection needs a fresh independent xhigh source reviewer and a distinct
fresh independent xhigh spirit/tone reviewer, both distinct from the author.
They personally read the original cited pages and complete relevant source units
and continuations. Tables, illustrations, captions and layout require readable
original-page visual inspection where they carry meaning. Another reader's
summary, an extract being generated or a contact sheet is not a full source read.

`REVIEW_FORMAT.md` gives the exact common report shape. A report includes reviewer
identity/role/reasoning, date, actual read logs, immutable rendered-file path and
SHA, and a record for every assigned placement with snapshot path/file SHA,
component hashes, linked read logs, verdict, assessment and stable issue IDs.
Issues name the affected field and surface, finding and required correction.
Keep the old issue open in its immutable report; link its resolution in the new
replacement review and final disposition record.

`review-snapshot.mjs` allowlists public fields and computes separate components:

- `textPlacementSha256` binds exact entry prose and references, one age placement,
  topic order and the shared visible labels, formatted references and framing.
- `artContextSha256` binds scene/illustration metadata, the actual SHA of each
  image's bytes and the entire text-placement hash. A prose qualification change
  therefore invalidates art approval for that combination too.
- `publicProjectionSha256` binds both components. Private provenance is separate.

An unchanged component can retain its pass against the earlier immutable
snapshot. Changed prose, references, age/topic context, qualifications or shared
rendered framing requires affected text review. The integration gate also compares
actual current opening, topic-row and detail text with the reviewed rendering,
including neighboring opening navigation. Replaced image bytes require
new art-context reviews even if the filename stays the same. Identical text does
not need a new text verdict solely because artwork changed, but the art reviewers
must inspect the current public combination. Evidence-only metadata does not
manufacture approval; a substantive new evidence issue can reopen prior copy.

An illustrated placement receives a separate art verdict from each role and
`assetReads` identifying actual viewed image bytes by path and SHA. A text pass
does not imply an art pass. No art component is recorded for an unillustrated
placement. A review needs the relevant source context as well as the actual image.

## Coverage and final integration

Coverage connects every applicable original source idea to a concrete disposition
and reason: `included`, `combined`, `context-only` or `excluded`. Use concrete
canonical/placement targets for retained meaning, and name exact private context
targets when appropriate. Record `heldDetails` separately. A source row may have
distinct variants; identify them without replacing the original idea ID.

Pilot stage accounting covers all 617 Baby and 692 Toddler idea IDs. The shared
153 author rows overlap those IDs and are not additional ideas. The 63 original
Baby author-held rows become context-only qualification/omission records while
retaining their original disposition, reasons and source questions. No practical
detail is promoted by normalization. Revision amendments preserve the original
author record and the exact reason a public treatment changed. A pilot exclusion
is not a product-wide exclusion or an instruction to omit later-age coverage.

Tasks 5–7 supply exact source/age coverage under the allocation. A named idea
assigned to another owner remains outstanding until an actual reviewed target
exists. The final integrator reconciles all stages against both complete source
ledgers; a task reference is not completed combination evidence.

The sole integrator freezes the chosen drafts with `prepare-review.mjs`, renders
them through the actual `HomeStudy` components with `render-review.mjs`, and
collects the exact independent reports. `integrate-reviewed.mjs` requires matching
passes for every current text and art component, independent identities, valid
original-read links, immutable files, current renderer and asset hashes, valid
placements and all three openings/five topics for both pilots. Later applicable
revise/hold records supersede earlier passes. Mechanical checks do not replace
editorial judgment or resolution of known findings.

After those checks, the tool emits the public `src/guide/approved.json`, immutable
integration receipt and private `APPROVED_RELEASE.json`. `create-registry.mjs`
indexes that exact reviewed release for reuse. Final handoff includes issue
dispositions, reconciled coverage, build and browser evidence, and artwork limits.

## Runtime and navigation

Population tasks use the disjoint `prepare-contribution.mjs`,
`render-contribution.mjs` and `verify-contribution.mjs` workflow documented in
`CONTRIBUTION_WORKFLOW.md`. It resolves frozen canonical references, renders
actual opening text without an image, and issues only a private text receipt
inside the contributor's directory. Inherited pilot pairs are immutable context;
new target pairs require exact independent review. New-age artwork and final
composition remain with Task 8 and require actual-image combination review.

`src/guide/index.js` supplies the explicit public release to `createGuideStore`.
No `content/` or `research/` glob import, private object filtering inside React,
review-state field or reviewer data belongs in the application graph. Nine old
studies and `src/content.js` remain development references. Production excludes
their modules, prototype adapter and unused artwork. The Vite build checks release
and actual asset hashes and emits only the reviewed images; it does not copy the
whole public artwork directory.

| Route | Behavior |
| --- | --- |
| Empty hash, `#`, `#/`, `#/home?age=6-9` | Home; absent/invalid age defaults to 6–9 |
| `#/home?age=6-9&idea=baby-language` | Select that age's opening by stable ID |
| `#/home?age=6-9&view=topics` | Five everyday topics |
| `#/home?age=6-9&topic=play-discovery` | That age's entries in the selected topic |
| `#/home?age=6-9&topic=play-discovery&entry=baby-language` | Full entry only when its age/topic placement exists |
| `#/home?age=6-9&entry=baby-language` | Direct reading view in that age, without an implied topic |
| `#/studies?age=18-24` and old concept routes | Development comparison only; production recovery view |

Only the selected age's three opening IDs qualify for `idea`. Unknown or
misplaced entries/topics show a recovery view. Changing age returns to that
age's home; Back/Forward restores the prior hash state. Entry/topic navigation
focuses the reading heading, and return from an entry to its topic restores the
entry-link focus. Selecting an opening does not globally scroll the page.
Local availability and legacy `stages.ready` do not confer editorial approval.

The accepted round-16 home design remains the visual basis. Content review is
separate from the eventual artwork integration task, hosting and deployment.

The preceding author-read contract remains byte-for-byte available at
`archive/CONTRACT-pre-release.md`; `CONTRACT_HISTORY.json` maps its original path
and digest to that archive. Historical author/reviewer records are unchanged.
