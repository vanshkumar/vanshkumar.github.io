# Data Sources

## Current Scope

Task 3 adds a small seed dataset for 2025 Grand Slam men's singles prize money. The active dataset is stored in:

- `src/data/static/seedDatasetMetadata.json`
- `src/data/raw/source-metadata/grandSlam2025Sources.json`
- `src/data/normalized/grandSlam2025MensSingles.json`

No source adapters are implemented yet. All rows are manually normalized from the cited sources and validated at app import time and in Vitest fixtures.

## Source Inventory

| Source id | URL | Publisher | Fields covered | Confidence | Known limitations | Adapter implemented |
| --- | --- | --- | --- | --- | --- | --- |
| `ao-2025-prize-money-release` | [Australian Open prize money increases more than 11 per cent in 2025](https://ausopen.com/articles/news/australian-open-prize-money-increases-more-11-cent-2025) | Australian Open / Tennis Australia | Total 2025 AO prize pool, currency, headline singles payouts | High | Article is summary-level; full round table comes from the PDF source. | No |
| `ao-2025-prize-money-pdf` | [Australian Open Prize Money 2021-2025](https://www.tennis.com.au/wp-content/uploads/2025/01/AO25-Prize-Money.pdf) | Tennis Australia | Men's/women's singles per-player round payouts, singles event total, total tournament prize money | High | PDF parsing is manual in Task 3; future adapter should parse tables. | No |
| `roland-garros-2025-secondary-prize-money` | [2025 French Open prize money table](https://en.wikipedia.org/wiki/2025_French_Open#Prize_money) | Wikipedia, citing The Independent | Singles round payouts and total tournament prize money | Medium | No official Roland Garros/FFT prize-money URL was verified in this task; replace with official source when found. | No |
| `wimbledon-2025-prize-money-pdf` | [The Championships, Wimbledon 2025 Prize Money](https://www.wimbledon.com/pdf/Wimbledon_Prize_Money_2025.pdf) | The All England Lawn Tennis Club / Wimbledon | Gentlemen's/ladies' singles per-player round payouts, singles event total, total tournament prize money | High | PDF parsing is manual in Task 3; future adapter should parse tables. | No |
| `us-open-2025-prize-money-page` | [2025 US Open Prize Money](https://www.usopen.org/en_US/visit/prize_money.html) | United States Tennis Association / US Open | US Open prize-money table and total player compensation | Medium | Official page was reachable but did not expose crawler-readable text in this task. | No |
| `us-open-2025-secondary-crosscheck` | [US Open prize-money table](https://en.wikipedia.org/wiki/US_Open_(tennis)#Prize_money) | Wikipedia, citing the official US Open prize-money page | Singles round payouts, combined singles total, total player compensation | Medium | Used only as a cross-check because the official page did not parse in this environment. | No |

## Normalized Seed Rows

| Record | Event scope | Prize-pool value | Currency | Status | Confidence | Notes |
| --- | --- | ---: | --- | --- | --- | --- |
| `australian-open-2025-ms` | Men's singles, 128-player main draw | 33,108,000 | AUD | Official | High | Official per-event singles total from Tennis Australia PDF. |
| `roland-garros-2025-ms` | Men's singles, 128-player main draw | 20,509,000 | EUR | Derived | Medium | Weighted sum of listed singles round payouts from secondary source. |
| `wimbledon-2025-ms` | Gentlemen's singles, 128-player main draw | 19,414,000 | GBP | Official | High | Official per-event singles total from Wimbledon PDF. |
| `us-open-2025-ms` | Men's singles, 128-player main draw | 31,620,000 | USD | Derived | Medium | Weighted sum of listed singles round payouts, cross-checked against official-source citation. |

## Financial Data Status

No tournament-level revenue, profit, or surplus values are included in the Task 3 seed. The dashboard leaves those fields unavailable for every seed record. Organization-level revenues, press estimates, and player-share claims are not normalized as compatible denominators unless a future task can tie them to a specific tournament/event and currency.

## Access Date

All Task 3 source entries were accessed on 2026-07-05.
