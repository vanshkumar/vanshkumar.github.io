# Full population handoff

Completed 2026-09-13T00:20:01Z; local date 2026-09-12.

## Result

The app now serves 174 canonical entries across 645 placements in seven age bands
from birth through age three. Each age keeps the accepted design: three starting
ideas, five topics, and a focused reading view with readiness/context and original
book references. Reader wording remains suggestions and attributed book summaries,
with parent capacity, child agency and source qualifications retained.

The 101 frozen pilot bodies and 115 pilot placements are unchanged. The remaining
530 placements have distinct source and tone judgments from the retained xhigh
reviewers. Six new original images passed both reviewers across 18 combinations;
six pilot illustrated contexts retain their approvals. Both reviewers inspected
all six new assets and 28 supplied screenshots. No unresolved review defect remains.

## Coverage and approval evidence

All 1,309 source ideas have a resolved allocation and reason: 174 included,
506 combined, 528 context-only and 101 excluded. These dispositions preserve the
books’ distinctions and deliberate omissions; they do not claim all source material
is suitable as a public activity. See `content/editorial/coverage/RESOLVED_COVERAGE.jsonl`
and `RESOLUTION_SUMMARY.json`.

Text receipts:
- `content/birth-6/revisions/r03/CONTRIBUTION_RECEIPT.json`: 113 placements.
- `content/6-18/revisions/r06/CONTRIBUTION_RECEIPT.json`: 224 placements.
- `content/18-36/revisions/r03/CONTRIBUTION_RECEIPT.json`: 193 placements.

Final release: `content/APPROVED_RELEASE.json`.
Integration proof: `content/editorial/full-r01/INTEGRATION_RECEIPT.json`.
Public payload: `src/guide/approved.json`, byte-identical to the reviewed full payload.

The integration verifies exact text hashes, canonical pilot bodies, actual rendered
surfaces, original/retained same-reviewer reading, art evidence, source allocations,
asset hashes and the public field boundary. Its only navigation normalization binds
an implicit default opening to the same already-approved opening explicitly in the
URL; each instance is recorded. It does not manufacture an editorial approval.
Historical reviews and receipts remain intact.

## Final verification

One Vite production build passed (35 modules; build step 253 ms). It emitted an
informational >500 kB chunk warning: the complete guide bundle is 645,881 bytes,
151.39 kB gzip. No splitting or further prototype performance work was introduced.
The production output contains one HTML file, one CSS file, one JS file and eight
approved WebP illustrations. No PDFs, source research, review packets, or legacy
design-study data are included. The release payload, receipt, renderer and all
built artwork hashes match the approved release.

Brief browser QA passed at 1280×1050 and 390×844. All seven age selectors load the
matching title, three opening choices and image without horizontal overflow.
Opening changes, reading views and references, the five-topic navigation, a new
family entry, and the dressing illustration work. Reader return links restore the
originating entry’s focus. No browser console errors were recorded. The temporary
viewport override was reset. See `BROWSER_CHECK.json`; local screenshots are saved
under ignored `tmp/final-qa/`. This was a brief prototype check, not a full automated
regression suite.

## Time and cost boundary

Recorded active elapsed time for the full continuation: approximately **157.1 minutes**,
excluding the user-requested pause. The exact timestamps are in
`content/editorial/RUN_METRICS.json`. This includes reviewer work, administrative
joins, integration, QA and documentation; separate administrative time was not
measured. Final administrative work primarily expanded existing decisions, verified
receipts, resolved the default-opening link binding, and bound actual art evidence.

Actual token counts and a complete run-wide agent-call count are unavailable.
The metrics file preserves limited approximate reviewer call counts with their
scope. The public payload is 642,317 bytes; the six compact art packets total
94,827 bytes. Saved report sizes are recorded as selected artifact-size proxies,
not token savings. No unsupported savings percentage is claimed.

## State left for the user

The build is available at http://127.0.0.1:4174/montessori-books/ and the preview tab
is retained. No deployment or commit was performed; the prototype’s noindex setting
is preserved. The two retained reviewers are finished. The three historical
population tasks stay paused. No further content/review/integration work is pending
within this authorized scope.

## Publishing follow-up — 2026-09-12

The user subsequently authorized commit and push. The parent Pages workflow now
builds and assembles this sibling app at `/montessori-books/`. `index.html` removes
the prototype robots restriction, declares the canonical public URL, and includes
the parent site’s existing Google Analytics tag. Only that HTML fingerprint in
the release changed; the historical integration receipt, exact reviewed content,
artwork and visible presentation remain unchanged. The no-deployment statement
above describes the completed population checkpoint before this authorization.
