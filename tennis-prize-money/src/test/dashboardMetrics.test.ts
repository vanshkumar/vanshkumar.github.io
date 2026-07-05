import { describe, expect, it } from 'vitest';
import { mockDashboardData } from '../data/mockDashboardData';
import {
  filterRecords,
  formatPercent,
  getFilterOptions,
  summarizeKpis,
} from '../lib/dashboardMetrics';

describe('dashboard metrics scaffold helpers', () => {
  it('keeps the Task 1 dataset visibly marked as mock data', () => {
    expect(mockDashboardData.datasetLabel).toContain('MOCK');
    expect(mockDashboardData.records.every((record) => record.confidence === 'mock')).toBe(true);
    expect(
      mockDashboardData.sources.every((source) => source.sourceType === 'mock'),
    ).toBe(true);
  });

  it('filters records by dashboard selections', () => {
    const [firstRecord] = mockDashboardData.records;
    const filtered = filterRecords(mockDashboardData.records, {
      tournament: firstRecord.tournament,
      year: String(firstRecord.year),
      event: firstRecord.event,
      confidence: 'mock',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(firstRecord.id);
  });

  it('builds options and KPI placeholders from mock records', () => {
    const options = getFilterOptions(mockDashboardData.records);
    const kpis = summarizeKpis(mockDashboardData.records[0]);

    expect(options.tournaments).toContain('Mock Open');
    expect(kpis).toHaveLength(8);
    expect(kpis.map((kpi) => kpi.label)).toContain('Prize pool / revenue');
  });

  it('does not compute percentages when the denominator is unavailable or nonpositive', () => {
    expect(formatPercent(100, null)).toBe('Unavailable');
    expect(formatPercent(100, 0)).toBe('Unavailable');
    expect(formatPercent(25, 100)).toBe('25.0%');
  });
});
