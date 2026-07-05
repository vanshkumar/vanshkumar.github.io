# Data Sources

## Current Scope

Version `0.1.0` ships a small seed dataset for Grand Slam prize-money economics. The active dataset now includes Wimbledon and Australian Open full-tournament rows for 2024-2025 plus 2025 Grand Slam men's singles event-level rows. The active dataset is stored in:

- `src/data/static/seedDatasetMetadata.json`
- `src/data/raw/source-metadata/grandSlam2025Sources.json`
- `src/data/normalized/grandSlam2025MensSingles.json`

The first server-side refresh pipeline and generic JSON manifest adapter are implemented. Tournament-specific source adapters are not implemented yet, so the seed rows below remain manually normalized from the cited sources and validated at app import time, in Vitest fixtures, and during `npm run refresh:data`.

## Source Inventory

| Source id | URL | Publisher | Fields covered | Confidence | Known limitations | Adapter implemented |
| --- | --- | --- | --- | --- | --- | --- |
| `ao-2025-prize-money-release` | [Australian Open prize money increases more than 11 per cent in 2025](https://ausopen.com/articles/news/australian-open-prize-money-increases-more-11-cent-2025) | Australian Open / Tennis Australia | Total 2025 AO prize pool, currency, headline singles payouts | High | Article is summary-level; full round table comes from the PDF source. | No |
| `ao-2025-prize-money-pdf` | [Australian Open Prize Money 2021-2025](https://www.tennis.com.au/wp-content/uploads/2025/01/AO25-Prize-Money.pdf) | Tennis Australia | 2021-2025 total Australian Open prize money, men's/women's singles per-player round payouts, singles event total | High | PDF parsing is manual in v0.1; future adapter should parse tables. | No |
| `roland-garros-2025-secondary-prize-money` | [2025 French Open prize money table](https://en.wikipedia.org/wiki/2025_French_Open#Prize_money) | Wikipedia, citing The Independent | Singles round payouts and total tournament prize money | Medium | No official Roland Garros/FFT prize-money URL was verified in this task; replace with official source when found. | No |
| `wimbledon-2025-prize-money-pdf` | [The Championships, Wimbledon 2025 Prize Money](https://www.wimbledon.com/pdf/Wimbledon_Prize_Money_2025.pdf) | The All England Lawn Tennis Club / Wimbledon | 2025 total prize money, tennis-events prize money, estimated per diems, gentlemen's/ladies' singles per-player round payouts | High | PDF parsing is manual in v0.1; future adapter should parse tables. Total prize money is £53.5m, not £53.55m. | No |
| `wimbledon-2024-prize-money-pdf` | [The Championships, Wimbledon 2024 Prize Money](https://www.wimbledon.com/pdf/Wimbledon_Prize_Money_2024.pdf) | The All England Lawn Tennis Club / Wimbledon | 2024 total prize money, tennis-events prize money, estimated per diems, gentlemen's/ladies' singles per-player round payouts | High | PDF parsing is manual in v0.1; future adapter should parse tables. | No |
| `aeltc-championships-2025-accounts` | [AELTC Championships Ltd accounts, year ended 31 July 2025](https://find-and-update.company-information.service.gov.uk/company/07546773/filing-history/MzUxNzE0NjY3OGFkaXF6a2N4/document?download=0&format=pdf) | Companies House / AELTC Championships Ltd | 2025 turnover, operating profit, profit before tax, profit after tax, LTA distribution, and 2024 comparatives | High | Companies House PDF is image-scanned; values were manually verified from the profit-and-loss account. Denominators are Championships operating-company values. | No |
| `us-open-2025-prize-money-page` | [2025 US Open Prize Money](https://www.usopen.org/en_US/visit/prize_money.html) | United States Tennis Association / US Open | US Open prize-money table and total player compensation | Medium | Official page was reachable but did not expose crawler-readable text in this task. | No |
| `us-open-2025-secondary-crosscheck` | [US Open prize-money table](https://en.wikipedia.org/wiki/US_Open_(tennis)#Prize_money) | Wikipedia, citing the official US Open prize-money page | Singles round payouts, combined singles total, total player compensation | Medium | Used only as a cross-check because the official page did not parse in this environment. | No |

## Refresh Adapter Status

The current refresh adapter accepts a server-side JSON manifest with this shape:

```json
{
  "sources": [],
  "records": []
}
```

Those arrays must already match the app data model. The adapter fetches the manifest, normalizes through the existing parsers, merges rows by id, validates the full dataset, and writes static JSON only after validation succeeds.

Official tournament page adapters, PDF table parsers, and financial-report adapters remain future work.

## Normalized Seed Rows

| Record | Event scope | Prize-pool value | Currency | Status | Confidence | Notes |
| --- | --- | ---: | --- | --- | --- | --- |
| `wimbledon-2025-tournament-total` | Full tournament | 53,500,000 | GBP | Official | High | Official Wimbledon total prize money, paired with AELTC Championships Ltd turnover and operating profit. |
| `wimbledon-2024-tournament-total` | Full tournament | 50,000,000 | GBP | Official | High | Official Wimbledon total prize money, paired with AELTC Championships Ltd turnover and operating profit from the accounts comparative column. |
| `australian-open-2025-tournament-total` | Full tournament | 96,500,000 | AUD | Official | High | Official AO total prize pool; revenue/profit unavailable. |
| `australian-open-2024-tournament-total` | Full tournament | 86,500,000 | AUD | Official | High | Official AO total prize pool from the AO 2021-2025 PDF; revenue/profit unavailable. |
| `australian-open-2025-ms` | Men's singles, 128-player main draw | 33,108,000 | AUD | Official | High | Official per-event singles total from Tennis Australia PDF. |
| `roland-garros-2025-ms` | Men's singles, 128-player main draw | 20,509,000 | EUR | Derived | Medium | Weighted sum of listed singles round payouts from secondary source. |
| `wimbledon-2025-ms` | Gentlemen's singles, 128-player main draw | 19,414,000 | GBP | Official | High | Official per-event singles total from Wimbledon PDF. |
| `us-open-2025-ms` | Men's singles, 128-player main draw | 31,620,000 | USD | Derived | Medium | Weighted sum of listed singles round payouts, cross-checked against official-source citation. |

## Financial Data Status

Wimbledon 2024 and 2025 full-tournament rows include compatible denominators from AELTC Championships Ltd accounts:

| Year | Revenue denominator | Profit/surplus denominator | Notes |
| --- | ---: | ---: | --- |
| 2025 | GBP 423,626,000 | GBP 52,720,000 | Turnover and operating profit for AELTC Championships Ltd, the Championships operating company. |
| 2024 | GBP 406,507,000 | GBP 54,332,000 | 2024 comparative values in the 2025 accounts. |

The profit/surplus denominator is operating profit before net finance income, before the division of net available surplus to LTA Operations, and before tax. The LTA distribution is documented but not treated as profit.

Australian Open, Roland Garros, and US Open records do not include compatible tournament-specific revenue, profit, or surplus denominators. Organization-level revenues, press estimates, player-share claims, and USTA/Tennis Australia annual-report values are not normalized as compatible denominators unless a future task can tie them to a specific tournament/event and currency.

## Primary-Question Research Leads

The 2026-07-05 research sweep focused on the dashboard's primary question: prize money as a percentage of tournament revenue or profit/surplus. Wimbledon and Australian Open official numerator rows from that sweep are now normalized as described above. Remaining leads:

| Priority | Tournament | Candidate numerator | Candidate denominator | Current recommendation |
| --- | --- | --- | --- | --- |
| 1 | Roland Garros | Total prize money lead: 2025 EUR 56.352m and 2024 EUR 53.478m from Roland Garros press-kit citations / secondary tables. | Revenue leads: 2025 EUR 395m from Guardian reporting on a player statement; 2024 EUR 340m from secondary/Bloomberg-cited reporting. No tournament profit/surplus found. | Keep as research lead until official FFT/Roland Garros or audited sources are verified. |
| 2 | US Open | Official total player compensation/purse lead: 2024 USD 75.0m and 2025 USD 90.0m. AP corroborates that the 2025 split is nearly USD 85m competition prize money plus support/expense coverage. | USTA Form 990 values are organization-wide; no tournament-specific profit/surplus found. | Do not normalize as prize money until the model can distinguish competition prize money from total player compensation/support, or an official parseable competition-prize total is verified. |

Useful lead URLs:

- Wimbledon 2025 prize money: <https://www.wimbledon.com/pdf/Wimbledon_Prize_Money_2025.pdf>
- Wimbledon 2024 prize money: <https://www.wimbledon.com/pdf/Wimbledon_Prize_Money_2024.pdf>
- AELTC Championships Ltd filings: <https://find-and-update.company-information.service.gov.uk/company/07546773/filing-history>
- AO 2025 prize release: <https://ausopen.com/articles/news/australian-open-prize-money-increases-more-11-cent-2025>
- AO25 prize-money PDF: <https://www.tennis.com.au/wp-content/uploads/2025/01/AO25-Prize-Money.pdf>
- Tennis Australia annual reports: <https://www.tennis.com.au/about-us/reports-publications-national-policies/annual-reports>
- US Open 2024 prize-money release: <https://www.usopen.org/en_US/news/articles/2024-08-07/2024_us_open_prize_money_will_be_largest_purse_in_tennis_history.html>
- US Open 2025 prize-money release: <https://www.usopen.org/en_US/news/articles/2025-08-06/2025_us_open_prize_money_sets_record_for_largest_purse_in_tennis_history.html>
- AP 2024 US Open compensation corroboration: <https://apnews.com/article/ebe63ae1aa32f133315b64b633a57af7>
- AP 2025 US Open compensation/prize-money split corroboration: <https://apnews.com/article/8134bd075f194c38011b3e8eff81fd56>
- USTA Form 990 summary: <https://projects.propublica.org/nonprofits/organizations/135459420>
- Roland Garros revenue lead: <https://www.theguardian.com/sport/2026/may/03/tennis-french-open-prize-money-novak-djokovic-jannik-sinner-aryna-sabalenka>
- Roland Garros 2025 prize-money lead: <https://de.wikipedia.org/wiki/French_Open_2025>

Data-model implication: the primary ratio now requires compatible numerator scope. Full-tournament financial denominators require `tournament_total` prize-money scope; event-level rows remain partial and will not compute against tournament-level denominators.

## v0.1 Audit Status

- No active mock/sample rows are present in the `real` seed dataset.
- Every active source row includes URL, publisher, source type, accessed date, confidence, and notes.
- Every available prize-pool, payout, and round-payout value references at least one source id.
- Medium-confidence rows remain visibly caveated in source notes, record caveats, and the dashboard source panel.
- Revenue and profit/surplus are unavailable, not estimated or inferred, except for the verified Wimbledon full-tournament rows.

## Access Date

All v0.1 source entries were accessed on 2026-07-05.
