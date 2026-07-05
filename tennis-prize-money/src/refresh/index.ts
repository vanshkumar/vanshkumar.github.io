import {
  DataValidationError,
  parseDashboardDataset,
  parseSources,
  parseTournamentRecords,
  type DashboardDataset,
  type Source,
  type TournamentEconomicsRecord,
} from '../data/schemas.js';

export const refreshOutputPaths = {
  metadata: 'src/data/static/seedDatasetMetadata.json',
  sources: 'src/data/raw/source-metadata/grandSlam2025Sources.json',
  records: 'src/data/normalized/grandSlam2025MensSingles.json',
} as const;

export interface RefreshLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface RefreshContext {
  fetch: typeof fetch;
  logger: RefreshLogger;
  now: () => Date;
}

export interface NormalizedAdapterOutput {
  sources: Source[];
  records: TournamentEconomicsRecord[];
}

export interface SourceAdapter<RawSourceData = unknown> {
  id: string;
  label: string;
  fetchRaw(context: RefreshContext): Promise<RawSourceData>;
  normalize(rawData: RawSourceData, context: RefreshContext): Promise<NormalizedAdapterOutput>;
}

export interface JsonHttpSourceAdapterOptions {
  id: string;
  label: string;
  url: string;
}

export interface StaticJsonOutput {
  path: string;
  data: unknown;
  content: string;
}

export interface StaticJsonWriteResult {
  path: string;
  changed: boolean;
}

export interface RefreshResult {
  dataset: DashboardDataset;
  adapterResults: Array<{
    id: string;
    label: string;
    sourceCount: number;
    recordCount: number;
  }>;
  writeResults: StaticJsonWriteResult[];
}

export interface RunDataRefreshOptions {
  existingData: {
    metadata: unknown;
    sources: unknown;
    records: unknown;
  };
  adapters?: SourceAdapter[];
  fetch?: typeof fetch;
  logger?: RefreshLogger;
  now?: () => Date;
  outputPaths?: typeof refreshOutputPaths;
  updateLastRefreshedAt?: boolean;
  writeJsonOutput: (output: StaticJsonOutput) => Promise<StaticJsonWriteResult | void>;
}

export class RefreshError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RefreshError';
  }
}

export function createJsonHttpSourceAdapter(
  options: JsonHttpSourceAdapterOptions,
): SourceAdapter<unknown> {
  return {
    id: options.id,
    label: options.label,
    async fetchRaw(context) {
      context.logger.info(`Fetching raw data for adapter "${options.id}".`);

      let response: Response;
      try {
        response = await context.fetch(options.url, {
          headers: { accept: 'application/json' },
        });
      } catch (error) {
        throw new RefreshError(
          `Adapter "${options.id}" could not fetch ${redactUrlForLog(options.url)}: ${safeErrorMessage(error)}`,
        );
      }

      if (!response.ok) {
        throw new RefreshError(
          `Adapter "${options.id}" source request failed with status ${response.status}.`,
        );
      }

      try {
        return await response.json();
      } catch (error) {
        throw new RefreshError(
          `Adapter "${options.id}" returned invalid JSON: ${safeErrorMessage(error)}`,
        );
      }
    },
    async normalize(rawData) {
      const payload = expectRefreshPayload(rawData, options.id);

      return {
        sources: parseSources(payload.sources),
        records: parseTournamentRecords(payload.records),
      };
    },
  };
}

export async function runDataRefresh(
  options: RunDataRefreshOptions,
): Promise<RefreshResult> {
  const logger = options.logger ?? silentLogger;
  const now = options.now ?? (() => new Date());
  const fetcher = options.fetch ?? globalThis.fetch?.bind(globalThis);
  const adapters = options.adapters ?? [];
  const paths = options.outputPaths ?? refreshOutputPaths;
  const updateLastRefreshedAt = options.updateLastRefreshedAt ?? true;

  if (typeof fetcher !== 'function') {
    throw new RefreshError('No fetch implementation is available for source adapters.');
  }

  logger.info('Starting tennis prize-money data refresh.');

  try {
    const currentDataset = parseDashboardDataset(options.existingData);
    let sources = currentDataset.sources;
    let records = currentDataset.records;
    const adapterResults: RefreshResult['adapterResults'] = [];
    const context: RefreshContext = {
      fetch: fetcher,
      logger,
      now,
    };

    if (adapters.length === 0) {
      logger.warn('No source adapters configured; validating and rewriting existing static JSON.');
    }

    for (const adapter of adapters) {
      const rawData = await adapter.fetchRaw(context);
      const normalized = await adapter.normalize(rawData, context);

      sources = mergeById(sources, normalized.sources);
      records = mergeById(records, normalized.records);

      adapterResults.push({
        id: adapter.id,
        label: adapter.label,
        sourceCount: normalized.sources.length,
        recordCount: normalized.records.length,
      });

      logger.info(
        `Adapter "${adapter.id}" normalized ${normalized.sources.length} source(s) and ${normalized.records.length} record(s).`,
      );
    }

    const refreshedDataset = parseDashboardDataset({
      metadata: {
        ...currentDataset.metadata,
        lastRefreshedAt: updateLastRefreshedAt
          ? getNextRefreshTimestamp(currentDataset.metadata.lastRefreshedAt, now())
          : currentDataset.metadata.lastRefreshedAt,
      },
      sources,
      records,
    });

    const writeResults = await writeStaticJsonOutputs(refreshedDataset, paths, options.writeJsonOutput);
    logger.info(`Refresh completed with ${writeResults.filter((result) => result.changed).length} changed file(s).`);

    return {
      dataset: refreshedDataset,
      adapterResults,
      writeResults,
    };
  } catch (error) {
    if (error instanceof DataValidationError || error instanceof RefreshError) {
      logger.error(safeErrorMessage(error));
      throw error;
    }

    const refreshError = new RefreshError(`Refresh failed: ${safeErrorMessage(error)}`);
    logger.error(refreshError.message);
    throw refreshError;
  }
}

export function formatStaticJson(data: unknown): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  return message
    .replace(/(authorization:\s*bearer\s+)[^\s,]+/gi, '$1[redacted]')
    .replace(/(bearer\s+)[A-Za-z0-9._-]+/gi, '$1[redacted]')
    .replace(/((token|password|passphrase|secret)=)[^&\s]+/gi, '$1[redacted]');
}

function expectRefreshPayload(rawData: unknown, adapterId: string): {
  sources: unknown;
  records: unknown;
} {
  if (typeof rawData !== 'object' || rawData === null || Array.isArray(rawData)) {
    throw new RefreshError(`Adapter "${adapterId}" payload must be an object.`);
  }

  const object = rawData as Record<string, unknown>;

  return {
    sources: object.sources,
    records: object.records,
  };
}

function mergeById<Item extends { id: string }>(existingItems: Item[], incomingItems: Item[]): Item[] {
  const merged = [...existingItems];
  const indexes = new Map(merged.map((item, index) => [item.id, index]));

  for (const item of incomingItems) {
    const existingIndex = indexes.get(item.id);

    if (existingIndex === undefined) {
      indexes.set(item.id, merged.length);
      merged.push(item);
    } else {
      merged[existingIndex] = item;
    }
  }

  return merged;
}

function getNextRefreshTimestamp(previousTimestamp: string, nextDate: Date): string {
  const previousTime = Date.parse(previousTimestamp);
  const nextTime = nextDate.getTime();

  if (!Number.isNaN(previousTime) && previousTime > nextTime) {
    return new Date(previousTime).toISOString();
  }

  return nextDate.toISOString();
}

async function writeStaticJsonOutputs(
  dataset: DashboardDataset,
  paths: typeof refreshOutputPaths,
  writeJsonOutput: RunDataRefreshOptions['writeJsonOutput'],
): Promise<StaticJsonWriteResult[]> {
  const outputs: StaticJsonOutput[] = [
    {
      path: paths.metadata,
      data: dataset.metadata,
      content: formatStaticJson(dataset.metadata),
    },
    {
      path: paths.sources,
      data: dataset.sources,
      content: formatStaticJson(dataset.sources),
    },
    {
      path: paths.records,
      data: dataset.records,
      content: formatStaticJson(dataset.records),
    },
  ];

  const results: StaticJsonWriteResult[] = [];

  for (const output of outputs) {
    const writeResult = await writeJsonOutput(output);
    results.push(writeResult ?? { path: output.path, changed: true });
  }

  return results;
}

function redactUrlForLog(url: string): string {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.username = '';
    parsedUrl.password = '';
    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString();
  } catch {
    return '[invalid url]';
  }
}

const silentLogger: RefreshLogger = {
  info() {},
  warn() {},
  error() {},
};
