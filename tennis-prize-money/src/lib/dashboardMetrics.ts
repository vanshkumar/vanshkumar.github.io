import type {
  Confidence,
  MockDashboardData,
  TournamentEconomicsRecord,
} from '../data/mockDashboardData';

export interface DashboardFilters {
  tournament: string;
  year: string;
  event: string;
  confidence: Confidence | 'all';
}

export interface KpiMetric {
  label: string;
  value: string;
  eyebrow: string;
  note: string;
  unavailable?: boolean;
}

export function formatMoney(amount: number | null, currency: string): string {
  if (amount === null) {
    return 'Unavailable';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(numerator: number | null, denominator: number | null): string {
  if (numerator === null || denominator === null || denominator <= 0) {
    return 'Unavailable';
  }

  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function formatRatio(numerator: number | null, denominator: number | null): string {
  if (numerator === null || denominator === null || denominator <= 0) {
    return 'Unavailable';
  }

  return `${(numerator / denominator).toFixed(2)}x`;
}

export function getFilterOptions(records: TournamentEconomicsRecord[]) {
  return {
    tournaments: uniqueSorted(records.map((record) => record.tournament)),
    years: uniqueSorted(records.map((record) => String(record.year))).sort(
      (a, b) => Number(b) - Number(a),
    ),
    events: uniqueSorted(records.map((record) => record.event)),
    confidenceLevels: uniqueSorted(records.map((record) => record.confidence)),
  };
}

export function filterRecords(
  records: TournamentEconomicsRecord[],
  filters: DashboardFilters,
) {
  return records.filter((record) => {
    const tournamentMatches =
      filters.tournament === 'all' || record.tournament === filters.tournament;
    const yearMatches = filters.year === 'all' || String(record.year) === filters.year;
    const eventMatches = filters.event === 'all' || record.event === filters.event;
    const confidenceMatches =
      filters.confidence === 'all' || record.confidence === filters.confidence;

    return tournamentMatches && yearMatches && eventMatches && confidenceMatches;
  });
}

export function summarizeKpis(record: TournamentEconomicsRecord): KpiMetric[] {
  const prizePool = record.prizePool.amount;
  const revenue = record.revenue.amount;
  const profitOrSurplus = record.profitOrSurplus.amount;
  const winnerPayout = record.winnerPayout.amount;
  const runnerUpPayout = record.runnerUpPayout.amount;
  const profitRatioUnavailable = profitOrSurplus === null || profitOrSurplus <= 0;

  return [
    {
      label: 'Total prize pool',
      value: formatMoney(prizePool, record.currency),
      eyebrow: 'Mock KPI',
      note: 'Placeholder total prize pool.',
    },
    {
      label: 'Reported revenue',
      value: formatMoney(revenue, record.currency),
      eyebrow: record.revenue.status === 'mock' ? 'Mock KPI' : 'Unavailable',
      note:
        record.revenue.status === 'mock'
          ? 'Placeholder tournament revenue.'
          : 'No compatible revenue row in this mock record.',
      unavailable: record.revenue.status === 'unavailable',
    },
    {
      label: 'Reported profit/surplus',
      value: formatMoney(profitOrSurplus, record.currency),
      eyebrow: record.profitOrSurplus.status === 'mock' ? 'Mock KPI' : 'Unavailable',
      note:
        record.profitOrSurplus.status === 'mock'
          ? 'Placeholder profit/surplus value.'
          : 'Missing, zero, negative, or incompatible profit remains unavailable.',
      unavailable: record.profitOrSurplus.status === 'unavailable',
    },
    {
      label: 'Prize pool / revenue',
      value: formatPercent(prizePool, revenue),
      eyebrow: revenue === null ? 'Unavailable' : 'Mock derived',
      note: 'Shown only when same-currency revenue is present.',
      unavailable: revenue === null,
    },
    {
      label: 'Prize pool / profit',
      value: profitRatioUnavailable ? 'Unavailable' : formatPercent(prizePool, profitOrSurplus),
      eyebrow: profitRatioUnavailable ? 'Unavailable' : 'Mock derived',
      note: 'Unavailable when profit/surplus is missing, zero, negative, or incompatible.',
      unavailable: profitRatioUnavailable,
    },
    {
      label: 'Winner payout',
      value: formatMoney(winnerPayout, record.currency),
      eyebrow: 'Mock KPI',
      note: `Allocation: ${record.winnerPayout.allocation.replace('_', ' ')}.`,
    },
    {
      label: 'Runner-up payout',
      value: formatMoney(runnerUpPayout, record.currency),
      eyebrow: 'Mock KPI',
      note: `Allocation: ${record.runnerUpPayout.allocation.replace('_', ' ')}.`,
    },
    {
      label: 'Winner / runner-up',
      value: formatRatio(winnerPayout, runnerUpPayout),
      eyebrow: 'Mock derived',
      note: 'Simple payout comparison for the selected event.',
    },
  ];
}

export function getMockCoverageSummary(data: MockDashboardData) {
  const counts = data.records.reduce<Record<string, number>>((summary, record) => {
    summary[record.confidence] = (summary[record.confidence] ?? 0) + 1;
    return summary;
  }, {});

  return Object.entries(counts).map(([confidence, count]) => ({
    confidence,
    count,
  }));
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
