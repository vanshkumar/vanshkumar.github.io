# Future Work

## Data Coverage

- Add more tournaments beyond the four Grand Slam men's singles rows, starting with women's singles and prior-year Grand Slam rows so year-over-year growth can become available.
- Add doubles, mixed doubles, wheelchair, qualifying, per diem, and player-support data only when allocation semantics are clear.
- Add compatible tournament-level revenue, profit, or surplus denominators from official financial statements, annual reports, Form 990 filings, or clearly scoped tournament reports.

## Source Adapters

- Build richer official source adapters for tournament prize-money pages instead of relying on already-normalized JSON manifests.
- Add PDF/report parsing improvements for official prize-money PDFs and financial reports, with table-level validation and parser tests.
- Replace medium-confidence Roland Garros and US Open rows when clearer official, parseable sources are available.

## Financial Modeling

- Add FX conversion only if needed, with explicit FX source metadata, conversion date, source confidence, and tests that keep original and converted values distinct.
- Model draw size and allocation basis more explicitly so round-payout percentages can distinguish per-player values from total draw allocation.
- Keep organization-level financial context separate from tournament/event denominators unless a source provides a compatible bridge.

## Persistence And Refresh

- Consider database, KV, or object storage persistence if source coverage grows beyond static JSON ergonomics.
- Add stronger authentication for browser-triggered refresh, such as short-lived signed requests, rate limiting, and tighter CORS origins on the external backend.
- Add adapter-level dry-run reports that list changed source ids, record ids, confidence changes, and caveat changes before writing static JSON.

## Provenance UI

- Improve the provenance UI with value-level source links, source-type labels, confidence explanations, and per-field notes instead of only record-level source panels.
- Add a source confidence legend and filters for official, reported, derived, estimated, unavailable, and mock statuses.
- Add visible "why unavailable" affordances near financial ratios and charts so caveats are easier to scan.

## Deployment

- Add `tennis-prize-money/` install/build/copy steps to the parent GitHub Pages workflow when the dashboard is ready to publish.
- Add a smoke check for the built `/tennis-prize-money/` artifact after it is copied into the combined Pages output.
