# Enriched writer input

This is internal input assembled after research, not the reader's capture form.
Use JSON strings for dates and identifiers. A minimal illustrative payload is:

```json
{
  "record": {
    "title": "Example Work",
    "authors": ["Example Author"],
    "finished": "2026-10-20",
    "metadataSources": [{
      "url": "https://publisher.example/work",
      "retrieved": "2026-10-21",
      "fields": ["title", "authors"]
    }]
  },
  "provenance": "Identity verified from the publisher. No print edition or original publication year was verified, so those fields are absent."
}
```

Never publish this example. Replace it with the reader's actual work, dates,
verified URLs, and research. Include verified optional statistics and identifiers
directly in `record`, using `SCHEMA.md`. `status` defaults to `read`. The helper
requires at least one source and nonempty provenance, but cannot evaluate truth.

For an existing record, add top-level `target` (relative to `vault/reading-log/`)
and `expectedSha256` from a fresh dry run or `--list`. Existing fields and body
are preserved unless explicitly replaced; sources are combined and provenance
is appended. Changing the reference ISBN without supplying a new page count
removes the previous edition's page count. Verify all retained metadata still
describes the same work. Same work/date is a no-op even if new metadata differs.

Replacing a previous completion requires top-level `replaceFinished`, equal to
the old date or null, **only after the reader has confirmed the replacement**.
The helper cannot establish that consent. Omit this property for an unfinished
or new record. A target must already exist and match the work identity.

New filenames are derived from title and, on collision, author. Do not pass an
arbitrary new filename. Traversal, unsafe filenames, symlinks, ambiguous matches,
and stale records are rejected. A `.capture.lock` serializes helper writers;
never remove another active writer's lock to proceed.

CLI output is JSON (use `node scripts/log-finished-book.mjs` to omit npm's header).
Exit 0 means ready, locally written, or already logged; exit 2 means clarification;
exit 1 means an error. Ready/written output includes the relative target, action,
old digest, new digest, and Markdown. `written` does not mean committed or deployed.
