import { useMemo, useState, type ReactNode } from 'react';
import { DataModeBadge } from '../components/DataModeBadge';
import { dashboardDataset, type TournamentEconomicsRecord } from '../data/dashboardDataset';
import {
  type DashboardFilters,
  type PrimaryQuestionCoverageRow,
  type PrimaryQuestionRow,
  filterRecords,
  formatMoney,
  formatSourceType,
  getFilterOptions,
  getPrimaryQuestionCaveats,
  getPrimaryQuestionCoverage,
  getPrimaryQuestionRows,
  getSourcesForRecord,
} from '../lib/dashboardMetrics';
import { dispatchRefreshRequest, getRefreshConfig } from '../lib/refreshClient';

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
  const primaryRows = useMemo(
    () => (selectedRecord === null ? [] : getPrimaryQuestionRows(selectedRecord)),
    [selectedRecord],
  );
  const primaryCoverage = useMemo(
    () => getPrimaryQuestionCoverage(filteredRecords),
    [filteredRecords],
  );
  const selectedSources =
    selectedRecord === null ? [] : getSourcesForRecord(dashboardDataset, selectedRecord);
  const visibleCaveats =
    selectedRecord === null ? [] : getPrimaryQuestionCaveats(selectedRecord);
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
          <p className="eyebrow">Tennis prize money economics</p>
          <h1 id="page-title">
            What percentage of tournament revenue or profit goes to players?
          </h1>
          <p className="hero-copy">
            The answer is calculated only when prize money and the financial
            denominator are compatible: same currency, tournament-level scope,
            and a positive revenue, profit, or surplus value. The current seed
            has sourced prize money but no compatible financial denominator yet.
          </p>
        </div>
      </section>

      <section className="selection-summary" aria-live="polite">
        {selectedRecord === null ? (
          <>
            <div>
              <span>Selected comparison</span>
              <h2>No matching records</h2>
            </div>
            <button type="button" className="secondary-button" onClick={resetFilters}>
              Clear filters
            </button>
          </>
        ) : (
          <>
            <div>
              <span>Selected comparison</span>
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
        <>
          <section className="answer-grid" aria-label="Prize money share answers">
            {primaryRows.map((row) => (
              <PrimaryAnswerCard key={row.id} row={row} />
            ))}
          </section>
          <RatioInputStrip record={selectedRecord} />
        </>
      ) : (
        <EmptyState
          title="No data for this filter set"
          message="The current static seed has no records matching all selected filters."
          action={<button type="button" onClick={resetFilters}>Reset filters</button>}
        />
      )}

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

      <section className="notice-band" aria-label="Dataset notice">
        <strong>{dashboardDataset.metadata.datasetLabel}</strong>
        <p>{dashboardDataset.metadata.datasetNotice}</p>
      </section>

      <section className="dashboard-grid focused-grid" aria-label="Evidence and caveats">
        <article className="panel wide-panel">
          <div className="panel-heading">
            <div>
              <span>Answer coverage</span>
              <h2>Can the active records answer the question?</h2>
            </div>
            <DataModeBadge mode={datasetMode} />
          </div>
          <AnswerCoveragePanel rows={primaryCoverage} />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span>Calculation status</span>
              <h2>Why the answer reads this way</h2>
            </div>
            {selectedRecord === null ? null : (
              <DataModeBadge mode={datasetMode} label={selectedRecord.confidence} />
            )}
          </div>
          {selectedRecord === null ? (
            <EmptyState
              title="No selected record"
              message="Calculation caveats appear after a record matches the active filters."
            />
          ) : (
            <ul className="caveat-list" aria-label="Primary question caveats">
              {visibleCaveats.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
              <li>
                {refreshConfig.endpointUrl === null
                  ? 'Browser refresh is disabled until a safe external endpoint exists.'
                  : 'Browser refresh dispatch uses an external endpoint; no GitHub token is bundled in this app.'}
              </li>
            </ul>
          )}
        </article>

        <article className="refresh-panel" aria-label="Refresh status">
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
        </article>

        <article className="panel sources-panel">
          <div className="panel-heading">
            <div>
              <span>Sources</span>
              <h2>Evidence behind the selected comparison</h2>
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
                  <dd>Source type: {formatSourceType(source.sourceType)}</dd>
                  <dd>Source confidence: {source.confidence}</dd>
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
        </article>
      </section>
    </main>
  );
}

interface PrimaryAnswerCardProps {
  row: PrimaryQuestionRow;
}

function PrimaryAnswerCard({ row }: PrimaryAnswerCardProps) {
  return (
    <article className={row.unavailable ? 'answer-card is-unavailable' : 'answer-card'}>
      <span>{row.eyebrow}</span>
      <h2>{row.label}</h2>
      <strong className="answer-value">{row.value}</strong>
      <div className="answer-meter" aria-hidden="true">
        <div style={{ width: `${row.barPercent ?? 0}%` }} />
      </div>
      <dl className="answer-inputs">
        <div>
          <dt>{row.numeratorLabel}</dt>
          <dd>{row.numeratorValue}</dd>
        </div>
        <div>
          <dt>{row.denominatorLabel}</dt>
          <dd>{row.denominatorValue}</dd>
        </div>
      </dl>
      <p>{row.note}</p>
    </article>
  );
}

interface RatioInputStripProps {
  record: TournamentEconomicsRecord | null;
}

function RatioInputStrip({ record }: RatioInputStripProps) {
  if (record === null) {
    return null;
  }

  const inputs = [
    {
      label: 'Prize money numerator',
      value: formatMoney(record.prizePool.amount, record.prizePool.currency),
      note: record.prizePool.notes ?? 'Normalized prize-pool value.',
    },
    {
      label: 'Revenue denominator',
      value: formatMoney(record.revenue.amount, record.revenue.currency),
      note: record.revenue.notes ?? 'Compatible tournament-level revenue is required.',
    },
    {
      label: 'Profit/surplus denominator',
      value: formatMoney(record.profitOrSurplus.amount, record.profitOrSurplus.currency),
      note:
        record.profitOrSurplus.notes ??
        'Compatible positive tournament-level profit or surplus is required.',
    },
  ];

  return (
    <section className="ratio-input-strip" aria-label="Ratio inputs">
      {inputs.map((input) => (
        <article key={input.label}>
          <span>{input.label}</span>
          <strong>{input.value}</strong>
          <p>{input.note}</p>
        </article>
      ))}
    </section>
  );
}

interface AnswerCoveragePanelProps {
  rows: PrimaryQuestionCoverageRow[];
}

function AnswerCoveragePanel({ rows }: AnswerCoveragePanelProps) {
  if (rows.every((row) => row.totalCount === 0)) {
    return (
      <EmptyState
        title="No active records"
        message="Answer coverage appears when filters match at least one record."
      />
    );
  }

  return (
    <div className="answer-coverage">
      {rows.map((row) => (
        <div
          className={row.unavailable ? 'coverage-row is-unavailable' : 'coverage-row'}
          key={row.id}
        >
          <div className="coverage-row-heading">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
          <div className="bar-track" aria-hidden="true">
            <div className="bar-fill" style={{ width: `${row.barPercent}%` }} />
          </div>
          <p>{row.note}</p>
        </div>
      ))}
    </div>
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
