# Groundwork review and validation

2026-09-10. This is software/contract review, **not source or tone approval**.
The full pilot content remains pending. No new dependency or test suite was added.

## Independent xhigh reviews

- `/root/architecture_audit` used fresh context, read the preflight/foundation
  contract and original app, and returned a read-only compatibility assessment.
  It checked the eventual private review helper/contract independently too.
- `/root/implementation_review` used fresh context and compared the implementation
  against the original saved files in ignored `tmp/pilots-architecture/`.
  It reported two defects and rechecked their specific corrections.
- Neither agent authored app code or this report. Their subsequent bounded
  rechecks retained xhigh. No design score review or full content approval occurred.

| Finding | Resolution and independent recheck |
| --- | --- |
| Studies-index logo defaulted to 6–9 after returning from another age | Its link now uses the selected age. Implementation reviewer confirmed. |
| Invalid topic/entry combination had the unavailable view but a valid-entry document title | Home and document title now use the same age/topic selector. Implementation reviewer confirmed. |
| Art review hash did not cover qualifications in steps/detail/principle/references | It now binds the full text/placement hash. Architecture reviewer confirmed that prose/qualification changes invalidate art-context approval while image-only changes preserve text approval identity. |
| Review snapshots shared caller arrays/objects, allowing post-hash mutation | Selected values and private provenance are copied. Architecture reviewer confirmed snapshot/digest consistency after caller mutations. |
| Visible display context was optional and bypassed field selection | Required public fields are selected, nested topic/reference labels are selected and matched to placements/references, missing context throws. Architecture reviewer confirmed private extras do not change the public projection. |

All five findings are resolved within their bounded scopes.

## Lightweight checks

- Direct Vite production build passed after final app corrections (35 modules).
  `noindex, nofollow` remains. No source PDFs or extracts were added to assets.
- Independent implementation checks found all original six legacy records'
  pre-existing fields unchanged. The six existing home action/invitation pairs
  moved into their corresponding source records without rewriting them.
- Independent route checks covered the existing ten concept IDs across seven
  age IDs. Runtime selectors reject unsupported age/topic entry combinations.
- Bounded server-side rendering using existing React/Vite covered a perspective
  and everyday situation with absent steps, paragraph detail, and two book
  references. Temporary shape probes used existing text and were never saved
  to app content or treated as source-approved variants.
- Structured discontinuous PDF-page formatting and separate text/art/provenance
  digest behavior passed targeted assertions. Six baseline projection hashes
  were checked independently against their frozen public projections.
- `git diff --check` passed for owned tracked files. Final bundle scan found no
  baseline snapshot name, review hashes, research-ready state, printed-verification
  metadata or read-log IDs in emitted assets. No private-content import exists.

## Browser check

The previous documented port was unavailable. Started Vite on the same exact
127.0.0.1:5174 port with `--strictPort`; no port scan or duplicate live server.
Used one hidden working browser tab after the initial unavailable-server tab.
No user-facing browser handoff was performed because this is a delegated task.

Checked the accepted baby home at the default desktop viewport, the toddler home
and reading view at 390×844, opening selection, Explore more, topic lists,
entry references, Back/Forward, return focus, 2–3-year empty state, and a direct
unsupported newborn/entry link. Phone reading/topic document widths were 390px;
no horizontal document overflow. The original Little windows study still displays
its three legacy toddler entries and links, retaining the selected age.
Temporary viewport override was reset after testing.

The accepted illustration/headline/reading-column arrangement is preserved.
The new Explore more link sits below that opening, and the deeper pages reuse
its typography/palette. No new artwork was generated or integrated.

Two development-only createRoot warnings were captured while editing `main.jsx`
through hot reload; the normal reader routes rendered and navigated successfully.
They are not a production build failure. The content pilots still need later
browser checks using their final real long titles, kinds, references and artwork.

## Exact principal revisions checked

SHA-256 at the end of groundwork:

| File | SHA-256 |
| --- | --- |
| `src/HomeStudy.jsx` | `fac2bbb16457687333b2d3ac7718d5ad1590094265c11956947ce661af9a7cd6` |
| `src/main.jsx` | `0438c5ff719beb28a9d111e7a9ea140a2622cc752d221264606cfa25a47c3248` |
| `src/home.css` | `55de72c5b21d2f1a3ead85c5975febd09ac3135fcbc2219e6672a13f4786a6e1` |
| `src/content.js` | `73a023d71b537d9fcb9017ef5018be44a869f11068882ddeddcebecc010da77e` |
| `content/pilots/review-snapshot.mjs` | `420cda1abdfc2fbbebe2be1e2e05a1befafe1f43e2d3999d2b96f9155a7d99b9` |
| `content/pilots/CONTRACT.md` | `065a76983538fd90b30b1184fcd222223cef52cc1acfe95d590883577b71bd52` |
| `content/pilots/PROTOTYPE_BASELINE.json` | `11ea0b6dd6c3f9c6d7900915205569c934642491cae7f26625b59c99ff5e3d83` |
