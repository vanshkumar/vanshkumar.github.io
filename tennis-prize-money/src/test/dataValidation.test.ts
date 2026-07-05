import { describe, expect, it } from 'vitest';
import { dashboardDataset, type DashboardDataset } from '../data/dashboardDataset';
import { DataValidationError, parseDashboardDataset } from '../data/schemas';

describe('dashboard data validation hardening', () => {
  it('rejects mock sources in datasets labeled as real', () => {
    const dataset = cloneDataset();
    dataset.sources[0] = {
      ...dataset.sources[0],
      sourceType: 'mock',
      confidence: 'mock',
    };

    expect(() => parseDashboardDataset(dataset)).toThrow(DataValidationError);
    expect(() => parseDashboardDataset(dataset)).toThrow('Real datasets cannot contain mock sources');
  });

  it('rejects mock value statuses in datasets labeled as real', () => {
    const dataset = cloneDataset();
    dataset.records[0] = {
      ...dataset.records[0],
      prizePool: {
        ...dataset.records[0].prizePool,
        status: 'mock',
      },
    };

    expect(() => parseDashboardDataset(dataset)).toThrow(DataValidationError);
    expect(() => parseDashboardDataset(dataset)).toThrow('cannot contain mock value status');
  });

  it('requires mock source type and mock confidence to be paired', () => {
    const dataset = cloneDataset();
    dataset.sources[0] = {
      ...dataset.sources[0],
      sourceType: 'mock',
      confidence: 'high',
    };

    expect(() => parseDashboardDataset(dataset)).toThrow(DataValidationError);
    expect(() => parseDashboardDataset(dataset)).toThrow(
      'mock source type and confidence must be paired',
    );
  });

  it('rejects available money values without source ids', () => {
    const dataset = cloneDataset();
    dataset.records[0] = {
      ...dataset.records[0],
      winnerPayout: {
        ...dataset.records[0].winnerPayout,
        sourceIds: [],
      },
    };

    expect(() => parseDashboardDataset(dataset)).toThrow(DataValidationError);
    expect(() => parseDashboardDataset(dataset)).toThrow(
      'records[0].winnerPayout.sourceIds must include at least one source id',
    );
  });

  it('keeps the active v0.1 seed in real-data mode with labeled sources', () => {
    expect(dashboardDataset.metadata.dataMode).toBe('real');

    for (const source of dashboardDataset.sources) {
      expect(source.title.trim()).not.toHaveLength(0);
      expect(source.publisher.trim()).not.toHaveLength(0);
      expect(source.notes.trim()).not.toHaveLength(0);
      expect(source.sourceType).not.toBe('mock');
      expect(source.confidence).not.toBe('mock');
      expect(source.accessedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(() => new URL(source.url)).not.toThrow();
    }
  });
});

function cloneDataset(): DashboardDataset {
  return structuredClone(dashboardDataset);
}
