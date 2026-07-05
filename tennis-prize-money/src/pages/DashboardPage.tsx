import { useMemo, useState } from 'react';
import { DataModeBadge } from '../components/DataModeBadge';
import { KpiCard } from '../components/KpiCard';
import { dashboardDataset } from '../data/dashboardDataset';
import {
  type DashboardFilters,
  filterRecords,
  formatMoney,
  formatMetricPercent,
  getFilterOptions,
  getCoverageSummary,
  getRoundPayoutPercentages,
  getSourcesForRecord,
  summarizeKpis,
} from '../lib/dashboardMetrics';

const initialFilters: DashboardFilters = {
  tournament: 'all',
  year: 'all',
  event: 'all',
  confidence: 'all',
};

export function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const options = useMemo(() => getFilterOptions(dashboardDataset.records), []);
  const filteredRecords = useMemo(
    () => filterRecords(dashboardDataset.records, filters),
    [filters],
  );
  const selectedRecord = filteredRecords[0] ?? dashboardDataset.records[0];
  const kpis = useMemo(
    () => summarizeKpis(selectedRecord, dashboardDataset.records),
    [selectedRecord],
  );
  const roundPayoutPercentages = useMemo(
    () => getRoundPayoutPercentages(selectedRecord),
    [selectedRecord],
  );
  const maxRoundPayout = Math.max(
    1,
    ...roundPayoutPercentages.map((payout) => payout.payout.amount ?? 0),
  );
  const coverageSummary = getCoverageSummary(dashboardDataset);
  const selectedSources = getSourcesForRecord(dashboardDataset, selectedRecord);
  const datasetMode = dashboardDataset.metadata.dataMode;

  function updateFilter<Key extends keyof DashboardFilters>(
    key: Key,
    value: DashboardFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="app-shell">
      <section className="hero-band" aria-labelledby="page-title">
        <div>
          <DataModeBadge mode={datasetMode} />
          <p className="eyebrow">Tennis economics dashboard</p>
          <h1 id="page-title">Prize money, revenue, and surplus context</h1>
          <p className="hero-copy">
            A static-first dashboard for comparing tournament prize pools,
            payouts, financial rows, source confidence, and caveats. The current
            seed focuses on sourced 2025 Grand Slam men's singles prize money,
            with financial denominators left unavailable where source semantics
            are not clear.
          </p>
        </div>
        <div className="refresh-panel" aria-label="Refresh status">
          <span>Last refreshed</span>
          <strong>{new Date(dashboardDataset.metadata.lastRefreshedAt).toLocaleString()}</strong>
          <button type="button" disabled>
            Refresh not configured
          </button>
        </div>
      </section>

      <section className="notice-band" aria-label="Dataset notice">
        <strong>{dashboardDataset.metadata.datasetLabel}</strong>
        <p>{dashboardDataset.metadata.datasetNotice}</p>
      </section>

      <section className="filters-band" aria-label="Dashboard filters">
        <label>
          Tournament
          <select
            value={filters.tournament}
            onChange={(event) => updateFilter('tournament', event.target.value)}
          >
            <option value="all">All tournaments</option>
            {options.tournaments.map((tournament) => (
              <option key={tournament} value={tournament}>
                {tournament}
              </option>
            ))}
          </select>
        </label>
        <label>
          Year
          <select
            value={filters.year}
            onChange={(event) => updateFilter('year', event.target.value)}
          >
            <option value="all">All years</option>
            {options.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label>
          Event
          <select
            value={filters.event}
            onChange={(event) => updateFilter('event', event.target.value)}
          >
            <option value="all">All events</option>
            {options.events.map((eventName) => (
              <option key={eventName} value={eventName}>
                {eventName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Confidence
          <select
            value={filters.confidence}
            onChange={(event) =>
              updateFilter('confidence', event.target.value as DashboardFilters['confidence'])
            }
          >
            <option value="all">All confidence levels</option>
            {options.confidenceLevels.map((confidence) => (
              <option key={confidence} value={confidence}>
                {confidence}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="selection-summary" aria-live="polite">
        <div>
          <span>Selected record</span>
          <h2>
            {selectedRecord.tournament} · {selectedRecord.year} · {selectedRecord.event}
          </h2>
        </div>
        <DataModeBadge
          mode={datasetMode}
          label={`${filteredRecords.length} matching record(s) · ${selectedRecord.confidence} confidence`}
        />
      </section>

      <section className="kpi-grid" aria-label="Dashboard KPIs">
        {kpis.map((metric) => (
          <KpiCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="dashboard-grid" aria-label="Charts and caveats">
        <article className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>Round payouts</span>
              <h2>Payout curve by round</h2>
            </div>
            <DataModeBadge mode={datasetMode} label={selectedRecord.confidence} />
          </div>
          <div className="bar-chart" role="img" aria-label="Payout curve by round">
            {roundPayoutPercentages.map((payout) => (
              <div className="bar-row" key={payout.round}>
                <span>{payout.round}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${((payout.payout.amount ?? 0) / maxRoundPayout) * 100}%`,
                    }}
                  />
                </div>
                <strong>
                  {formatMoney(payout.payout.amount, payout.payout.currency)}
                  <small>{formatMetricPercent(payout.percentage)} of pool</small>
                </strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span>Finalist payouts</span>
              <h2>Winner vs runner-up</h2>
            </div>
            <DataModeBadge mode={datasetMode} label={selectedRecord.confidence} />
          </div>
          <div className="comparison-bars" role="img" aria-label="Winner and runner-up payouts">
            <div>
              <span>Winner</span>
              <strong>
                {formatMoney(selectedRecord.winnerPayout.amount, selectedRecord.winnerPayout.currency)}
              </strong>
            </div>
            <div>
              <span>Runner-up</span>
              <strong>
                {formatMoney(
                  selectedRecord.runnerUpPayout.amount,
                  selectedRecord.runnerUpPayout.currency,
                )}
              </strong>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span>Financial context</span>
              <h2>Prize pool vs financial rows</h2>
            </div>
            <DataModeBadge mode={datasetMode} label={selectedRecord.confidence} />
          </div>
          <ul className="metric-list">
            <li>
              <span>Prize pool</span>
              <strong>
                {formatMoney(selectedRecord.prizePool.amount, selectedRecord.prizePool.currency)}
              </strong>
            </li>
            <li>
              <span>Revenue</span>
              <strong>{formatMoney(selectedRecord.revenue.amount, selectedRecord.revenue.currency)}</strong>
            </li>
            <li>
              <span>Profit/surplus</span>
              <strong>
                {formatMoney(
                  selectedRecord.profitOrSurplus.amount,
                  selectedRecord.profitOrSurplus.currency,
                )}
              </strong>
            </li>
          </ul>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span>Coverage</span>
              <h2>Source confidence summary</h2>
            </div>
            <DataModeBadge mode={datasetMode} />
          </div>
          <ul className="metric-list">
            {coverageSummary.map((item) => (
              <li key={item.confidence}>
                <span>{item.confidence}</span>
                <strong>{item.count} record(s)</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel sources-panel">
          <div className="panel-heading">
            <div>
              <span>Sources and caveats</span>
              <h2>Current data status</h2>
            </div>
            <DataModeBadge mode={datasetMode} label={selectedRecord.confidence} />
          </div>
          {selectedSources.length > 0 ? (
            <dl className="source-list">
              {selectedSources.map((source) => (
                <div key={source.id}>
                  <dt>{source.title}</dt>
                  <dd>{source.publisher}</dd>
                  <dd>{source.sourceType}</dd>
                  <dd>Confidence: {source.confidence}</dd>
                  <dd>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      Open source
                    </a>
                  </dd>
                  <dd>Accessed {source.accessedAt}</dd>
                  <dd>{source.notes}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <ul className="caveat-list">
            {selectedRecord.caveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
            <li>Browser refresh is disabled until a safe external endpoint exists.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
