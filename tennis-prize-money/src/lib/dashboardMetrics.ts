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

export interface ComparisonChartRow {
  id: string;
  label: string;
  value: string;
  status: string;
  note: string;
  barPercent: number | null;
  unavailable: boolean;
}

export interface YearOverYearChartRow {
  id: string;
  label: string;
  value: string;
  note: string;
  unavailable: boolean;
}

export interface CoverageSummaryItem {
  confidence: string;
  count: number;
  share: number;
}

export interface PrimaryQuestionRow {
  id: 'revenue-share' | 'profit-surplus-share';
  label: string;
  value: string;
  eyebrow: string;
  numeratorLabel: string;
  numeratorValue: string;
  denominatorLabel: string;
  denominatorValue: string;
  note: string;
  barPercent: number | null;
  unavailable: boolean;
}

export interface PrimaryQuestionCoverageRow {
  id: 'revenue-share' | 'profit-surplus-share';
  label: string;
  value: string;
  note: string;
  answerableCount: number;
  totalCount: number;
  barPercent: number;
  unavailable: boolean;
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

export function formatSourceType(sourceType: string): string {
  return sourceType.replace(/_/g, ' ');
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
      label: 'Revenue',
      value: formatMoneyValue(record.revenue),
      eyebrow: valueEyebrow(record.revenue.status),
      note: record.revenue.notes ?? `Financial kind: ${formatFinancialKind(record.revenue.kind)}.`,
      unavailable: record.revenue.status === 'unavailable',
    },
    {
      label: 'Profit/surplus',
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
      label: 'Prize pool / profit or surplus',
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

export function getFinalistComparisonRows(
  record: TournamentEconomicsRecord,
): ComparisonChartRow[] {
  const rows = [
    {
      id: 'winner',
      label: 'Winner',
      value: record.winnerPayout,
      status: record.winnerPayout.status,
      note: `Allocation: ${formatAllocation(record.winnerPayout.allocation)}.`,
    },
    {
      id: 'runner-up',
      label: 'Runner-up',
      value: record.runnerUpPayout,
      status: record.runnerUpPayout.status,
      note: `Allocation: ${formatAllocation(record.runnerUpPayout.allocation)}.`,
    },
  ];
  const maxAmount = Math.max(0, ...rows.map((row) => row.value.amount ?? 0));

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    value: formatMoneyValue(row.value),
    status: valueEyebrow(row.status),
    note: row.note,
    barPercent:
      row.value.amount !== null && maxAmount > 0 ? (row.value.amount / maxAmount) * 100 : null,
    unavailable: row.value.status === 'unavailable' || row.value.amount === null,
  }));
}

export function getPrimaryQuestionRows(
  record: TournamentEconomicsRecord,
): PrimaryQuestionRow[] {
  const prizePoolToRevenue = calculatePrizePoolToRevenue(record);
  const prizePoolToProfitOrSurplus = calculatePrizePoolToProfitOrSurplus(record);
  const prizePoolValue = formatMoneyValue(record.prizePool);

  return [
    {
      id: 'revenue-share',
      label: 'Prize money as % of tournament revenue',
      value: formatMetricPercent(prizePoolToRevenue),
      eyebrow: primaryAnswerEyebrow(prizePoolToRevenue, 'revenue'),
      numeratorLabel: 'Prize money',
      numeratorValue: prizePoolValue,
      denominatorLabel: 'Revenue',
      denominatorValue: formatMoneyValue(record.revenue),
      note: primaryRatioNote(
        prizePoolToRevenue,
        'Prize pool divided by compatible same-currency tournament revenue.',
        'Add a compatible tournament-level revenue denominator before showing this percentage.',
      ),
      barPercent: ratioBarPercent(prizePoolToRevenue),
      unavailable: prizePoolToRevenue.status === 'unavailable',
    },
    {
      id: 'profit-surplus-share',
      label: 'Prize money as % of tournament profit/surplus',
      value: formatMetricPercent(prizePoolToProfitOrSurplus),
      eyebrow: primaryAnswerEyebrow(prizePoolToProfitOrSurplus, 'profit/surplus'),
      numeratorLabel: 'Prize money',
      numeratorValue: prizePoolValue,
      denominatorLabel: 'Profit/surplus',
      denominatorValue: formatMoneyValue(record.profitOrSurplus),
      note: primaryRatioNote(
        prizePoolToProfitOrSurplus,
        'Prize pool divided by compatible same-currency tournament profit or surplus.',
        'Add a positive compatible tournament-level profit or surplus denominator before showing this percentage.',
      ),
      barPercent: ratioBarPercent(prizePoolToProfitOrSurplus),
      unavailable: prizePoolToProfitOrSurplus.status === 'unavailable',
    },
  ];
}

export function getPrimaryQuestionCoverage(
  records: TournamentEconomicsRecord[],
): PrimaryQuestionCoverageRow[] {
  const totalCount = records.length;
  const revenueAnswerableCount = records.filter(
    (record) => calculatePrizePoolToRevenue(record).status === 'available',
  ).length;
  const profitAnswerableCount = records.filter(
    (record) => calculatePrizePoolToProfitOrSurplus(record).status === 'available',
  ).length;

  return [
    buildPrimaryCoverageRow(
      'revenue-share',
      'Records that can answer prize money / revenue',
      revenueAnswerableCount,
      totalCount,
      'No active records have compatible tournament-level revenue yet.',
    ),
    buildPrimaryCoverageRow(
      'profit-surplus-share',
      'Records that can answer prize money / profit/surplus',
      profitAnswerableCount,
      totalCount,
      'No active records have positive compatible tournament-level profit or surplus yet.',
    ),
  ];
}

export function getPrimaryQuestionCaveats(record: TournamentEconomicsRecord): string[] {
  const caveats = new Set(record.caveats);
  const values = [
    ['Prize pool', record.prizePool],
    ['Revenue', record.revenue],
    ['Profit/surplus', record.profitOrSurplus],
  ] as const;

  for (const [label, value] of values) {
    if (value.status === 'unavailable') {
      caveats.add(`${label} is unavailable for this record.`);
    }

    if (value.status === 'derived') {
      caveats.add(`${label} is derived from normalized source rows.`);
    }

    if (value.status === 'estimated') {
      caveats.add(`${label} is estimated and should not be treated as audited.`);
    }

    if (value.status === 'mock') {
      caveats.add(`${label} is mock/sample data.`);
    }
  }

  const revenueRatio = calculatePrizePoolToRevenue(record);
  if (revenueRatio.status === 'unavailable') {
    caveats.add(`Prize money / revenue is unavailable: ${describeUnavailableReason(revenueRatio.reason)}`);
  }

  const profitRatio = calculatePrizePoolToProfitOrSurplus(record);
  if (profitRatio.status === 'unavailable') {
    caveats.add(
      `Prize money / profit or surplus is unavailable: ${describeUnavailableReason(profitRatio.reason)}`,
    );
  }

  return [...caveats];
}

export function getFinancialComparisonRows(
  record: TournamentEconomicsRecord,
): ComparisonChartRow[] {
  const rows = [
    {
      id: 'prize-pool',
      label: 'Prize pool',
      value: record.prizePool,
      status: record.prizePool.status,
      note: record.prizePool.notes ?? 'Normalized prize-pool value.',
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: record.revenue,
      status: record.revenue.status,
      note: record.revenue.notes ?? `Financial kind: ${formatFinancialKind(record.revenue.kind)}.`,
    },
    {
      id: 'profit-surplus',
      label: 'Profit/surplus',
      value: record.profitOrSurplus,
      status: record.profitOrSurplus.status,
      note:
        record.profitOrSurplus.notes ??
        `Financial kind: ${formatFinancialKind(record.profitOrSurplus.kind)}.`,
    },
  ];
  const baseCurrency = record.prizePool.currency;
  const comparableAmounts = rows
    .map((row) =>
      row.value.amount !== null && row.value.currency === baseCurrency ? row.value.amount : null,
    )
    .filter((amount): amount is number => amount !== null);
  const maxAmount = Math.max(0, ...comparableAmounts);

  return rows.map((row) => {
    const hasAmount = row.value.amount !== null && row.value.currency !== null;
    const hasComparableCurrency = hasAmount && row.value.currency === baseCurrency;
    const unavailable = row.value.status === 'unavailable' || !hasAmount;
    const incompatibleCurrency = hasAmount && !hasComparableCurrency;

    return {
      id: row.id,
      label: row.label,
      value: formatMoneyValue(row.value),
      status: unavailable
        ? 'Unavailable'
        : incompatibleCurrency
          ? 'Currency mismatch'
          : valueEyebrow(row.status),
      note: incompatibleCurrency
        ? 'Value is present, but it is not charted against the prize pool without FX conversion.'
        : row.note,
      barPercent:
        hasComparableCurrency && maxAmount > 0 && row.value.amount !== null
          ? (row.value.amount / maxAmount) * 100
          : null,
      unavailable: unavailable || incompatibleCurrency,
    };
  });
}

export function getYearOverYearChartRows(
  records: TournamentEconomicsRecord[],
  allRecords: TournamentEconomicsRecord[],
): YearOverYearChartRow[] {
  return records.map((record) => {
    const result = calculateYearOverYearPrizePoolGrowth(allRecords, record);

    return {
      id: record.id,
      label: `${record.tournament} ${record.year}`,
      value: formatSignedMetricPercent(result),
      note:
        result.status === 'available'
          ? `Compared with ${record.year - 1} ${record.event}.`
          : describeUnavailableReason(result.reason),
      unavailable: result.status === 'unavailable',
    };
  });
}

export function getCoverageSummary(
  data: DashboardDataset,
  records = data.records,
): CoverageSummaryItem[] {
  const counts = records.reduce<Record<string, number>>((summary, record) => {
    summary[record.confidence] = (summary[record.confidence] ?? 0) + 1;
    return summary;
  }, {});

  return Object.entries(counts).map(([confidence, count]) => ({
    confidence,
    count,
    share: records.length > 0 ? count / records.length : 0,
  }));
}

export function getSourceCoverageSummary(
  data: DashboardDataset,
  records: TournamentEconomicsRecord[],
): CoverageSummaryItem[] {
  const linkedSourceIds = new Set(records.flatMap(getRecordSourceIds));
  const linkedSources = data.sources.filter((source) => linkedSourceIds.has(source.id));
  const counts = linkedSources.reduce<Record<string, number>>((summary, source) => {
    summary[source.confidence] = (summary[source.confidence] ?? 0) + 1;
    return summary;
  }, {});

  return Object.entries(counts).map(([confidence, count]) => ({
    confidence,
    count,
    share: linkedSources.length > 0 ? count / linkedSources.length : 0,
  }));
}

export function getSourcesForRecord(
  data: DashboardDataset,
  record: TournamentEconomicsRecord,
): Source[] {
  const recordSourceIds = new Set(record.sourceIds);

  return data.sources.filter((source) => recordSourceIds.has(source.id));
}

export function getVisibleCaveats(
  record: TournamentEconomicsRecord,
  allRecords: TournamentEconomicsRecord[],
): string[] {
  const caveats = new Set(record.caveats);
  const values = [
    ['Prize pool', record.prizePool],
    ['Winner payout', record.winnerPayout],
    ['Runner-up payout', record.runnerUpPayout],
    ['Revenue', record.revenue],
    ['Profit/surplus', record.profitOrSurplus],
  ] as const;

  for (const [label, value] of values) {
    if (value.status === 'unavailable') {
      caveats.add(`${label} is unavailable for this record.`);
    }

    if (value.status === 'derived') {
      caveats.add(`${label} is derived from normalized source rows.`);
    }

    if (value.status === 'estimated') {
      caveats.add(`${label} is estimated and should not be treated as audited.`);
    }

    if (value.status === 'mock') {
      caveats.add(`${label} is mock/sample data.`);
    }
  }

  const revenueRatio = calculatePrizePoolToRevenue(record);
  if (revenueRatio.status === 'unavailable') {
    caveats.add(`Prize pool / revenue is unavailable: ${describeUnavailableReason(revenueRatio.reason)}`);
  }

  const profitRatio = calculatePrizePoolToProfitOrSurplus(record);
  if (profitRatio.status === 'unavailable') {
    caveats.add(
      `Prize pool / profit or surplus is unavailable: ${describeUnavailableReason(profitRatio.reason)}`,
    );
  }

  const yearOverYearGrowth = calculateYearOverYearPrizePoolGrowth(allRecords, record);
  if (yearOverYearGrowth.status === 'unavailable') {
    caveats.add(`Year-over-year growth is unavailable: ${describeUnavailableReason(yearOverYearGrowth.reason)}`);
  }

  return [...caveats];
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

function primaryRatioNote(
  result: NumericMetricResult,
  availableNote: string,
  unavailableAction: string,
): string {
  if (result.status === 'available') {
    return availableNote;
  }

  return `${describeUnavailableReason(result.reason)} ${unavailableAction}`;
}

function primaryAnswerEyebrow(
  result: NumericMetricResult,
  denominatorLabel: string,
): string {
  if (result.status === 'available') {
    return 'Answer available';
  }

  return `Needs ${denominatorLabel} data`;
}

function ratioBarPercent(result: NumericMetricResult): number | null {
  if (result.status === 'unavailable') {
    return null;
  }

  return Math.min(100, Math.max(3, result.value * 100));
}

function buildPrimaryCoverageRow(
  id: PrimaryQuestionCoverageRow['id'],
  label: string,
  answerableCount: number,
  totalCount: number,
  unavailableNote: string,
): PrimaryQuestionCoverageRow {
  const share = totalCount > 0 ? answerableCount / totalCount : 0;

  return {
    id,
    label,
    value: `${answerableCount}/${totalCount}`,
    note:
      answerableCount > 0
        ? `${answerableCount} of ${totalCount} active record(s) have the needed compatible denominator.`
        : unavailableNote,
    answerableCount,
    totalCount,
    barPercent: share * 100,
    unavailable: answerableCount === 0,
  };
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

function getRecordSourceIds(record: TournamentEconomicsRecord): string[] {
  return [
    ...record.sourceIds,
    ...record.prizePool.sourceIds,
    ...record.revenue.sourceIds,
    ...record.profitOrSurplus.sourceIds,
    ...record.winnerPayout.sourceIds,
    ...record.runnerUpPayout.sourceIds,
    ...record.roundPayouts.flatMap((roundPayout) => roundPayout.payout.sourceIds),
  ];
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
