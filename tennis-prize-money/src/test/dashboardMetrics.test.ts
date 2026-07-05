import { describe, expect, it } from 'vitest';
import { dashboardDataset, type TournamentEconomicsRecord } from '../data/dashboardDataset';
import {
  filterRecords,
  formatMetricPercent,
  getFinalistComparisonRows,
  getFinancialComparisonRows,
  getCoverageSummary,
  getFilterOptions,
  getPrimaryQuestionCaveats,
  getPrimaryQuestionCoverage,
  getPrimaryQuestionRows,
  getSourceCoverageSummary,
  getSourcesForRecord,
  getVisibleCaveats,
  getYearOverYearChartRows,
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
import {
  eventSeedExpectations,
  fullTournamentExpectations,
  mainDrawRoundMultipliers,
  seedDatasetExpectations,
} from './fixtures/seedDatasetExpectations';

const normalRecord = dashboardDataset.records.find(
  (record) => record.id === 'australian-open-2025-ms',
);
const wimbledonTotalRecord = dashboardDataset.records.find(
  (record) => record.id === 'wimbledon-2025-tournament-total',
);

if (!normalRecord) {
  throw new Error('Expected australian-open-2025-ms fixture to exist');
}

if (!wimbledonTotalRecord) {
  throw new Error('Expected wimbledon-2025-tournament-total fixture to exist');
}

describe('validated seed dashboard dataset', () => {
  it('loads a sourced real-data seed rather than mock/sample records', () => {
    expect(dashboardDataset.metadata.dataMode).toBe('real');
    expect(dashboardDataset.metadata.datasetLabel).toContain('Grand Slam');
    expect(dashboardDataset.records.every((record) => record.confidence !== 'mock')).toBe(true);
    expect(dashboardDataset.sources.every((source) => source.sourceType !== 'mock')).toBe(true);
  });

  it('contains expected event-level and full-tournament seed records', () => {
    expect(dashboardDataset.records).toHaveLength(seedDatasetExpectations.length);

    for (const expected of eventSeedExpectations) {
      const record = dashboardDataset.records.find((item) => item.id === expected.id);

      expect(record).toBeDefined();
      expect(record).toMatchObject({
        tournament: expected.tournament,
        event: expected.event,
        year: expected.year,
        confidence: expected.confidence,
        displayCurrency: expected.currency,
        prizeMoneyScope: {
          type: expected.prizeMoneyScopeType,
        },
        prizePool: {
          amount: expected.prizePool,
          currency: expected.currency,
        },
        winnerPayout: {
          amount: expected.winner,
          currency: expected.currency,
        },
        runnerUpPayout: {
          amount: expected.runnerUp,
          currency: expected.currency,
        },
      });
    }

    for (const expected of fullTournamentExpectations) {
      const record = dashboardDataset.records.find((item) => item.id === expected.id);

      expect(record).toBeDefined();
      expect(record).toMatchObject({
        tournament: expected.tournament,
        event: expected.event,
        year: expected.year,
        confidence: expected.confidence,
        displayCurrency: expected.currency,
        prizeMoneyScope: {
          type: expected.prizeMoneyScopeType,
        },
        prizePool: {
          amount: expected.prizePool,
          currency: expected.currency,
        },
        winnerPayout: {
          amount: null,
          currency: null,
          status: 'unavailable',
        },
        runnerUpPayout: {
          amount: null,
          currency: null,
          status: 'unavailable',
        },
        roundPayouts: [],
      });

      if (expected.revenue) {
        expect(record?.revenue).toMatchObject({
          amount: expected.revenue,
          currency: expected.currency,
          kind: 'tournament_revenue',
        });
      }

      if (expected.profitOrSurplus) {
        expect(record?.profitOrSurplus).toMatchObject({
          amount: expected.profitOrSurplus,
          currency: expected.currency,
          kind: 'tournament_profit',
        });
      }
    }
  });

  it('keeps every real seed row linked to valid source metadata', () => {
    for (const record of dashboardDataset.records) {
      const sources = getSourcesForRecord(dashboardDataset, record);
      const expected = seedDatasetExpectations.find((item) => item.id === record.id);

      expect(expected).toBeDefined();
      if (!expected) {
        throw new Error(`Missing seed expectation for ${record.id}`);
      }

      expect(sources).toHaveLength(expected.sourceCount);
      expect(record.sourceIds.length).toBeGreaterThan(0);

      for (const source of sources) {
        expect(() => new URL(source.url)).not.toThrow();
        expect(source.accessedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(source.confidence).not.toBe('mock');
      }
    }
  });

  it('keeps tournament financial denominators unavailable unless sourced clearly', () => {
    const recordsWithoutFinancials = dashboardDataset.records.filter(
      (record) => record.revenue.status === 'unavailable',
    );

    expect(recordsWithoutFinancials.length).toBeGreaterThan(0);

    for (const record of recordsWithoutFinancials) {
      expect(record.revenue).toMatchObject({
        amount: null,
        currency: null,
        kind: 'unknown',
        status: 'unavailable',
        sourceIds: [],
      });
      expect(record.profitOrSurplus).toMatchObject({
        amount: null,
        currency: null,
        kind: 'unknown',
        status: 'unavailable',
        sourceIds: [],
      });
      expect(record.caveats.join(' ')).toContain('Revenue and profit/surplus are unavailable');
    }

    expect(wimbledonTotalRecord.revenue).toMatchObject({
      amount: 423626000,
      currency: 'GBP',
      kind: 'tournament_revenue',
      scopeLabel: 'Championships operating-company turnover',
    });
    expect(wimbledonTotalRecord.profitOrSurplus).toMatchObject({
      amount: 52720000,
      currency: 'GBP',
      kind: 'tournament_profit',
      scopeLabel: 'Championships operating-company operating profit',
    });
    expect(wimbledonTotalRecord.profitOrSurplus.notes).toContain(
      'The LTA distribution is not treated as profit.',
    );
  });

  it('matches each seed prize pool to the weighted main-draw round payouts', () => {
    const eventRecords = dashboardDataset.records.filter(
      (record) => record.prizeMoneyScope.type === 'event_main_draw',
    );

    for (const record of eventRecords) {
      const weightedRoundTotal = record.roundPayouts.reduce((total, roundPayout) => {
        const multiplier = mainDrawRoundMultipliers[roundPayout.round] ?? 0;
        return total + (roundPayout.payout.amount ?? 0) * multiplier;
      }, 0);

      expect(weightedRoundTotal).toBe(record.prizePool.amount);
    }
  });

  it('filters validated records by dashboard selections', () => {
    const filtered = filterRecords(dashboardDataset.records, {
      tournament: normalRecord.tournament,
      year: String(normalRecord.year),
      event: normalRecord.event,
      confidence: 'high',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(normalRecord.id);
  });

  it('builds options, coverage, and KPI cards from validated records', () => {
    const options = getFilterOptions(dashboardDataset.records);
    const coverageSummary = getCoverageSummary(dashboardDataset);
    const kpis = summarizeKpis(normalRecord, dashboardDataset.records);

    expect(options.tournaments).toEqual([
      'Australian Open',
      'Roland Garros',
      'US Open',
      'Wimbledon',
    ]);
    expect(options.years).toEqual(['2025', '2024']);
    expect(options.events).toEqual(['Full tournament', "Men's singles"]);
    expect(coverageSummary).toContainEqual(
      expect.objectContaining({ confidence: 'high', count: 6, share: 0.75 }),
    );
    expect(coverageSummary).toContainEqual(
      expect.objectContaining({ confidence: 'medium', count: 2, share: 0.25 }),
    );
    expect(kpis).toHaveLength(9);
    expect(kpis.map((kpi) => kpi.label)).toContain('Prize pool YoY growth');
  });

  it('returns an empty record set for filter combinations outside the seed data', () => {
    const filtered = filterRecords(dashboardDataset.records, {
      tournament: 'all',
      year: 'all',
      event: 'all',
      confidence: 'low',
    });

    expect(filtered).toEqual([]);
    expect(getCoverageSummary(dashboardDataset, filtered)).toEqual([]);
    expect(getSourceCoverageSummary(dashboardDataset, filtered)).toEqual([]);
  });

  it('builds finalist and financial chart rows with unavailable states', () => {
    const finalistRows = getFinalistComparisonRows(normalRecord);
    const financialRows = getFinancialComparisonRows(normalRecord);

    expect(finalistRows).toEqual([
      expect.objectContaining({
        id: 'winner',
        value: 'A$3,500,000',
        barPercent: 100,
        unavailable: false,
      }),
      expect.objectContaining({
        id: 'runner-up',
        value: 'A$1,900,000',
        barPercent: (1900000 / 3500000) * 100,
        unavailable: false,
      }),
    ]);
    expect(financialRows).toEqual([
      expect.objectContaining({
        id: 'prize-pool',
        value: 'A$33,108,000',
        barPercent: 100,
        unavailable: false,
      }),
      expect.objectContaining({
        id: 'revenue',
        value: 'Unavailable',
        status: 'Unavailable',
        barPercent: null,
        unavailable: true,
      }),
      expect.objectContaining({
        id: 'profit-surplus',
        value: 'Unavailable',
        status: 'Unavailable',
        barPercent: null,
        unavailable: true,
      }),
    ]);
  });

  it('builds primary question rows around revenue and profit share only', () => {
    const rows = getPrimaryQuestionRows(normalRecord);
    const coverage = getPrimaryQuestionCoverage(dashboardDataset.records);
    const caveats = getPrimaryQuestionCaveats(normalRecord);

    expect(rows).toEqual([
      expect.objectContaining({
        id: 'revenue-share',
        label: 'Prize money as % of tournament revenue',
        value: 'Unavailable',
        numeratorLabel: "Prize money (men's singles main draw)",
        numeratorValue: 'A$33,108,000',
        denominatorValue: 'Unavailable',
        barPercent: null,
        unavailable: true,
      }),
      expect.objectContaining({
        id: 'profit-surplus-share',
        label: 'Prize money as % of tournament profit/surplus',
        value: 'Unavailable',
        numeratorLabel: "Prize money (men's singles main draw)",
        numeratorValue: 'A$33,108,000',
        denominatorValue: 'Unavailable',
        barPercent: null,
        unavailable: true,
      }),
    ]);
    expect(coverage).toEqual([
      expect.objectContaining({
        id: 'revenue-share',
        value: '2/8',
        answerableCount: 2,
        totalCount: 8,
        unavailable: false,
      }),
      expect.objectContaining({
        id: 'profit-surplus-share',
        value: '2/8',
        answerableCount: 2,
        totalCount: 8,
        unavailable: false,
      }),
    ]);
    expect(caveats).toContain('Prize money / revenue is unavailable: Missing compatible data.');
    expect(caveats).not.toContain(
      'Year-over-year growth is unavailable: No matching prior-year record is available.',
    );
  });

  it('marks primary question rows answerable when compatible full-tournament denominators exist', () => {
    const record = wimbledonTotalRecord;

    expect(getPrimaryQuestionRows(record)).toEqual([
      expect.objectContaining({
        id: 'revenue-share',
        value: '12.6%',
        numeratorLabel: 'Prize money (full tournament)',
        denominatorLabel: 'Championships operating-company turnover',
        denominatorValue: '£423,626,000',
        barPercent: (53500000 / 423626000) * 100,
        unavailable: false,
      }),
      expect.objectContaining({
        id: 'profit-surplus-share',
        value: '101.5%',
        numeratorLabel: 'Prize money (full tournament)',
        denominatorLabel: 'Championships operating-company operating profit',
        denominatorValue: '£52,720,000',
        barPercent: 100,
        unavailable: false,
      }),
    ]);
    expect(getPrimaryQuestionCoverage([record])).toEqual([
      expect.objectContaining({ id: 'revenue-share', value: '1/1', barPercent: 100 }),
      expect.objectContaining({ id: 'profit-surplus-share', value: '1/1', barPercent: 100 }),
    ]);
  });

  it('builds year-over-year chart rows when prior full-tournament records exist', () => {
    const yearOverYearRows = getYearOverYearChartRows(
      dashboardDataset.records,
      dashboardDataset.records,
    );
    const wimbledonRow = yearOverYearRows.find(
      (row) => row.id === 'wimbledon-2025-tournament-total',
    );
    const australianOpenRow = yearOverYearRows.find(
      (row) => row.id === 'australian-open-2025-tournament-total',
    );
    const mensSinglesRow = yearOverYearRows.find(
      (row) => row.id === normalRecord.id,
    );

    expect(yearOverYearRows).toHaveLength(dashboardDataset.records.length);
    expect(wimbledonRow).toMatchObject({
      value: '+7.0%',
      note: 'Compared with 2024 Full tournament.',
      unavailable: false,
    });
    expect(australianOpenRow).toMatchObject({
      value: '+11.6%',
      note: 'Compared with 2024 Full tournament.',
      unavailable: false,
    });
    expect(mensSinglesRow).toMatchObject({
      id: normalRecord.id,
      value: 'Unavailable',
      note: 'No matching prior-year record is available.',
    });
  });

  it('surfaces derived and unavailable caveats for display', () => {
    const derivedRecord = dashboardDataset.records.find(
      (record) => record.id === 'roland-garros-2025-ms',
    );

    expect(derivedRecord).toBeDefined();
    if (!derivedRecord) {
      throw new Error('Expected roland-garros-2025-ms fixture to exist');
    }

    const caveats = getVisibleCaveats(derivedRecord, dashboardDataset.records);

    expect(caveats).toContain('Prize pool is derived from normalized source rows.');
    expect(caveats).toContain('Revenue is unavailable for this record.');
    expect(caveats).toContain(
      'Prize pool / profit or surplus is unavailable: Missing compatible data.',
    );
    expect(caveats).toContain(
      'Year-over-year growth is unavailable: No matching prior-year record is available.',
    );
  });
});

describe('metric engine calculations', () => {
  it('calculates sourced prize, payout, ratio, and round percentage cases', () => {
    expect(getTotalPrizePool(normalRecord)).toMatchObject({
      status: 'available',
      value: { amount: 33108000, currency: 'AUD' },
    });
    expect(getWinnerPayout(normalRecord)).toMatchObject({
      status: 'available',
      value: { amount: 3500000, currency: 'AUD' },
    });
    expect(getRunnerUpPayout(normalRecord)).toMatchObject({
      status: 'available',
      value: { amount: 1900000, currency: 'AUD' },
    });
    expect(calculateWinnerRunnerUpRatio(normalRecord)).toMatchObject({
      status: 'available',
      value: 3500000 / 1900000,
    });

    const winnerRound = calculateRoundPayoutPercentages(normalRecord).find(
      (round) => round.round === 'W',
    );

    expect(winnerRound?.percentage).toMatchObject({
      status: 'available',
      value: 3500000 / 33108000,
    });
    expect(
      formatMetricPercent(
        winnerRound?.percentage ?? {
          status: 'unavailable',
          value: null,
          reason: 'missing_data',
        },
      ),
    ).toBe('10.6%');
  });

  it('calculates compatible event-revenue ratios for event-level records', () => {
    const record = cloneRecord(normalRecord, {
      revenue: {
        amount: 132432000,
        currency: 'AUD',
        kind: 'event_revenue',
        status: 'reported',
        sourceIds: ['ao-2025-prize-money-release'],
      },
    });

    expect(calculatePrizePoolToRevenue(record)).toMatchObject({
      status: 'available',
      value: 0.25,
    });
  });

  it('calculates compatible financial ratios for full-tournament records', () => {
    expect(calculatePrizePoolToRevenue(wimbledonTotalRecord)).toMatchObject({
      status: 'available',
      value: 53500000 / 423626000,
    });
    expect(calculatePrizePoolToProfitOrSurplus(wimbledonTotalRecord)).toMatchObject({
      status: 'available',
      value: 53500000 / 52720000,
    });
  });

  it('does not compare event-level prize money to tournament-level denominators', () => {
    const record = cloneRecord(normalRecord, {
      revenue: {
        amount: 132432000,
        currency: 'AUD',
        kind: 'tournament_revenue',
        status: 'reported',
        sourceIds: ['ao-2025-prize-money-release'],
      },
      profitOrSurplus: {
        amount: 16554000,
        currency: 'AUD',
        kind: 'tournament_surplus',
        status: 'reported',
        sourceIds: ['ao-2025-prize-money-release'],
      },
    });

    expect(calculatePrizePoolToRevenue(record)).toMatchObject({
      status: 'unavailable',
      reason: 'incompatible_scope',
    });
    expect(calculatePrizePoolToProfitOrSurplus(record)).toMatchObject({
      status: 'unavailable',
      reason: 'incompatible_scope',
    });
  });

  it('calculates year-over-year growth when a prior same-event record exists', () => {
    const priorRecord = cloneRecord(normalRecord, {
      id: 'australian-open-2024-ms',
      year: 2024,
      prizePool: {
        ...normalRecord.prizePool,
        amount: 30000000,
      },
    });

    expect(calculateYearOverYearPrizePoolGrowth([priorRecord, normalRecord], normalRecord)).toMatchObject({
      status: 'available',
      value: 3108000 / 30000000,
    });
  });

  it('does not compute percentages when data is missing', () => {
    expect(calculatePrizePoolToRevenue(normalRecord)).toMatchObject({
      status: 'unavailable',
      reason: 'missing_data',
    });
    expect(calculateYearOverYearPrizePoolGrowth(dashboardDataset.records, normalRecord)).toMatchObject({
      status: 'unavailable',
      reason: 'no_prior_record',
    });
  });

  it('does not compute prize pool / profit when profit is negative', () => {
    const record = cloneRecord(wimbledonTotalRecord, {
      profitOrSurplus: {
        amount: -250000,
        currency: 'GBP',
        kind: 'tournament_profit',
        status: 'reported',
        sourceIds: ['aeltc-championships-2025-accounts'],
      },
    });

    expect(calculatePrizePoolToProfitOrSurplus(record)).toMatchObject({
      status: 'unavailable',
      reason: 'negative_denominator',
    });
  });

  it('does not compute prize pool / profit when profit is zero', () => {
    const record = cloneRecord(wimbledonTotalRecord, {
      profitOrSurplus: {
        amount: 0,
        currency: 'GBP',
        kind: 'tournament_surplus',
        status: 'reported',
        sourceIds: ['aeltc-championships-2025-accounts'],
      },
    });

    expect(calculatePrizePoolToProfitOrSurplus(record)).toMatchObject({
      status: 'unavailable',
      reason: 'zero_denominator',
    });
  });

  it('does not compute compatible-looking ratios across incompatible currencies', () => {
    const record = cloneRecord(wimbledonTotalRecord, {
      revenue: {
        amount: 12400000,
        currency: 'EUR',
        kind: 'tournament_revenue',
        status: 'reported',
        sourceIds: ['aeltc-championships-2025-accounts'],
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
        currency: 'AUD',
        kind: 'organization_revenue',
        status: 'reported',
        sourceIds: ['ao-2025-prize-money-release'],
      },
    });
    const profitRecord = cloneRecord(normalRecord, {
      profitOrSurplus: {
        amount: 2100000,
        currency: 'AUD',
        kind: 'organization_surplus',
        status: 'reported',
        sourceIds: ['ao-2025-prize-money-release'],
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
