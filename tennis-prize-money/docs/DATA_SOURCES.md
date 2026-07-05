# Data Sources

## Current Scope

Version `0.1.0` ships a small seed dataset for 2025 Grand Slam men's singles prize money. The active dataset is stored in:

- `src/data/static/seedDatasetMetadata.json`
- `src/data/raw/source-metadata/grandSlam2025Sources.json`
- `src/data/normalized/grandSlam2025MensSingles.json`

The first server-side refresh pipeline and generic JSON manifest adapter are implemented. Tournament-specific source adapters are not implemented yet, so the seed rows below remain manually normalized from the cited sources and validated at app import time, in Vitest fixtures, and during `npm run refresh:data`.

## Source Inventory

| Source id | URL | Publisher | Fields covered | Confidence | Known limitations | Adapter implemented |
| --- | --- | --- | --- | --- | --- | --- |
| `ao-2025-prize-money-release` | [Australian Open prize money increases more than 11 per cent in 2025](https://ausopen.com/articles/news/australian-open-prize-money-increases-more-11-cent-2025) | Australian Open / Tennis Australia | Total 2025 AO prize pool, currency, headline singles payouts | High | Article is summary-level; full round table comes from the PDF source. | No |
| `ao-2025-prize-money-pdf` | [Australian Open Prize Money 2021-2025](https://www.tennis.com.au/wp-content/uploads/2025/01/AO25-Prize-Money.pdf) | Tennis Australia | Men's/women's singles per-player round payouts, singles event total, total tournament prize money | High | PDF parsing is manual in v0.1; future adapter should parse tables. | No |
| `roland-garros-2025-secondary-prize-money` | [2025 French Open prize money table](https://en.wikipedia.org/wiki/2025_French_Open#Prize_money) | Wikipedia, citing The Independent | Singles round payouts and total tournament prize money | Medium | No official Roland Garros/FFT prize-money URL was verified in this task; replace with official source when found. | No |
| `wimbledon-2025-prize-money-pdf` | [The Championships, Wimbledon 2025 Prize Money](https://www.wimbledon.com/pdf/Wimbledon_Prize_Money_2025.pdf) | The All England Lawn Tennis Club / Wimbledon | Gentlemen's/ladies' singles per-player round payouts, singles event total, total tournament prize money | High | PDF parsing is manual in v0.1; future adapter should parse tables. | No |
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
| `australian-open-2025-ms` | Men's singles, 128-player main draw | 33,108,000 | AUD | Official | High | Official per-event singles total from Tennis Australia PDF. |
| `roland-garros-2025-ms` | Men's singles, 128-player main draw | 20,509,000 | EUR | Derived | Medium | Weighted sum of listed singles round payouts from secondary source. |
| `wimbledon-2025-ms` | Gentlemen's singles, 128-player main draw | 19,414,000 | GBP | Official | High | Official per-event singles total from Wimbledon PDF. |
| `us-open-2025-ms` | Men's singles, 128-player main draw | 31,620,000 | USD | Derived | Medium | Weighted sum of listed singles round payouts, cross-checked against official-source citation. |

## Financial Data Status

No tournament-level revenue, profit, or surplus values are included in the v0.1 seed. The dashboard leaves those fields unavailable for every seed record. Organization-level revenues, press estimates, and player-share claims are not normalized as compatible denominators unless a future task can tie them to a specific tournament/event and currency.

## Primary-Question Research Leads

The 2026-07-05 research sweep focused on the dashboard's primary question: prize money as a percentage of tournament revenue or profit/surplus. These leads are not normalized into JSON yet.

| Priority | Tournament | Candidate numerator | Candidate denominator | Current recommendation |
| --- | --- | --- | --- | --- |
| 1 | Wimbledon | Official total prize money: 2025 £53.5m and 2024 £50.0m from Wimbledon prize-money PDFs. | AELTC Championships Ltd turnover: 2025 £423.626m and 2024 £406.507m from Companies House filings; operating profit is available but needs an operating-company caveat. | Best next production candidate. Add as tournament-total records after verifying filings and labeling denominator as Championships operating-company turnover. |
| 2 | Roland Garros | Total prize money lead: 2025 €56.352m and 2024 €53.478m from Roland Garros press-kit citations / secondary tables. | Revenue leads: 2025 €395m from Guardian reporting on a player statement; 2024 €340m from secondary/Bloomberg-cited reporting. No tournament profit/surplus found. | Possible revenue-share row only with medium/low confidence and visible secondary-source caveat; do not add profit/surplus. |
| 3 | Australian Open | Official total prize money: 2025 A$96.5m and 2024 A$86.5m from AO/Tennis Australia sources. | Tennis Australia annual reports disclose organization-level revenue and surplus, not AO tournament revenue/profit. | Add official tournament-total numerator; keep revenue/profit unavailable unless AO-specific financial denominators are found. |
| 4 | US Open | Official total player compensation/prize package: 2024 US$75.0m and 2025 US$90.0m from US Open sources. | USTA Form 990 values are organization-wide; a secondary FT operating-revenue lead needs primary confirmation. No tournament profit/surplus found. | Add official tournament-total numerator; keep revenue/profit unavailable until US Open-specific financial denominators are confirmed. |

Useful lead URLs:

- Wimbledon 2025 prize money: <https://www.wimbledon.com/pdf/Wimbledon_Prize_Money_2025.pdf>
- Wimbledon 2024 prize money: <https://www.wimbledon.com/pdf/Wimbledon_Prize_Money_2024.pdf>
- AELTC Championships Ltd filings: <https://find-and-update.company-information.service.gov.uk/company/07546773/filing-history>
- AO 2025 prize release: <https://ausopen.com/articles/news/australian-open-prize-money-increases-more-11-cent-2025>
- AO25 prize-money PDF: <https://www.tennis.com.au/wp-content/uploads/2025/01/AO25-Prize-Money.pdf>
- Tennis Australia annual reports: <https://www.tennis.com.au/about-us/reports-publications-national-policies/annual-reports>
- US Open 2024 prize-money release: <https://www.usopen.org/en_US/news/articles/2024-08-07/2024_us_open_prize_money_will_be_largest_purse_in_tennis_history.html>
- US Open 2025 prize-money release: <https://www.usopen.org/en_US/news/articles/2025-08-06/2025_us_open_prize_money_sets_record_for_largest_purse_in_tennis_history.html>
- USTA Form 990 summary: <https://projects.propublica.org/nonprofits/organizations/135459420>
- Roland Garros revenue lead: <https://www.theguardian.com/sport/2026/may/03/tennis-french-open-prize-money-novak-djokovic-jannik-sinner-aryna-sabalenka>
- Roland Garros 2025 prize-money lead: <https://de.wikipedia.org/wiki/French_Open_2025>

Data-model implication: the primary ratio should prefer full tournament prize-money totals over event-level men's singles rows. Event-level rows can still exist, but any comparison to tournament revenue must be labeled as partial or kept unavailable until the numerator scope is made explicit.

## v0.1 Audit Status

- No active mock/sample rows are present in the `real` seed dataset.
- Every active source row includes URL, publisher, source type, accessed date, confidence, and notes.
- Every available prize-pool, payout, and round-payout value references at least one source id.
- Medium-confidence rows remain visibly caveated in source notes, record caveats, and the dashboard source panel.
- Revenue and profit/surplus are unavailable, not estimated or inferred.

## Access Date

All v0.1 source entries were accessed on 2026-07-05.
