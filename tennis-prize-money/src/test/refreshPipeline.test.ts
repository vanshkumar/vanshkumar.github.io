import { describe, expect, it } from 'vitest';
import { dashboardDataset, type Source, type TournamentEconomicsRecord } from '../data/dashboardDataset';
import {
  RefreshError,
  createJsonHttpSourceAdapter,
  runDataRefresh,
  type RefreshLogger,
  type StaticJsonOutput,
} from '../refresh';

const australianOpenRecord = dashboardDataset.records.find(
  (record) => record.id === 'australian-open-2025-ms',
);
const australianOpenSource = dashboardDataset.sources.find(
  (source) => source.id === 'ao-2025-prize-money-release',
);

if (!australianOpenRecord || !australianOpenSource) {
  throw new Error('Expected Australian Open seed fixtures to exist');
}

const normalRecord: TournamentEconomicsRecord = australianOpenRecord;
const normalSource: Source = australianOpenSource;

describe('data refresh pipeline', () => {
  it('fetches, normalizes, validates, merges, and writes static JSON outputs', async () => {
    const fixtureSource = createFixtureSource();
    const fixtureRecord = createFixtureRecord(fixtureSource.id);
    const writes: StaticJsonOutput[] = [];
    const logger = createTestLogger();
    const fetcher = createJsonFetch({
      sources: [fixtureSource],
      records: [fixtureRecord],
    });

    const result = await runDataRefresh({
      existingData: dashboardDataset,
      adapters: [
        createJsonHttpSourceAdapter({
          id: 'fixture-adapter',
          label: 'Fixture adapter',
          url: 'https://example.com/refresh-feed.json?token=super-secret',
        }),
      ],
      fetch: fetcher,
      logger,
      now: () => new Date('2026-07-06T00:00:00.000Z'),
      writeJsonOutput: async (output) => {
        writes.push(output);
        return { path: output.path, changed: true };
      },
    });

    expect(result.dataset.metadata.lastRefreshedAt).toBe('2026-07-06T00:00:00.000Z');
    expect(result.dataset.sources).toContainEqual(fixtureSource);
    expect(result.dataset.records).toContainEqual(fixtureRecord);
    expect(result.adapterResults).toEqual([
      {
        id: 'fixture-adapter',
        label: 'Fixture adapter',
        sourceCount: 1,
        recordCount: 1,
      },
    ]);
    expect(writes.map((write) => write.path)).toEqual([
      'src/data/static/seedDatasetMetadata.json',
      'src/data/raw/source-metadata/grandSlam2025Sources.json',
      'src/data/normalized/grandSlam2025MensSingles.json',
    ]);
    expect(logger.messages.join(' ')).not.toContain('super-secret');
  });

  it('replaces matching ids while preserving unrelated records', async () => {
    const updatedRecord = {
      ...structuredClone(normalRecord),
      prizePool: {
        ...normalRecord.prizePool,
        amount: 33108001,
      },
    };

    const result = await runDataRefresh({
      existingData: dashboardDataset,
      adapters: [
        createJsonHttpSourceAdapter({
          id: 'fixture-adapter',
          label: 'Fixture adapter',
          url: 'https://example.com/refresh-feed.json',
        }),
      ],
      fetch: createJsonFetch({
        sources: [],
        records: [updatedRecord],
      }),
      now: () => new Date('2026-07-05T18:00:00.000Z'),
      writeJsonOutput: async (output) => ({ path: output.path, changed: false }),
    });

    expect(result.dataset.records).toHaveLength(dashboardDataset.records.length);
    expect(
      result.dataset.records.find((record) => record.id === normalRecord.id)?.prizePool.amount,
    ).toBe(33108001);
    expect(
      result.dataset.records.find((record) => record.id === 'wimbledon-2025-ms'),
    ).toBeDefined();
  });

  it('fails before writing when an adapter response is invalid', async () => {
    const writes: StaticJsonOutput[] = [];

    await expect(
      runDataRefresh({
        existingData: dashboardDataset,
        adapters: [
          createJsonHttpSourceAdapter({
            id: 'fixture-adapter',
            label: 'Fixture adapter',
            url: 'https://example.com/refresh-feed.json',
          }),
        ],
        fetch: createJsonFetch({
          sources: [],
          records: [
            {
              ...structuredClone(normalRecord),
              sourceIds: ['missing-source-id'],
            },
          ],
        }),
        writeJsonOutput: async (output) => {
          writes.push(output);
          return { path: output.path, changed: true };
        },
      }),
    ).rejects.toThrow('missing-source-id');

    expect(writes).toEqual([]);
  });

  it('returns a safe failure when source fetch fails', async () => {
    const logger = createTestLogger();

    await expect(
      runDataRefresh({
        existingData: dashboardDataset,
        adapters: [
          createJsonHttpSourceAdapter({
            id: 'fixture-adapter',
            label: 'Fixture adapter',
            url: 'https://example.com/refresh-feed.json?token=super-secret',
          }),
        ],
        fetch: async () =>
          new Response(JSON.stringify({ message: 'nope' }), {
            status: 500,
          }),
        logger,
        writeJsonOutput: async (output) => ({ path: output.path, changed: true }),
      }),
    ).rejects.toThrow(RefreshError);

    expect(logger.messages.join(' ')).toContain('status 500');
    expect(logger.messages.join(' ')).not.toContain('super-secret');
  });
});

function createFixtureSource(): Source {
  return {
    ...normalSource,
    id: 'fixture-official-prize-money',
    title: 'Fixture Open official prize money',
    publisher: 'Fixture Open',
    url: 'https://example.com/fixture-open-prize-money',
    accessedAt: '2026-07-05',
    confidence: 'high',
    notes: 'Fixture source used by refresh pipeline tests.',
  };
}

function createFixtureRecord(sourceId: string): TournamentEconomicsRecord {
  const record = structuredClone(normalRecord);

  return {
    ...replaceRecordSourceIds(record, sourceId),
    id: 'fixture-open-2026-ms',
    tournament: 'Fixture Open',
    year: 2026,
  };
}

function replaceRecordSourceIds(
  record: TournamentEconomicsRecord,
  sourceId: string,
): TournamentEconomicsRecord {
  return {
    ...record,
    sourceIds: [sourceId],
    prizePool: { ...record.prizePool, sourceIds: [sourceId] },
    winnerPayout: { ...record.winnerPayout, sourceIds: [sourceId] },
    runnerUpPayout: { ...record.runnerUpPayout, sourceIds: [sourceId] },
    revenue: { ...record.revenue, sourceIds: [] },
    profitOrSurplus: { ...record.profitOrSurplus, sourceIds: [] },
    roundPayouts: record.roundPayouts.map((roundPayout) => ({
      ...roundPayout,
      payout: {
        ...roundPayout.payout,
        sourceIds: [sourceId],
      },
    })),
  };
}

function createJsonFetch(payload: unknown): typeof fetch {
  return async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
}

function createTestLogger(): RefreshLogger & { messages: string[] } {
  const messages: string[] = [];

  return {
    messages,
    info(message) {
      messages.push(message);
    },
    warn(message) {
      messages.push(message);
    },
    error(message) {
      messages.push(message);
    },
  };
}
