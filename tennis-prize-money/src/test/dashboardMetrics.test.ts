import { describe, expect, it } from 'vitest';
import { dashboardDataset, type TournamentEconomicsRecord } from '../data/dashboardDataset';
import {
  filterRecords,
  formatMetricPercent,
  getCoverageSummary,
  getFilterOptions,
  summarizeKpis,
} from '../lib/dashboardMetrics';
import {
  calculatePrizePoolToProfitOrSurplus,
  calculatePrizePoolToRevenue,
  calculateRoundPayoutPercentages,
  calculateWinnerRunnerUpRatio,
  calculateYearOverYearPrizePoolGrowth,
  getRunnerUpPayout,
  getTotalPrizePool,
  getWinnerPayout,
} from '../lib/metricEngine';

const normalRecord = dashboardDataset.records.find((record) => record.id === 'mock-open-2026-ms');

if (!normalRecord) {
  throw new Error('Expected mock-open-2026-ms fixture to exist');
}

describe('validated dashboard dataset', () => {
  it('keeps the dataset visibly marked as mock data', () => {
    expect(dashboardDataset.metadata.datasetLabel).toContain('MOCK');
    expect(dashboardDataset.metadata.datasetNotice).toContain('mock/sample');
    expect(dashboardDataset.records.every((record) => record.confidence === 'mock')).toBe(true);
    expect(dashboardDataset.sources.every((source) => source.sourceType === 'mock')).toBe(true);
  });

  it('filters validated records by dashboard selections', () => {
    const filtered = filterRecords(dashboardDataset.records, {
      tournament: normalRecord.tournament,
      year: String(normalRecord.year),
      event: normalRecord.event,
      confidence: 'mock',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(normalRecord.id);
  });

  it('builds options, coverage, and KPI cards from validated records', () => {
    const options = getFilterOptions(dashboardDataset.records);
    const coverageSummary = getCoverageSummary(dashboardDataset);
    const kpis = summarizeKpis(normalRecord, dashboardDataset.records);

    expect(options.tournaments).toContain('Mock Open');
    expect(coverageSummary).toContainEqual({ confidence: 'mock', count: 4 });
    expect(kpis).toHaveLength(9);
    expect(kpis.map((kpi) => kpi.label)).toContain('Prize pool YoY growth');
  });
});

describe('metric engine calculations', () => {
  it('calculates normal prize, payout, ratio, growth, and round percentage cases', () => {
    expect(getTotalPrizePool(normalRecord)).toMatchObject({
      status: 'available',
      value: { amount: 3200000, currency: 'USD' },
    });
    expect(getWinnerPayout(normalRecord)).toMatchObject({
      status: 'available',
      value: { amount: 780000, currency: 'USD' },
    });
    expect(getRunnerUpPayout(normalRecord)).toMatchObject({
      status: 'available',
      value: { amount: 390000, currency: 'USD' },
    });
    expect(calculateWinnerRunnerUpRatio(normalRecord)).toMatchObject({
      status: 'available',
      value: 2,
    });
    expect(calculatePrizePoolToRevenue(normalRecord)).toMatchObject({
      status: 'available',
      value: 3200000 / 12400000,
    });
    expect(calculatePrizePoolToProfitOrSurplus(normalRecord)).toMatchObject({
      status: 'available',
      value: 3200000 / 2100000,
    });
    expect(calculateYearOverYearPrizePoolGrowth(dashboardDataset.records, normalRecord)).toMatchObject({
      status: 'available',
      value: 200000 / 3000000,
    });

    const finalRound = calculateRoundPayoutPercentages(normalRecord).find(
      (round) => round.round === 'F',
    );

    expect(finalRound?.percentage).toMatchObject({
      status: 'available',
      value: 780000 / 3200000,
    });
    expect(formatMetricPercent(finalRound?.percentage ?? { status: 'unavailable', value: null, reason: 'missing_data' })).toBe(
      '24.4%',
    );
  });

  it('does not compute percentages when data is missing', () => {
    const record = cloneRecord(normalRecord, {
      revenue: {
        amount: null,
        currency: null,
        kind: 'unknown',
        status: 'unavailable',
        sourceIds: [],
      },
    });

    expect(calculatePrizePoolToRevenue(record)).toMatchObject({
      status: 'unavailable',
      reason: 'missing_data',
    });
  });

  it('does not compute prize pool / profit when profit is negative', () => {
    const record = cloneRecord(normalRecord, {
      profitOrSurplus: {
        amount: -250000,
        currency: 'USD',
        kind: 'tournament_profit',
        status: 'reported',
        sourceIds: ['mock-task-2-source'],
      },
    });

    expect(calculatePrizePoolToProfitOrSurplus(record)).toMatchObject({
      status: 'unavailable',
      reason: 'negative_denominator',
    });
  });

  it('does not compute prize pool / profit when profit is zero', () => {
    const record = cloneRecord(normalRecord, {
      profitOrSurplus: {
        amount: 0,
        currency: 'USD',
        kind: 'tournament_surplus',
        status: 'reported',
        sourceIds: ['mock-task-2-source'],
      },
    });

    expect(calculatePrizePoolToProfitOrSurplus(record)).toMatchObject({
      status: 'unavailable',
      reason: 'zero_denominator',
    });
  });

  it('does not compute compatible-looking ratios across incompatible currencies', () => {
    const record = cloneRecord(normalRecord, {
      revenue: {
        amount: 12400000,
        currency: 'EUR',
        kind: 'tournament_revenue',
        status: 'reported',
        sourceIds: ['mock-task-2-source'],
      },
    });

    expect(calculatePrizePoolToRevenue(record)).toMatchObject({
      status: 'unavailable',
      reason: 'incompatible_currency',
    });
  });

  it('does not compute ratios from semantically incompatible financial denominators', () => {
    const revenueRecord = cloneRecord(normalRecord, {
      revenue: {
        amount: 12400000,
        currency: 'USD',
        kind: 'organization_revenue',
        status: 'reported',
        sourceIds: ['mock-task-2-source'],
      },
    });
    const profitRecord = cloneRecord(normalRecord, {
      profitOrSurplus: {
        amount: 2100000,
        currency: 'USD',
        kind: 'organization_surplus',
        status: 'reported',
        sourceIds: ['mock-task-2-source'],
      },
    });

    expect(calculatePrizePoolToRevenue(revenueRecord)).toMatchObject({
      status: 'unavailable',
      reason: 'incompatible_financial_kind',
    });
    expect(calculatePrizePoolToProfitOrSurplus(profitRecord)).toMatchObject({
      status: 'unavailable',
      reason: 'incompatible_financial_kind',
    });
  });
});

function cloneRecord(
  record: TournamentEconomicsRecord,
  overrides: Partial<TournamentEconomicsRecord>,
): TournamentEconomicsRecord {
  return {
    ...structuredClone(record),
    ...overrides,
  };
}
