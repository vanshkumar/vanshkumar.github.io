# The Montessori Toddler: source research

This package accounts for the supplied `toddler-2019` book in source order. It is
research for task 4, not polished app copy or publication approval. Read `HANDOFF.md`
for the final coverage and audit state; the author-owned part files remain the
canonical research records.

## File structure

- `core/`: introduction, principles, home setup, curiosity/acceptance and index.
- `activities/`: entire activity chapter and activity appendix, including row-level
  ages, readiness, qualifications and differences between repeated tables.
- `care-limits/`: cooperation, limits, daily care, changes and useful skills.
- `adult-family/`: adult/family material, next years, real stories and other appendices.
- Root `SOURCE_MAP.jsonl`, `READ_LOG.jsonl`, `COVERAGE_LEDGER.jsonl` and
  `EVIDENCE.jsonl`: assembled source-order records with unchanged stable IDs.
- `PAGE_REGISTER.jsonl`: one row for each physical PDF page, with its source units
  and actual read-log evidence. Structural/index pages are distinguished from advice.
- `CROSS_REFERENCES.jsonl`: explicit cross-part destination accounting.
- `OPEN_QUESTIONS.md`: interpretive holds and overlap instructions.
- `COMPLETENESS_AUDIT.md`: fresh independent xhigh package review and resolutions.
- `VALIDATION.md`: mechanical completeness/reference checks and their limits.

## Use of the evidence

Start from a source unit and its idea dispositions. `included` means a distinct
research candidate; `combined` names a surviving idea/evidence target; `context-only`
preserves author framing or a needed qualification; `excluded` records an explicit
scope or suitability decision. None of these dispositions is an app publication state.

Evidence `research-ready` means source investigation is ready for editorial use.
Evidence `held` means the source has been examined but an interpretation, age
placement or practical application remains unsafe/uncertain or unresolved. A held
record can still have an included/combined disposition so its substantive idea is
preserved; do not publish it by filtering only on disposition.

Physical PDF pages are one-based and include all front matter/images. Printed
references are optional and may be used only when the exact cited page has a
separate visual verification record. This package favors PDF-only references.
Viewer labels and an offset are navigation aids, never verification.

All age bands are editorial proposals, distinct from source numerical labels and
readiness/interest. Toddler-wide or all-ages statements retain this book's roughly
one-to-three context. No label from a neighboring table row can be inherited.

Safety-sensitive records describe the author's perspective and retain the actual
cautions; they add no outside advice or claim of independent medical verification.
No material, illustration, parent script or general principle can stand in for the
full evidence of a specific activity/care procedure. Raw text and renders remain in
ignored `tmp/toddler-research/` and never enter the public app.

Task 4 must reconcile both book handoffs, draft its pilots, and commission separate
fresh xhigh source and spirit/tone reviews on every exact eventual entry. This
package's independent completeness audit is a different research-quality gate.
