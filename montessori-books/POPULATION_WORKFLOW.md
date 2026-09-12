# Population workflow — lean v1

Approved by the user on 2026-09-10: significantly reduce token use and continue,
preserving content quality. This amendment governs Tasks 5–8 and supersedes older
requirements for repeated full-source reading and fresh correction reviewers.
The completed r08 pilot, its registry, historical reviews and receipts stay intact.
Product scope, ownership, original-source authority and design remain unchanged.

## Work from the completed baseline

- Reuse the 101 approved canonical entries and the completed whole-book research.
  Draft only missing meanings/variants and supported additional age placements.
  Do not repeat the whole-book inventory, completeness audit or pilot body review.
- Group each canonical entry's placements together within a source-topic batch.
  Read its body once, then inspect every age/topic/opening difference. A new age
  still needs an explicit judgment; an earlier age's pass is not transferred.
- Keep existing task and author contexts. The task owner handles coverage with
  existing ledgers and scripts; no separate parallel coverage-auditor agent.
- Default to one retained source reviewer and one retained tone reviewer per
  population task, working through bounded related batches. Both are independent
  of authors and each other. Create another context only when the current one
  cannot retain the relevant source material, not for each revision or age.

## Two independent judgments, different reading duties

**New canonical text / changed substantive claims:** the source reviewer reads
the original cited pages and complete relevant units, continuations and meaningful
tables/captions/illustrations. Reuse that reviewer's own earlier reads of the same
unchanged unit. Check materials, conditions, attribution and age interpretation.

**Frozen pilot body reused at a new age:** preserve the verified canonical digest
and prior body approvals. Both reviewers inspect the approved reader text and new
presentation. The source reviewer directly reads the original age/readiness/context
passages needed to assess the new placement; the body's entire bibliography need
not be read again. Contradictions or an inappropriate body reopen the substantive
issue; do not hide it in a new age note or silently rewrite the pilot.

**Tone:** independently inspect all final reader wording and relevant original
book framing. Check warmth, useful specificity, parent capacity, child agency,
necessary short-summary qualifications and implications of the age/art context.
The tone reviewer need not repeat the source reviewer's entire bibliography.
Read the full original unit whenever framing or interpretation is uncertain.
Record the actual context pages personally read; never claim borrowed reading.

Every placement retains two distinct xhigh judgments. Every actual illustrated
combination retains source and tone review. No new outside care advice, invented
milestones, unreviewed claims, or automatic approval of a source research hold.

## Compact inputs and reports

- Read required project instructions once per retained context. Thereafter send
  only changed instructions and the assigned source packet, not design history,
  whole ledgers, manifests or all prior reviews.
- A packet contains each public entry once, all assigned placement differences,
  actual rendered text/diffs, precise original source spans and relevant holds.
  Original page text can be cached under ignored tmp; open readable page images
  when layout carries meaning. Do not repeatedly dump the same source pages.
- Reviewers write explicit decisions and actual read logs. A helper fills IDs,
  snapshot paths and hashes. One short pass assessment per related group is enough;
  full explanations are reserved for concrete findings. No repeated praise or
  paragraph-long pass rationale for each age placement.
- Original first judgments stay independent. A source reviewer does not read the
  tone review before judging; a tone reviewer does not inherit source verdicts.

## Consolidate corrections and review only what changed

Finish author copy editing and reference checks before freezing. Collect both
initial reviews, make one consolidated revision and send retained reviewers the
exact changed fields plus relevant context. A further cycle is warranted only
for an unresolved substantive issue. Do not request revisions for harmless style
preferences or create a new agent to confirm a small accepted correction.

Wholly unchanged components retain their approvals. Pure whitespace and typographic
quote normalization can retain approvals after deterministic equivalence checks
of the public projection AND actual rendered surfaces. Changes to words, ages,
source pages, conditions, topic/opening context or artwork are not classified as
mechanical by that rule. Such changes receive the affected focused judgment;
the original units already personally read need not be reread wholesale.

## Contribution evidence

Existing freeze/render/verify commands and public/private boundaries remain.
Use workflow `lean-v1` in new review reports. For approved-body reuse, each exact
review records `bodyReview` with `entryId`, `canonicalEntrySha256` and
`registrySha256`. These must match the frozen registry and actual body.

Every authored `placementEvidence.sourceAge.references` and
`placementEvidence.readiness.references` list uses structured source references
with `sourceId` and physical `pdfPages`. Together they must identify at least one
actual source span supporting the placement, including when the source states
no fixed age. Source reviewers read these spans. For tone, `contextReferences`
records the relevant original framing personally read. Tone reviews also cover
the placement source spans. New-source reviews cover the full public
bibliography plus placement spans. Read logs can link the same reviewer's earlier
immutable report; the helper verifies that identity instead of inventing reads.

The verifier continues to reject changed snapshots/renderers, missing or non-
independent decisions, unread required source spans, and later applicable holds.
The receipt distinguishes retained body approval from the new placement judgment.
No text contribution receipt approves new art or publication.

## Coordination and completion

Keep the existing three population tasks and disjoint directories. Send the
coordinator only meaningful handoffs, ownership conflicts or blockers, using
short messages. Do not launch duplicate audits or speculative review work.
The coordinator uses compact status snapshots and avoids rereading large files.
Task 8 integrates the approved contributions, closes real source-idea allocations,
adds/reviews art, then runs one build and representative desktop/phone checks.
Its text audit verifies the pilot/contribution receipts and exact assembled
projection; it does not commission another complete source/tone review of already
approved bodies and placements. Reopen only a detected discrepancy or new claim.
New images and their captions/context still receive both actual-image judgments.
No new design-score loop or broad test suite. Do not reduce content coverage to
an arbitrary count to save tokens. Savings come from reuse and narrower review.
