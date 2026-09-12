# Population contribution commands

For resumed Tasks 5–8, `POPULATION_WORKFLOW.md` supersedes the older full-reading
and fresh-reviewer instructions below. Use the lean-v1 packet/report commands at
the end of this document. The freeze/render format and immutable pilot stay intact.

Tasks 5–7 can freeze, render and verify their own text contributions without
editing the application, pilot revisions or another population directory. Run
from the `montessori-books` root after the final pilot registry is available.
The three tools are offline helpers under `content/pilots/`; their outputs stay
under the task's owned directory.

| Task | Owned directory | New canonical prefixes | Primary ages |
| --- | --- | --- | --- |
| 5 | `content/birth-6` | `early-` | `0-3`, `3-6` |
| 6 | `content/6-18` | `infant-` | `6-9`, `9-12`, `12-18` |
| 7 | `content/18-36` | `later-`, `family-` | `18-24`, `24-36` |

## Authoring inputs

Each explicitly named immutable draft is an object with an `author.task` and
optional `entries[]`, `reuse[]`, `placements[]`, `provenance[]` and
`placementEvidence[]`. Entry and placement fields follow `CONTRACT.md`.
An entry file may wrap a single entry in `entries`; a placement file may wrap
one or more placements. There is still only one editable canonical body.

Every new entry needs its full private canonical provenance, including actual
original reads, source-idea/evidence links, fingerprints, source revisions,
qualifications and artwork implications. Every placement needs a matching
private record of this shape:

```json
{
  "placementId": "0-3.early-example",
  "sourceAge": {"statement": "Exact source age wording or no stated age", "references": [], "evidenceIds": []},
  "readiness": {"statement": "Source-supported interest or condition", "references": [], "evidenceIds": []},
  "editorialPlacement": {"reason": "Why this browse age is useful without inventing a milestone", "authorReadLogIds": []}
}
```

This illustrates the wrapper, not sufficient evidence. Fill every field with
the actual relevant evidence; reviewers assess the content of these records.

For an additional placement of a frozen pilot entry, include a `reuse` record
once across the named drafts:

```json
{
  "entryId": "existing-stable-id",
  "registryRevision": "exact final registry revision",
  "canonicalEntrySha256": "exact digest from CANONICAL_REGISTRY.json"
}
```

Do not copy that entry into `entries`. The helper verifies the registry,
integrated pilot payload and original canonical record, and resolves the body
into a generated review projection. Supply only your new placements and their
private evidence. The same entry/age pair cannot appear twice. Frozen pilot
pairs remain inherited context, and only their primary age owner may add other
pairs for that frozen ID. A new canonical owner supplies all supported placements
for its own ID, including cross-age topic placements. Cross-age placements omit
`openingOrder`.

Assemble the complete owned contribution before freezing: every primary age
needs three ordered openings and all five populated topics. Each opening has
an identifiable title, `actionLabel`, `invitation`, cue when appropriate and
the full entry. The existing 6–9 and 18–24 openings are inherited, fixed context.
New ages choose from frozen entries or the primary age owner's new entries.
These are content requirements, not quotas for how many entries to write.

No new scene or entry illustration is accepted by the text-phase helper. Keep
artwork implications in private provenance for Task 8.

## Freeze and render

Set a task-specific Node variable when `node` is absent from PATH:

```sh
pilot_node=/Users/vanshkumar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
```

Example for Task 5; substitute the owned directory and explicitly enumerate all
chosen immutable files. Do not use a glob that can accidentally include old
revisions or someone else's contribution.

```sh
"$pilot_node" content/pilots/prepare-contribution.mjs content/birth-6/revisions/r01 content/birth-6/drafts/draft-r01.json
"$pilot_node" content/pilots/render-contribution.mjs content/birth-6/revisions/r01
```

Freeze writes `payload.json`, `MANIFEST.json` and `snapshots/{placementId}.json`
inside that owned revision. The payload includes immutable pilot entries and
pairs as rendering context. `MANIFEST.targetPlacementIds` identifies the new
contributor work; only those targets receive snapshots and review surfaces.
Inherited pairs are neither reauthored nor claimed as newly reviewed.

Render writes `RENDERED_SURFACES.json` plus `rendered/*.entry.html` and
`rendered/*.opening.html` in the same directory. It uses the actual `HomeStudy`
component and exact topic rows, entry text, age context, opening title, choice
navigation, invitation, cue and CTA. To enter the existing scene-gated opening
branch, the offline renderer supplies a temporary structural object in memory,
then removes image, preload and caption markup. It creates, fetches and displays
no placeholder image. No structural object enters a snapshot or public export.

Each HTML artifact is labelled **Text-only review — artwork and composition
pending**. Every target's `artContext` and art digest are null. Existing canonical
illustrations, if any, are omitted only from this generated text-phase
projection. The resolved canonical digest remains bound to the original record.
The label is private review framing, outside the recorded reader text. These
artifacts establish exact opening text, not final scene layout approval.

## Independent review and verification

Split the frozen targets into bounded source-unit batches. Assign each batch
distinct fresh xhigh source and tone reviewers, both separate from its authors.
Use `REVIEW_FORMAT.md`, the actual generated surfaces and original PDFs. Each
reviewer personally reads every cited page and complete relevant source unit,
including continuations and readable tables/captions/illustrations. Reviewers
write immutable reports under their contribution's `reviews/` directory.
All text-only art fields are explicitly null. A copied previous text review
does not approve a new age placement or opening.

After fixes, create a new authored revision and new freeze. Preserve previous
drafts, snapshots, findings and reports. Renew all affected exact reviews.
Unchanged text can retain a previous pass only when both its component and actual
rendered context still match. A changed neighboring opening navigation label
therefore also requires the affected opening surface to be reviewed again.

Pass every applicable report explicitly in chronological order, oldest first:

```sh
"$pilot_node" content/pilots/verify-contribution.mjs content/birth-6/revisions/r01 content/birth-6/reviews/source-r01.json content/birth-6/reviews/tone-r01.json
```

The verifier rebuilds from immutable authoring/registry inputs, checks exact
snapshots, current renderer, actual surfaces, distinct xhigh identities, original
read links and both current text passes. A later applicable revise/hold overrides
an earlier pass. Known unresolved findings must be resolved editorially as well
as passing these structural checks.

Success writes only `CONTRIBUTION_RECEIPT.json` in the owned revision. It is a
private text-contribution receipt with `publication: false` and artwork pending;
it cannot create `src/guide/approved.json`, change the app, or authorize release.
Return it with the authored revisions, source/age coverage, issue dispositions,
review files and artwork implications. Source-idea reconciliation remains a
required handoff step; this verifier does not certify whole-book coverage.

Task 8 resolves all contributions against the frozen registry, reconciles every
coverage allocation and supplies actual new-age artwork. Each new illustrated
combination needs exact source and tone art-context review of actual bytes and
the final text. Any changed text or age/topic/opening context needs renewed text
review too. No contributor blocks on another contributor's mutable body or on
artwork merely to obtain its required exact text review.

## Lean-v1 packets and decisions

After the usual freeze/render, print only one related batch:

```sh
"$pilot_node" content/pilots/review-packet.mjs content/birth-6/revisions/r01 early-example baby-language
```

The packet gives actual full reading text once per entry and reversible text
deltas for its other ages. It also includes opening/topic surfaces, private age
evidence, references and author-draft pointers. The task owner supplies a concise
companion note naming relevant source units, cross-references and held variants;
reviewers can open original source and assigned provenance as needed. It is not
a replacement for source reading. Do not dump inherited pilot context targets.

Reviewers write an immutable decision file under their owned `reviews/`:

```json
{
  "id": "birth6-source-r01",
  "reviewer": {"task": "/root/birth6_source", "role": "source", "reasoning": "xhigh"},
  "readLogs": [
    {"id": "own.context", "sourceId": "baby-2021", "pdfPages": [{"start": 130, "end": 132}], "mode": "full-text", "description": "Actual complete original pages personally read."}
  ],
  "decisions": [
    {"placementIds": ["0-3.baby-language", "3-6.baby-language"], "reuseBody": true, "verdict": "pass", "assessment": "Short specific judgment of both age contexts.", "readLogIds": ["own.context"], "issues": []}
  ]
}
```

This example is a schema illustration, not an approved placement, read log or
verdict. Use actual decisions and the exact source spans your contribution needs.
Tone decisions also supply structured `contextReferences` (`sourceId`, `pdfPages`)
for personally read original framing. Both roles cover the age-evidence source
spans. New entries omit `reuseBody` and receive full new-source review.

A retained reviewer may add `retainedReads: [{path, sha256, readLogIds}]` pointing
to their own earlier immutable reports. The compiler checks reviewer identity
and role and copies only selected actual logs; it never invents a read or pass.
Use separate decisions when ages need different verdicts, evidence or issues.
For corrections, `resolves` names the earlier issue IDs addressed by that decision.

```sh
"$pilot_node" content/pilots/build-review-report.mjs content/birth-6/revisions/r01 content/birth-6/reviews/decisions/source-r01.json content/birth-6/reviews/source-r01.json
"$pilot_node" content/pilots/verify-contribution.mjs content/birth-6/revisions/r01 content/birth-6/reviews/source-r01.json content/birth-6/reviews/tone-r01.json
```

The compiler fills only structural metadata and checks required reading coverage.
The existing verifier still enforces independent roles, frozen text/rendering,
current decisions and private-only output. Lean-v1 records additionally bind
approved-body reuse and its new placement review. Deterministically equivalent
whitespace/typographic quote changes may carry a pass with an explicit receipt;
changed words, source pages, conditions or age/topic metadata cannot use this path.
