import type {
  Confidence,
  DashboardDataset,
  MoneyValue,
  Source,
  TournamentEconomicsRecord,
  ValueStatus,
} from '../data/dashboardDataset';
import {
  calculatePrizePoolToProfitOrSurplus,
  calculatePrizePoolToRevenue,
  calculateRoundPayoutPercentages,
  calculateWinnerRunnerUpRatio,
  calculateYearOverYearPrizePoolGrowth,
  getRunnerUpPayout,
  getTotalPrizePool,
  getWinnerPayout,
  type MetricUnavailableReason,
  type NumericMetricResult,
  type RoundPayoutPercentage,
} from './metricEngine';

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

export function formatMoney(amount: number | null, currency: string | null): string {
  if (amount === null || currency === null) {
    return 'Unavailable';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMoneyValue(value: MoneyValue): string {
  return formatMoney(value.amount, value.currency);
}

export function formatMetricPercent(result: NumericMetricResult): string {
  if (result.status === 'unavailable') {
    return 'Unavailable';
  }

  return `${(result.value * 100).toFixed(1)}%`;
}

export function formatSignedMetricPercent(result: NumericMetricResult): string {
  if (result.status === 'unavailable') {
    return 'Unavailable';
  }

  const percentage = result.value * 100;
  const sign = percentage > 0 ? '+' : '';

  return `${sign}${percentage.toFixed(1)}%`;
}

export function formatRatioResult(result: NumericMetricResult): string {
  if (result.status === 'unavailable') {
    return 'Unavailable';
  }

  return `${result.value.toFixed(2)}x`;
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

export function summarizeKpis(
  record: TournamentEconomicsRecord,
  records: TournamentEconomicsRecord[],
): KpiMetric[] {
  const totalPrizePool = getTotalPrizePool(record);
  const winnerPayout = getWinnerPayout(record);
  const runnerUpPayout = getRunnerUpPayout(record);
  const prizePoolToRevenue = calculatePrizePoolToRevenue(record);
  const prizePoolToProfitOrSurplus = calculatePrizePoolToProfitOrSurplus(record);
  const winnerRunnerUpRatio = calculateWinnerRunnerUpRatio(record);
  const yearOverYearGrowth = calculateYearOverYearPrizePoolGrowth(records, record);

  return [
    {
      label: 'Total prize pool',
      value:
        totalPrizePool.status === 'available'
          ? formatMoneyValue(totalPrizePool.value)
          : 'Unavailable',
      eyebrow: valueEyebrow(record.prizePool.status),
      note: record.prizePool.notes ?? 'Total prize pool from normalized data.',
      unavailable: totalPrizePool.status === 'unavailable',
    },
    {
      label: 'Reported revenue',
      value: formatMoneyValue(record.revenue),
      eyebrow: valueEyebrow(record.revenue.status),
      note: record.revenue.notes ?? `Financial kind: ${formatFinancialKind(record.revenue.kind)}.`,
      unavailable: record.revenue.status === 'unavailable',
    },
    {
      label: 'Reported profit/surplus',
      value: formatMoneyValue(record.profitOrSurplus),
      eyebrow: valueEyebrow(record.profitOrSurplus.status),
      note:
        record.profitOrSurplus.notes ??
        `Financial kind: ${formatFinancialKind(record.profitOrSurplus.kind)}.`,
      unavailable: record.profitOrSurplus.status === 'unavailable',
    },
    {
      label: 'Prize pool / revenue',
      value: formatMetricPercent(prizePoolToRevenue),
      eyebrow: derivedEyebrow(record, prizePoolToRevenue),
      note: ratioNote(
        prizePoolToRevenue,
        'Uses same-currency tournament revenue only.',
      ),
      unavailable: prizePoolToRevenue.status === 'unavailable',
    },
    {
      label: 'Prize pool / profit',
      value: formatMetricPercent(prizePoolToProfitOrSurplus),
      eyebrow: derivedEyebrow(record, prizePoolToProfitOrSurplus),
      note: ratioNote(
        prizePoolToProfitOrSurplus,
        'Uses same-currency tournament profit or surplus only.',
      ),
      unavailable: prizePoolToProfitOrSurplus.status === 'unavailable',
    },
    {
      label: 'Prize pool YoY growth',
      value: formatSignedMetricPercent(yearOverYearGrowth),
      eyebrow: derivedEyebrow(record, yearOverYearGrowth),
      note: ratioNote(
        yearOverYearGrowth,
        'Compares this prize pool with the prior year for the same tournament and event.',
      ),
      unavailable: yearOverYearGrowth.status === 'unavailable',
    },
    {
      label: 'Winner payout',
      value:
        winnerPayout.status === 'available'
          ? formatMoneyValue(winnerPayout.value)
          : 'Unavailable',
      eyebrow: valueEyebrow(record.winnerPayout.status),
      note: `Allocation: ${formatAllocation(record.winnerPayout.allocation)}.`,
      unavailable: winnerPayout.status === 'unavailable',
    },
    {
      label: 'Runner-up payout',
      value:
        runnerUpPayout.status === 'available'
          ? formatMoneyValue(runnerUpPayout.value)
          : 'Unavailable',
      eyebrow: valueEyebrow(record.runnerUpPayout.status),
      note: `Allocation: ${formatAllocation(record.runnerUpPayout.allocation)}.`,
      unavailable: runnerUpPayout.status === 'unavailable',
    },
    {
      label: 'Winner / runner-up',
      value: formatRatioResult(winnerRunnerUpRatio),
      eyebrow: derivedEyebrow(record, winnerRunnerUpRatio),
      note: ratioNote(winnerRunnerUpRatio, 'Compares same-currency finalist payouts.'),
      unavailable: winnerRunnerUpRatio.status === 'unavailable',
    },
  ];
}

export function getRoundPayoutPercentages(
  record: TournamentEconomicsRecord,
): RoundPayoutPercentage[] {
  return calculateRoundPayoutPercentages(record);
}

export function getCoverageSummary(data: DashboardDataset) {
  const counts = data.records.reduce<Record<string, number>>((summary, record) => {
    summary[record.confidence] = (summary[record.confidence] ?? 0) + 1;
    return summary;
  }, {});

  return Object.entries(counts).map(([confidence, count]) => ({
    confidence,
    count,
  }));
}

export function getSourcesForRecord(
  data: DashboardDataset,
  record: TournamentEconomicsRecord,
): Source[] {
  const recordSourceIds = new Set(record.sourceIds);

  return data.sources.filter((source) => recordSourceIds.has(source.id));
}

export function describeUnavailableReason(reason: MetricUnavailableReason): string {
  switch (reason) {
    case 'missing_data':
      return 'Missing compatible data.';
    case 'zero_denominator':
      return 'Denominator is zero.';
    case 'negative_denominator':
      return 'Denominator is negative.';
    case 'incompatible_currency':
      return 'Currency mismatch; no conversion has been applied.';
    case 'incompatible_financial_kind':
      return 'Financial denominator is not a compatible tournament-level value.';
    case 'no_prior_record':
      return 'No matching prior-year record is available.';
  }
}

function ratioNote(result: NumericMetricResult, availableNote: string): string {
  if (result.status === 'available') {
    return availableNote;
  }

  return describeUnavailableReason(result.reason);
}

function derivedEyebrow(
  record: TournamentEconomicsRecord,
  result: NumericMetricResult,
): string {
  if (result.status === 'unavailable') {
    return 'Unavailable';
  }

  return record.confidence === 'mock' ? 'Mock derived' : 'Derived';
}

function valueEyebrow(status: ValueStatus): string {
  switch (status) {
    case 'official':
      return 'Official';
    case 'reported':
      return 'Reported';
    case 'estimated':
      return 'Estimated';
    case 'derived':
      return 'Derived';
    case 'mock':
      return 'Mock KPI';
    case 'unavailable':
      return 'Unavailable';
  }
}

function formatAllocation(allocation: string): string {
  return allocation.replace(/_/g, ' ');
}

function formatFinancialKind(kind: string): string {
  return kind.replace(/_/g, ' ');
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
