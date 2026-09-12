# Population ownership — final r08 allocation

Final on 2026-09-10 after the r08 pilots passed exact source and tone reviews
and the integration gate. Tasks 5–7 have not been started by Task 4; the coordinator
creates them after the final handoff. `CANONICAL_REGISTRY.json` and
`revisions/r08/INTEGRATION_RECEIPT.json` identify the reusable revisions.

## Canonical text ownership

| Canonical content | One writer and path | Other tasks |
| --- | --- | --- |
| Every reviewed pilot ID, including `baby-*`, `toddler-*` and `shared-*` already issued by task 4 | Frozen under `content/pilots/revisions/`; task 4, then the sole task-8 integrator, owns revisions | Read and reuse the exact text; do not copy or edit the body |
| New birth–6 specific entries: `early-*` | Task 5, `content/birth-6/entries/{id}/rNN.json` | The canonical owner also supplies every supported cross-age placement for its new ID |
| New 6–18 specific entries: `infant-*` | Task 6, `content/6-18/entries/{id}/rNN.json` | The canonical owner also supplies every supported cross-age placement for its new ID |
| New 18–36 specific entries: `later-*` | Task 7, `content/18-36/entries/{id}/rNN.json` | The canonical owner also supplies every supported cross-age placement for its new ID |
| Additional shared adult/family or general principle entries: `family-*` | Task 7, `content/18-36/shared/{id}/rNN.json` | Send source/coverage suggestions; do not author competing shared text |

Existing pilot IDs are reserved even when their titles change. New namespaces
are disjoint. A prefix is not evidence that an idea belongs at a particular age;
actual source and placement review decide that. Task 7 owns additional shared
family text across the product, not merely advice about older toddlers.

The sole integrator owns app code, public exports, routes, shared indexes and
artwork integration. Source research, shared `LEARNINGS.md`, and
`POPULATION_STATUS.md` stay with their existing owners.

## Placement ownership and independent progress

| Placements | Writer / output directory |
| --- | --- |
| Additional `0-3`, `3-6` placements for frozen pilot IDs | Task 5 / `content/birth-6/placements/` |
| Additional `6-9`, `9-12`, `12-18` placements for frozen pilot IDs, reconciling the existing 6–9 pilot | Task 6 / `content/6-18/placements/` |
| Additional `18-24`, `24-36` placements for frozen pilot IDs, reconciling the existing 18–24 pilot | Task 7 / `content/18-36/placements/` |
| Every supported placement for a new `early-*` ID, including later ages | Task 5 / `content/birth-6/placements/` |
| Every supported placement for a new `infant-*` ID, including later ages | Task 6 / `content/6-18/placements/` |
| Every supported placement for a new `later-*` ID | Task 7 / `content/18-36/placements/` |
| New `family-*` placements at any supported age | Task 7 / `content/18-36/shared/placements/`; other tasks do not duplicate these pairs |

The accepted pilot placements are immutable inputs, not work to redo. A new age
placement contains the canonical entry ID and exact revision/digest reference,
its own topics, public age context, private three-part
age evidence and separate exact source/tone reviews. It does not contain a copied
entry body. Where the actual book ages differ, preserve that fact publicly when
needed to understand the placement.

The primary age owner selects three proposed openings from frozen pilot entries
or its own new entries for that age. Cross-age placements supplied by another
canonical owner omit `openingOrder`; they can fill reviewed topic lists without
creating competing opening selections. The final integrator may promote one
only after obtaining the resulting exact opening and artwork-context reviews.
The two pilots already have three fixed openings each. Further topic coverage
does not replace those openings or create a fourth one.

Tasks 5–7 can all start from the same frozen pilot registry. None depends on a
mutable draft from another population task. For a new canonical entry, the same
owner writes and reviews all supported age placements, even when a placement
falls outside that task's primary age span. Other tasks never write a second
body or a second placement pair for that new ID. Task 7 owns any further general
adult/family coverage and all its new shared placements. The final integrator
joins the contributions; a task need not wait for another task's draft to author
or review its own work.

Before inventing a new ID, search the frozen pilot registry for the same source
meaning. For an as-yet unrepresented concrete activity or child situation, its
source-supported starting context assigns the owner: birth–6 to task 5, 6–18 to
task 6, 18–36 to task 7. General adult/family guidance belongs to task 7 regardless
of book or age. A broader source row can have distinct variants; identify the
variant and preserve its qualifications instead of assigning the whole row a new
body repeatedly. If the source supplies only a readiness condition, record that
condition and a reasoned ownership decision; do not manufacture a starting age.

An idea assigned to another owner remains a named allocation in the coverage
ledger, with source idea/variant, owner and expected namespace. It is not a
completed combination until an actual reviewed target exists. The final
integrator must close every such allocation against the returned contributions;
unresolved allocations remain outstanding work. The separate ownership of new
IDs and frozen-pilot placements prevents a shared entry from creating reciprocal
dependencies between the age tasks.

If new evidence requires changing pilot prose or references, preserve the old
revision and report the exact issue and proposed change to the sole integrator.
Do not silently override it in a population directory. Unaffected work continues.
The integrator can freeze a new revision and obtain the affected reviews. This
keeps dependencies one-way and avoids competing canonical bodies.

## Source-idea accounting

Each population handoff includes `COVERAGE.jsonl`, linked to the frozen Baby and
Toddler ledgers through `sourceId`, `sourceIdeaId`, relevant evidence IDs and
record/file revisions. Use the original source-idea identity, never just a page
or an unstructured list of citations. Account the full source-order material
applicable to the owned ages, including adult/family ideas and later/earlier
variants needed to explain a decision.

For each idea and applicable age, record:

- `included`: concrete authored canonical entry and placement IDs, with a reason
  describing the surviving meaning;
- `combined`: concrete existing canonical entry/placement targets and the
  meaningful source detail or qualification preserved there;
- `context-only`: exact reason and the surviving entry, evidence context or
  editorial decision that needs it;
- `excluded`: a concrete scope or source-grounded editorial reason; an exclusion
  from one age is not a product-wide exclusion;
- `heldDetails`: unresolved interpretation, missing detail or source conflict,
  named separately from the idea's disposition and review state.

When one broad source row contains several meaningful variants, use subordinate
records linked to the original ID. A source idea can support several distinct
entries, but every target must be concrete and justified. Avoid creating a new
entry solely to increase a count or to mirror every research row.

The pilot coverage files are stage-specific editorial decisions. They do not
replace either whole-book research ledger. A later-age example omitted from a
pilot remains available for its actual age. Likewise, a held practical setup may
still support a narrower attributed perspective after exact review. Research
status is neither publication approval nor an automatic whole-topic exclusion.

At integration, reconcile both complete ledger ID sets against all stage
coverage records, check target existence and review status, and preserve concrete
included/combined/context-only/excluded reasons. Unresolved references to another
task are outstanding work, not completed coverage.

## Required population handoff

Use `CONTRIBUTION_WORKFLOW.md` for the executable, disjoint freeze/render/verify
commands. Each task freezes its complete primary-age text contribution under its
own `revisions/rNN`, then reviews targets in bounded source-unit batches. Actual
opening text is reviewed before new-age artwork; no placeholder image is treated
as approved. Verification writes a private owned contribution receipt only.

Return authored immutable revisions, public projections, exact placement
snapshots, independent source and tone records, issue resolutions/re-reviews,
actual original-source read logs, coverage records, and artwork implications.
Keep everything in the owned directory. No app import, public export, new image
approval or deployment follows from a content-task pass alone. Task 8 checks the
final assembled projection and any new age or key-moment illustration context.
