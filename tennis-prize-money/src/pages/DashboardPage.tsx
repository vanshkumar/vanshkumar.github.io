import { useMemo, useState, type ReactNode } from 'react';
import { DataModeBadge } from '../components/DataModeBadge';
import { KpiCard } from '../components/KpiCard';
import { dashboardDataset } from '../data/dashboardDataset';
import {
  type ComparisonChartRow,
  type DashboardFilters,
  type CoverageSummaryItem,
  type YearOverYearChartRow,
  filterRecords,
  formatMoney,
  formatMetricPercent,
  getFinalistComparisonRows,
  getFinancialComparisonRows,
  getFilterOptions,
  getCoverageSummary,
  getRoundPayoutPercentages,
  getSourceCoverageSummary,
  getSourcesForRecord,
  getVisibleCaveats,
  getYearOverYearChartRows,
  summarizeKpis,
} from '../lib/dashboardMetrics';
import { dispatchRefreshRequest, getRefreshConfig } from '../lib/refreshClient';
import type { TournamentEconomicsRecord } from '../data/dashboardDataset';

const initialFilters: DashboardFilters = {
  tournament: 'all',
  year: 'all',
  event: 'all',
  confidence: 'all',
};
const refreshConfig = getRefreshConfig();

export function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(
    refreshConfig.endpointUrl === null
      ? 'Refresh is not configured for this static deployment.'
      : 'Refresh endpoint configured.',
  );
  const options = useMemo(() => getFilterOptions(dashboardDataset.records), []);
  const filteredRecords = useMemo(
    () => filterRecords(dashboardDataset.records, filters),
    [filters],
  );
  const selectedRecord = filteredRecords[0] ?? null;
  const kpis = useMemo(
    () =>
      selectedRecord === null
        ? []
        : summarizeKpis(selectedRecord, dashboardDataset.records),
    [selectedRecord],
  );
  const roundPayoutPercentages = useMemo(
    () => (selectedRecord === null ? [] : getRoundPayoutPercentages(selectedRecord)),
    [selectedRecord],
  );
  const maxRoundPayout = Math.max(
    1,
    ...roundPayoutPercentages.map((payout) => payout.payout.amount ?? 0),
  );
  const finalistRows = useMemo(
    () => (selectedRecord === null ? [] : getFinalistComparisonRows(selectedRecord)),
    [selectedRecord],
  );
  const financialRows = useMemo(
    () => (selectedRecord === null ? [] : getFinancialComparisonRows(selectedRecord)),
    [selectedRecord],
  );
  const yearOverYearRows = useMemo(
    () => getYearOverYearChartRows(filteredRecords, dashboardDataset.records),
    [filteredRecords],
  );
  const recordCoverageSummary = getCoverageSummary(dashboardDataset, filteredRecords);
  const sourceCoverageSummary = getSourceCoverageSummary(dashboardDataset, filteredRecords);
  const selectedSources =
    selectedRecord === null ? [] : getSourcesForRecord(dashboardDataset, selectedRecord);
  const visibleCaveats =
    selectedRecord === null ? [] : getVisibleCaveats(selectedRecord, dashboardDataset.records);
  const datasetMode = dashboardDataset.metadata.dataMode;
  const hasMatches = filteredRecords.length > 0;

  function updateFilter<Key extends keyof DashboardFilters>(
    key: Key,
    value: DashboardFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  async function requestRefresh() {
    if (refreshConfig.endpointUrl === null || isRefreshing) {
      return;
    }

    const refreshToken = window.prompt('Enter refresh passphrase');

    if (refreshToken === null) {
      setRefreshMessage('Refresh request canceled.');
      return;
    }

    setIsRefreshing(true);
    setRefreshMessage('Requesting refresh...');

    const result = await dispatchRefreshRequest({
      endpointUrl: refreshConfig.endpointUrl,
      refreshToken,
    });

    setRefreshMessage(result.message);
    setIsRefreshing(false);
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
          <div className="refresh-actions">
            {refreshConfig.endpointUrl === null ? (
              <button type="button" disabled>
                Refresh not configured
              </button>
            ) : (
              <button type="button" disabled={isRefreshing} onClick={requestRefresh}>
                {isRefreshing ? 'Requesting refresh' : 'Request refresh'}
              </button>
            )}
            <a href={refreshConfig.docsUrl} target="_blank" rel="noreferrer">
              Refresh docs
            </a>
          </div>
          <p className="refresh-status-message" role="status">
            {refreshMessage}
          </p>
        </div>
      </section>

      <section className="notice-band" aria-label="Dataset notice">
        <strong>{dashboardDataset.metadata.datasetLabel}</strong>
        <p>{dashboardDataset.metadata.datasetNotice}</p>
      </section>

      <section className="filters-band" aria-labelledby="filters-title">
        <div className="filters-heading">
          <div>
            <span id="filters-title">Filters</span>
            <strong id="filter-summary">
              {filteredRecords.length} of {dashboardDataset.records.length} records
            </strong>
          </div>
          <button type="button" className="secondary-button" onClick={resetFilters}>
            Reset
          </button>
        </div>
        <label htmlFor="tournament-filter">
          <span>Tournament</span>
          <select
            id="tournament-filter"
            value={filters.tournament}
            aria-describedby="filter-summary"
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
        <label htmlFor="year-filter">
          <span>Year</span>
          <select
            id="year-filter"
            value={filters.year}
            aria-describedby="filter-summary"
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
        <label htmlFor="event-filter">
          <span>Event</span>
          <select
            id="event-filter"
            value={filters.event}
            aria-describedby="filter-summary"
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
        <label htmlFor="confidence-filter">
          <span>Confidence</span>
          <select
            id="confidence-filter"
            value={filters.confidence}
            aria-describedby="filter-summary"
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
        {selectedRecord === null ? (
          <>
            <div>
              <span>Selected record</span>
              <h2>No matching records</h2>
            </div>
            <button type="button" className="secondary-button" onClick={resetFilters}>
              Clear filters
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </section>

      {hasMatches ? (
        <section className="kpi-grid" aria-label="Dashboard KPIs">
          {kpis.map((metric) => (
            <KpiCard key={metric.label} metric={metric} />
          ))}
        </section>
      ) : (
        <EmptyState
          title="No data for this filter set"
          message="The current static seed has no records matching all selected filters."
          action={<button type="button" onClick={resetFilters}>Reset filters</button>}
        />
      )}

      <section className="dashboard-grid" aria-label="Charts and caveats">
        <article className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>Round payouts</span>
              <h2>Payout curve by round</h2>
            </div>
            {selectedRecord === null ? null : (
              <DataModeBadge mode={datasetMode} label={selectedRecord.confidence} />
            )}
          </div>
          {selectedRecord === null ? (
            <EmptyState
              title="No payout curve available"
              message="Round payouts appear after a record matches the active filters."
            />
          ) : (
            <PayoutCurveChart
              record={selectedRecord}
              maxRoundPayout={maxRoundPayout}
              roundPayoutPercentages={roundPayoutPercentages}
            />
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span>Finalist payouts</span>
              <h2>Winner vs runner-up</h2>
            </div>
            {selectedRecord === null ? null : (
              <DataModeBadge mode={datasetMode} label={selectedRecord.confidence} />
            )}
          </div>
          <ComparisonChart
            ariaLabel="Winner and runner-up payout comparison"
            emptyTitle="No finalist payouts available"
            rows={finalistRows}
          />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span>Financial context</span>
              <h2>Prize pool vs financial rows</h2>
            </div>
            {selectedRecord === null ? null : (
              <DataModeBadge mode={datasetMode} label={selectedRecord.confidence} />
            )}
          </div>
          <ComparisonChart
            ariaLabel="Prize pool, revenue, and profit or surplus comparison"
            emptyTitle="No financial rows available"
            rows={financialRows}
          />
        </article>

        <article className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>Annual movement</span>
              <h2>Year-over-year prize pool growth</h2>
            </div>
            <DataModeBadge mode={datasetMode} />
          </div>
          <YearOverYearChart rows={yearOverYearRows} />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span>Coverage</span>
              <h2>Confidence and source coverage</h2>
            </div>
            <DataModeBadge mode={datasetMode} />
          </div>
          <CoverageChart title="Records" rows={recordCoverageSummary} emptyTitle="No records" />
          <CoverageChart title="Sources" rows={sourceCoverageSummary} emptyTitle="No linked sources" />
        </article>

        <article className="panel sources-panel">
          <div className="panel-heading">
            <div>
              <span>Sources and caveats</span>
              <h2>Current data status</h2>
            </div>
            {selectedRecord === null ? null : (
              <DataModeBadge mode={datasetMode} label={selectedRecord.confidence} />
            )}
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
          ) : (
            <EmptyState
              title="No sources selected"
              message="Source details appear after a record matches the active filters."
            />
          )}
          <ul className="caveat-list" aria-label="Visible data caveats">
            {visibleCaveats.map((caveat) => (
              <li key={caveat}>{caveat}</li>
            ))}
            <li>
              {refreshConfig.endpointUrl === null
                ? 'Browser refresh is disabled until a safe external endpoint exists.'
                : 'Browser refresh dispatch uses an external endpoint; no GitHub token is bundled in this app.'}
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}

interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
}

function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <strong>{title}</strong>
      <p>{message}</p>
      {action}
    </div>
  );
}

interface PayoutCurveChartProps {
  record: TournamentEconomicsRecord;
  maxRoundPayout: number;
  roundPayoutPercentages: ReturnType<typeof getRoundPayoutPercentages>;
}

function PayoutCurveChart({
  record,
  maxRoundPayout,
  roundPayoutPercentages,
}: PayoutCurveChartProps) {
  const chartWidth = 640;
  const chartHeight = 220;
  const paddingX = 34;
  const paddingY = 28;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;
  const points = roundPayoutPercentages.map((payout, index) => {
    const x =
      paddingX +
      (roundPayoutPercentages.length <= 1
        ? plotWidth / 2
        : (index / (roundPayoutPercentages.length - 1)) * plotWidth);
    const y =
      paddingY +
      plotHeight -
      ((payout.payout.amount ?? 0) / Math.max(maxRoundPayout, 1)) * plotHeight;

    return { payout, x, y };
  });
  const pointList = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="payout-chart" role="img" aria-label={`${record.tournament} payout curve by round`}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} aria-hidden="true" focusable="false">
        <line
          x1={paddingX}
          x2={chartWidth - paddingX}
          y1={chartHeight - paddingY}
          y2={chartHeight - paddingY}
          className="chart-axis"
        />
        <polyline points={pointList} className="curve-line" />
        {points.map((point) => (
          <g key={point.payout.round}>
            <circle cx={point.x} cy={point.y} r="5" className="curve-point" />
            <text x={point.x} y={chartHeight - 8} textAnchor="middle" className="curve-label">
              {point.payout.round}
            </text>
          </g>
        ))}
      </svg>
      <div className="bar-chart">
        {roundPayoutPercentages.map((payout) => (
          <div className="bar-row" key={payout.round}>
            <span>{payout.round}</span>
            <div className="bar-track" aria-hidden="true">
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
    </div>
  );
}

interface ComparisonChartProps {
  ariaLabel: string;
  emptyTitle: string;
  rows: ComparisonChartRow[];
}

function ComparisonChart({ ariaLabel, emptyTitle, rows }: ComparisonChartProps) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} message="No matching record is selected." />;
  }

  return (
    <div className="comparison-chart" role="img" aria-label={ariaLabel}>
      {rows.map((row) => (
        <div className={row.unavailable ? 'comparison-row is-unavailable' : 'comparison-row'} key={row.id}>
          <div className="comparison-row-heading">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
          <div className="bar-track" aria-hidden="true">
            <div
              className="bar-fill"
              style={{ width: `${Math.max(row.barPercent ?? 0, row.barPercent === null ? 0 : 3)}%` }}
            />
          </div>
          <p>
            {row.status} · {row.note}
          </p>
        </div>
      ))}
    </div>
  );
}

interface YearOverYearChartProps {
  rows: YearOverYearChartRow[];
}

function YearOverYearChart({ rows }: YearOverYearChartProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No matching records"
        message="Year-over-year growth appears when filtered records are available."
      />
    );
  }

  const hasAvailableGrowth = rows.some((row) => !row.unavailable);

  if (!hasAvailableGrowth) {
    return (
      <div className="unavailable-chart">
        <EmptyState
          title="Prior-year data unavailable"
          message="The current seed only includes 2025 rows, so no same-event prior-year comparison can be computed."
        />
        <ul className="metric-list">
          {rows.map((row) => (
            <li key={row.id}>
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="comparison-chart" role="img" aria-label="Year-over-year prize pool growth">
      {rows.map((row) => (
        <div className={row.unavailable ? 'comparison-row is-unavailable' : 'comparison-row'} key={row.id}>
          <div className="comparison-row-heading">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
          <p>{row.note}</p>
        </div>
      ))}
    </div>
  );
}

interface CoverageChartProps {
  title: string;
  rows: CoverageSummaryItem[];
  emptyTitle: string;
}

function CoverageChart({ title, rows, emptyTitle }: CoverageChartProps) {
  return (
    <div className="coverage-block">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} message="Coverage appears when filters match data." />
      ) : (
        <div className="comparison-chart" role="img" aria-label={`${title} confidence coverage`}>
          {rows.map((row) => (
            <div className="comparison-row" key={`${title}-${row.confidence}`}>
              <div className="comparison-row-heading">
                <span>{row.confidence}</span>
                <strong>{row.count}</strong>
              </div>
              <div className="bar-track" aria-hidden="true">
                <div className="bar-fill" style={{ width: `${row.share * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
