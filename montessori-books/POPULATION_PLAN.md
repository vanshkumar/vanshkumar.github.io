# Small Beginnings: approved population plan

Approved by the user on 2026-09-10. This is the durable scope and handoff contract
for eight fresh tasks working directly in this saved project. The accepted design
is round 16 in DESIGN_REVIEW.md and tmp/design-critique/round-16.png.

The user approved resumption with significantly lower token use on 2026-09-10.
`POPULATION_WORKFLOW.md` now governs reading/review granularity and coordination
for Tasks 5–8. It preserves this product scope and independent source/tone quality
checks while superseding repeated full reads and fresh correction contexts.

## Product decisions

- A faithful, layered companion to The Montessori Baby and The Montessori Toddler,
  for birth through age three. Include the parent/adult and family experience;
  pregnancy and birth preparation are out of scope.
- Retain seven browsing bands: 0–3, 3–6, 6–9, 9–12, 12–18, 18–24 months, and 2–3 years.
  Age is a browsing aid, not a deadline. Distinguish book-stated ages from editorial
  grouping and show interest/readiness/context without inventing milestones.
- Each age opens with three curated invitations, an age-specific illustration,
  and one focused reading panel. A quiet Explore more entry leads to five topics:
  Play & discovery; Everyday care; Connection & feelings; A home that helps;
  For you & your family. No quotas that require invented or weakly sourced ideas.
- Deeper content can be a practical invitation, a perspective, or support for an
  everyday situation. Optional steps only when appropriate. Preserve meaningful
  qualifications and the authors' intent; do not turn everything into an activity.
- No completion tracking, scores, streaks, prescribed schedules, required shopping,
  or parental-performance language. Clear suggestions, not generic reassurance.
- Safety-sensitive content describes the books' perspectives, retains cautions,
  and has precise references. No added instructions beyond the source, no silent
  blending of external advice, and no claim of independent medical verification.
- Canonical shared guidance is reused across ages instead of separately rewritten.
- Original illustrations in the accepted style: a primary scene per age, plus key
  moments where a visual materially explains setup/posture/action. Review age,
  materials, actions, anatomy, and implied expectations. No copied book artwork.
- No publication, backend, accounts, analytics, commits, or parent-site changes in
  this phase. Existing other design studies remain development references.

## Evidence and review

- Identify source editions and physical PDF pagination. Toddler printed references
  must be verified independently; Baby has no dependable printed-page equivalent.
- Research by source section first, then synthesize by age/topic. Read tables,
  appendices, captions, and relevant cross-references, not only prose extraction.
- Account for each substantive source idea in a coverage ledger: included,
  combined, context-only, or excluded with a specific reason. Avoid arbitrary
  entry-count targets. Raw text/extracts never enter public/ or the app bundle.
- Each published entry needs two independent xhigh reviews: a source review
  against the actual cited pages plus context, and a spirit/tone review. Reviewers
  must not be the authors. Source pages, review outcomes, and issue resolutions
  must be durable and traceable. Unresolved entries stay unpublished.
- Re-review the six prototype entries under this same process.
- Keep software checks light: build, references/assets integrity, representative
  desktop/phone navigation. Content review receives the substantial effort.

## Task sequence and ownership

All tasks and subagents use xhigh reasoning without an unsolicited model change.
New tasks use this saved project directly (local environment), not worktrees:
the current accepted prototype contains uncommitted files.

1. Editorial foundation: owns research/foundation/. Establish charter, source
   manifest, coverage structure, topic definitions, source-grounded tone examples,
   and a common evidence-record contract. Do not write app code.
2. Baby source research: owns research/baby/. Full section-level research and
   coverage for the Baby book; starts after foundation.
3. Toddler source research: owns research/toddler/. Equivalent research for the
   Toddler book; can run alongside Baby research after foundation.
4. Content architecture and pilots: owns app integration and content/pilots/.
   Implement canonical content, layered browsing, and complete reviewed 6–9 and
   18–24 month pilots. Starts after source research. Define the content contract
   for population tasks. No bulk population before both pilots are reviewed.
5. Birth–6 month population: owns content/birth-6/ and its research review files.
   Complete 0–3 and 3–6 months, including newborn context.
6. 6–18 month population: owns content/6-18/ and its research review files.
   Complete 6–9, 9–12, 12–18 months, reconciled with the pilot and source overlap.
7. 18–36 month population: owns content/18-36/ and its research review files.
   Complete 18–24 months and 2–3 years, plus allocated shared family guidance.
8. Final integration and audit: sole final app writer. Merge reviewed records,
   produce/integrate missing age and key-moment artwork, resolve cross-age reuse,
   and complete coverage/source/tone/interface audits.

Tasks 5–7 may run concurrently after task 4 establishes the reviewed pilot and
content contract. Research/content tasks own disjoint files; only one task may
edit shared app code at a time. This coordinating task owns POPULATION_STATUS.md,
root LEARNINGS.md updates, and integration assignments. Other tasks report their
new learnings in their own HANDOFF.md instead of racing on shared documentation.

## Durable context

Each task reads LEARNINGS.md, this file, the foundation charter, its inputs and
predecessor handoff. Each writes a HANDOFF.md with owned files, source spans read,
completed independent reviews, remaining issues, and an explicit next action.
Use bounded fresh-context subagents for research/drafting/review. Do not propagate
the full design history; use the accepted screenshot and local contracts.

Canonical entries need stable IDs, kind, short action label/summary, observation
or context cues, optional detail/steps, principle, readiness/age rationale, one or
more structured source references, and illustration metadata. Evidence/review
state stays outside public copy. Preserve existing age URLs and add stable topic
and entry deep links. The detailed contract is task 4's responsibility, using
foundation evidence and the two pilots rather than speculative schema expansion.

## Acceptance

- All seven ages use the accepted visual concept, with age-appropriate content/art.
- Every published entry has source and tone review; all relevant source sections
  have a coverage disposition; unresolved or unreviewed claims do not ship.
- Shared ideas are consistent across ages; ages and practical details are sourced.
- Starting invitation → topics → individual guidance → references works on phones
  and desktop, including long titles, no-step perspectives, and multiple sources.
- Production build and lightweight integrity/browser checks pass. No broad test
  suite or new design-critic score chase. Deployment remains a separate task.
