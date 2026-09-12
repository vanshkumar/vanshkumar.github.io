# Consolidated editorial trial — completed and paused

The user authorized five entries / nine placements, two independent xhigh
reviews, at most one correction pass, and then a stop. That scope is complete.
Both reviewers passed every placement. There were no requested corrections,
unresolved editorial findings, or changes to the reader text.

## Reviewed result

| Entry | New placements | Source | Tone |
| --- | --- | --- | --- |
| early-newborn-conversation | 0–3 | Pass | Pass |
| early-steady-toy | 3–6, 6–9, 9–12 | Pass | Pass |
| baby-language | 3–6 | Pass | Pass |
| baby-songs | 0–3, 3–6 | Pass | Pass |
| baby-diaper-conversation | 0–3, 3–6 | Pass | Pass |

`SELECTION-RECEIPT.json` is the final partial receipt. It binds the same frozen
birth–6 r01 text, exact rendered surfaces, registered bodies and original-page
reading evidence to distinct source/tone reviewers. It explicitly leaves 104
other contribution placements unreviewed and grants no publication or art approval.
The earlier receipt remains preserved; it was superseded only to correct an old
hard-coded verification date in the helper. No second semantic review was needed.

The new voice entry retains pauses, optional responses and the awake-baby sibling
condition. The toy retains the appendix's age OR sitting wording, attachment
conditions and self-initiated-sitting context. Existing language, song and care
bodies retain their approvals; their new age presentations were independently
checked. Actual table/page images were inspected, including requested extra
heading/context pages. Author research logs were not counted as reviewer reads.

## Structural changes

The active workflow now has one editor and two reviewers across topic batches.
The three earlier population tasks and their authors stayed paused throughout.
The existing packet helper now offers compact references; the existing compiler
generates exact reports from five explicit grouped decisions per reviewer.
The verifier gained an explicit batch selection without weakening its full gate.

`COVERAGE.jsonl` is the consolidated editorial queue for all 1,309 original ideas.
It imports 7,085 saved mapping records, retaining provenance, age distinctions,
variants, reasons, qualifications and holds. There are no unknown original IDs.
The queue flags 3,270 age cells without an explicit saved mapping and 1,073 cells
with potentially conflicting draft signatures. These are applicability/reconciliation
work items, not counts of missing content or proven semantic errors. Draft coverage
decisions have not acquired approval merely because their target text passed.
The remaining whole-book reconciliation was deliberately not performed in this trial.

## Cost checkpoint

- Two reviewer invocations; zero follow-up review turns and zero correction rounds.
- Approximately 12 minutes through validation, including editor preparation,
  helper changes, consolidation, source extraction and concurrent reviews.
- Compact packet: 48,525 bytes versus 67,592 for the existing packet.
- Available original source text: 70,995 bytes plus nine full-page images.
- Reviewer decisions/read logs: 20,432 bytes combined; script-expanded reports:
  40,011 bytes. Reviewers did not author that expansion manually.
- Source reviewer reported approximately 14 top-level tool calls; tone reported
  nine orchestration calls. Both encountered truncated combined output and used
  targeted recovery reads. Their differing call conventions are retained in METRICS.json.
- Actual token counts were unavailable. These sizes exclude additional instructions,
  tool descriptions, reasoning and coordinator overhead. They are not token savings.

The trial demonstrates that grouped decisions and an explicit partial gate work
without dropping the two editorial checks. It does not establish a percentage
cost improvement or prove that larger, correction-heavy batches will behave similarly.
For a future authorized batch, read one entry or source unit per bounded output;
retain the same reviewers where context remains usable. Do not concatenate large
packets and source units into one tool result.

## Validation and stop boundary

Packet equivalence checked all actual reader text/deltas, placement fields,
source references and substantive age reasoning. Existing frozen-input checks
passed. The full contribution command correctly rejected these nine passes as
insufficient for the remaining 104 targets. The public approved payload is unchanged.
No artwork, application edits, build, browser checks or deployment were performed.

Both reviewers finished. All work is paused for the user's cost/quality assessment.
Do not restart the old author pipelines, create final-integration work, or expand
the batch without explicit continuation.
