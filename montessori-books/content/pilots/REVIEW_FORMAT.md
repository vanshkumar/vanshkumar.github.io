# Final pilot review records

Use this small common shape for the final independent source and spirit/tone
reviews. The earlier prototype records remain unchanged in their original format.
Each role writes its own immutable file; a later correction review is a new file.

```json
{
  "id": "pilot-source-r01",
  "reviewer": {"task": "/root/fresh_reviewer", "role": "source", "reasoning": "xhigh"},
  "date": "2026-09-10",
  "scope": "Exact frozen projections and actual rendered surfaces",
  "renderedSurfaces": {"path": "content/pilots/revisions/r01/RENDERED_SURFACES.json", "sha256": "exact file hash"},
  "readLogs": [
    {"id": "source.baby.context", "sourceId": "baby-2021", "pdfPages": [{"start": 98, "end": 110}], "mode": "full-text", "description": "Actual complete original-page text read, with the named context."}
  ],
  "reviews": [
    {
      "id": "pilot-source-r01.6-9.entry-id",
      "entryId": "entry-id",
      "placementId": "6-9.entry-id",
      "snapshotPath": "content/pilots/revisions/r01/snapshots/6-9.entry-id.json",
      "snapshotFileSha256": "exact file hash",
      "textPlacementSha256": "exact component hash",
      "artContextSha256": null,
      "readLogIds": ["source.baby.context"],
      "textPlacement": {"verdict": "pass", "issues": [], "assessment": "What the exact short and full surfaces preserve."},
      "artContext": null
    }
  ]
}
```

The other role is `tone`; use a distinct independent reviewer task. Acceptable
text verdicts are `pass`, `revise`, `hold`. For an illustrated placement,
`artContext` is a separate object with its own verdict, issues, assessment and
actual asset visual-read evidence. A source/text pass does not imply an art pass.
Record that evidence in `artContext.assetReads[]`, each with `src`, exact image
`sha256`, `mode: "actual-image-visual"`, and a description of the actual inspection.
Every issue has a stable `id`, severity, exact affected field/surface, finding,
required correction, and `status: open`. Do not mark a change resolved before
reviewing its exact replacement. Keep resolution links in the new re-review and
the integrator's issue disposition record; preserve earlier findings unchanged.

Log only original source pages actually read by this reviewer. Per-page complete
text and readable original-page visual modes are `full-text` and
`full-page-visual`. Navigation, generating an extract, contact-sheet inventory,
another reader's work and a bitmap inspection do not count as complete source
reading. Link every entry's cited pages and relevant full context through its
`readLogIds`. Use extra logs for art inspections and read methods as appropriate.

Read `RENDERED_SURFACES.json`, the renderer, exact frozen text/age/topic metadata,
and the actual images. Topic summaries must carry their own necessary meaning;
private caveats and detail-only explanations cannot repair a misleading short
surface. Apply the source-only sensitivity charter while preserving ordinary,
natural invitations and useful parent-facing prose.

The offline integrator checks both matching role passes for every current
component, source-page coverage, immutable snapshot/file identity, and absence
of open issues. An unchanged component may retain a pass linked to its original
immutable snapshot. Changed prose, placement, references, public qualifications
or image bytes requires the affected component review to be renewed.
