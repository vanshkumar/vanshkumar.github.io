export const confidenceLevels = ['high', 'medium', 'low', 'mock'] as const;
export const dataModes = ['mock', 'mixed', 'real'] as const;
export const sourceTypes = [
  'official_report',
  'annual_report',
  'form_990',
  'official_prize_money_page',
  'press_release',
  'reputable_secondary',
  'manual_verified',
  'mock',
] as const;
export const valueStatuses = [
  'official',
  'reported',
  'estimated',
  'derived',
  'mock',
  'unavailable',
] as const;
export const financialMetricKinds = [
  'tournament_revenue',
  'event_revenue',
  'organization_revenue',
  'tour_revenue',
  'tournament_profit',
  'tournament_surplus',
  'organization_profit',
  'organization_surplus',
  'expenses',
  'unknown',
] as const;
export const payoutAllocations = [
  'per_player',
  'per_team',
  'total_allocation',
] as const;

export type Confidence = (typeof confidenceLevels)[number];
export type DataMode = (typeof dataModes)[number];
export type SourceType = (typeof sourceTypes)[number];
export type ValueStatus = (typeof valueStatuses)[number];
export type FinancialMetricKind = (typeof financialMetricKinds)[number];
export type PayoutAllocation = (typeof payoutAllocations)[number];
export type CurrencyCode = string;

export interface DatasetMetadata {
  schemaVersion: 1;
  datasetId: string;
  datasetLabel: string;
  datasetNotice: string;
  dataMode: DataMode;
  lastRefreshedAt: string;
}

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
  sourceType: SourceType;
  accessedAt: string;
  confidence: Confidence;
  notes: string;
}

export interface MoneyValue {
  amount: number | null;
  currency: CurrencyCode | null;
  status: ValueStatus;
  sourceIds: string[];
  notes?: string;
}

export interface FinancialValue extends MoneyValue {
  kind: FinancialMetricKind;
}

export interface PayoutValue extends MoneyValue {
  allocation: PayoutAllocation;
}

export interface RoundPayout {
  round: string;
  payout: PayoutValue;
}

export interface TournamentEconomicsRecord {
  id: string;
  tournament: string;
  year: number;
  event: string;
  confidence: Confidence;
  displayCurrency: CurrencyCode;
  sourceIds: string[];
  prizePool: MoneyValue;
  revenue: FinancialValue;
  profitOrSurplus: FinancialValue;
  winnerPayout: PayoutValue;
  runnerUpPayout: PayoutValue;
  roundPayouts: RoundPayout[];
  caveats: string[];
}

export interface DashboardDataset {
  metadata: DatasetMetadata;
  sources: Source[];
  records: TournamentEconomicsRecord[];
}

export class DataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataValidationError';
  }
}

export function parseDatasetMetadata(value: unknown): DatasetMetadata {
  const object = expectObject(value, 'metadata');

  return {
    schemaVersion: expectLiteral(object.schemaVersion, 1, 'metadata.schemaVersion'),
    datasetId: expectString(object.datasetId, 'metadata.datasetId'),
    datasetLabel: expectString(object.datasetLabel, 'metadata.datasetLabel'),
    datasetNotice: expectString(object.datasetNotice, 'metadata.datasetNotice'),
    dataMode: expectEnum(object.dataMode, dataModes, 'metadata.dataMode'),
    lastRefreshedAt: expectDateTime(object.lastRefreshedAt, 'metadata.lastRefreshedAt'),
  };
}

export function parseSources(value: unknown): Source[] {
  const sources = expectArray(value, 'sources', (item, index) => {
    const object = expectObject(item, `sources[${index}]`);

    const source = {
      id: expectString(object.id, `sources[${index}].id`),
      title: expectString(object.title, `sources[${index}].title`),
      publisher: expectString(object.publisher, `sources[${index}].publisher`),
      url: expectUrl(object.url, `sources[${index}].url`),
      sourceType: expectEnum(object.sourceType, sourceTypes, `sources[${index}].sourceType`),
      accessedAt: expectDate(object.accessedAt, `sources[${index}].accessedAt`),
      confidence: expectEnum(object.confidence, confidenceLevels, `sources[${index}].confidence`),
      notes: expectString(object.notes, `sources[${index}].notes`),
    };

    if ((source.sourceType === 'mock') !== (source.confidence === 'mock')) {
      throw new DataValidationError(
        `sources[${index}] mock source type and confidence must be paired`,
      );
    }

    return source;
  });

  ensureUniqueIds(
    sources.map((source) => source.id),
    'sources',
  );

  return sources;
}

export function parseTournamentRecords(value: unknown): TournamentEconomicsRecord[] {
  const records = expectArray(value, 'records', parseTournamentRecord);

  ensureUniqueIds(
    records.map((record) => record.id),
    'records',
  );

  return records;
}

export function parseDashboardDataset(value: {
  metadata: unknown;
  sources: unknown;
  records: unknown;
}): DashboardDataset {
  const metadata = parseDatasetMetadata(value.metadata);
  const sources = parseSources(value.sources);
  const records = parseTournamentRecords(value.records);
  const sourceIds = new Set(sources.map((source) => source.id));

  for (const record of records) {
    assertKnownSourceIds(record.sourceIds, sourceIds, `records.${record.id}.sourceIds`);
    assertKnownSourceIds(record.prizePool.sourceIds, sourceIds, `records.${record.id}.prizePool.sourceIds`);
    assertKnownSourceIds(record.revenue.sourceIds, sourceIds, `records.${record.id}.revenue.sourceIds`);
    assertKnownSourceIds(
      record.profitOrSurplus.sourceIds,
      sourceIds,
      `records.${record.id}.profitOrSurplus.sourceIds`,
    );
    assertKnownSourceIds(
      record.winnerPayout.sourceIds,
      sourceIds,
      `records.${record.id}.winnerPayout.sourceIds`,
    );
    assertKnownSourceIds(
      record.runnerUpPayout.sourceIds,
      sourceIds,
      `records.${record.id}.runnerUpPayout.sourceIds`,
    );

    for (const payout of record.roundPayouts) {
      assertKnownSourceIds(
        payout.payout.sourceIds,
        sourceIds,
        `records.${record.id}.roundPayouts.${payout.round}.sourceIds`,
      );
    }
  }

  assertDataModeIntegrity(metadata, sources, records);

  return { metadata, sources, records };
}

export function isTournamentRevenueKind(kind: FinancialMetricKind): boolean {
  return kind === 'tournament_revenue' || kind === 'event_revenue';
}

export function isTournamentProfitOrSurplusKind(kind: FinancialMetricKind): boolean {
  return kind === 'tournament_profit' || kind === 'tournament_surplus';
}

function parseTournamentRecord(value: unknown, index: number): TournamentEconomicsRecord {
  const path = `records[${index}]`;
  const object = expectObject(value, path);

  return {
    id: expectString(object.id, `${path}.id`),
    tournament: expectString(object.tournament, `${path}.tournament`),
    year: expectIntegerInRange(object.year, 1877, 2100, `${path}.year`),
    event: expectString(object.event, `${path}.event`),
    confidence: expectEnum(object.confidence, confidenceLevels, `${path}.confidence`),
    displayCurrency: expectCurrencyCode(object.displayCurrency, `${path}.displayCurrency`),
    sourceIds: expectStringArray(object.sourceIds, `${path}.sourceIds`),
    prizePool: parseMoneyValue(object.prizePool, `${path}.prizePool`, false),
    revenue: parseFinancialValue(object.revenue, `${path}.revenue`),
    profitOrSurplus: parseFinancialValue(object.profitOrSurplus, `${path}.profitOrSurplus`),
    winnerPayout: parsePayoutValue(object.winnerPayout, `${path}.winnerPayout`),
    runnerUpPayout: parsePayoutValue(object.runnerUpPayout, `${path}.runnerUpPayout`),
    roundPayouts: expectArray(object.roundPayouts, `${path}.roundPayouts`, parseRoundPayout),
    caveats: expectStringArray(object.caveats, `${path}.caveats`),
  };
}

function parseFinancialValue(value: unknown, path: string): FinancialValue {
  const object = expectObject(value, path);
  const kind = expectEnum(object.kind, financialMetricKinds, `${path}.kind`);
  const allowNegative = isTournamentProfitOrSurplusKind(kind) || kind === 'organization_profit' || kind === 'organization_surplus';
  const money = parseMoneyValue(value, path, allowNegative);

  return {
    ...money,
    kind,
  };
}

function parsePayoutValue(value: unknown, path: string): PayoutValue {
  const object = expectObject(value, path);
  const money = parseMoneyValue(value, path, false);

  return {
    ...money,
    allocation: expectEnum(object.allocation, payoutAllocations, `${path}.allocation`),
  };
}

function parseRoundPayout(value: unknown, index: number): RoundPayout {
  const path = `roundPayouts[${index}]`;
  const object = expectObject(value, path);

  return {
    round: expectString(object.round, `${path}.round`),
    payout: parsePayoutValue(object.payout, `${path}.payout`),
  };
}

function parseMoneyValue(value: unknown, path: string, allowNegative: boolean): MoneyValue {
  const object = expectObject(value, path);
  const status = expectEnum(object.status, valueStatuses, `${path}.status`);
  const amount = expectNumberOrNull(object.amount, `${path}.amount`, allowNegative);
  const currency = expectCurrencyCodeOrNull(object.currency, `${path}.currency`);
  const sourceIds = expectStringArray(object.sourceIds, `${path}.sourceIds`);
  const notes = expectOptionalString(object.notes, `${path}.notes`);

  if (status === 'unavailable') {
    if (amount !== null) {
      throw new DataValidationError(`${path}.amount must be null when status is unavailable`);
    }

    if (currency !== null) {
      throw new DataValidationError(`${path}.currency must be null when status is unavailable`);
    }
  } else {
    if (amount === null) {
      throw new DataValidationError(`${path}.amount is required unless status is unavailable`);
    }

    if (currency === null) {
      throw new DataValidationError(`${path}.currency is required unless status is unavailable`);
    }

    if (sourceIds.length === 0) {
      throw new DataValidationError(`${path}.sourceIds must include at least one source id`);
    }
  }

  return {
    amount,
    currency,
    status,
    sourceIds,
    ...(notes === undefined ? {} : { notes }),
  };
}

function assertDataModeIntegrity(
  metadata: DatasetMetadata,
  sources: Source[],
  records: TournamentEconomicsRecord[],
) {
  if (metadata.dataMode === 'real') {
    assertRealDatasetIntegrity(sources, records);
    return;
  }

  if (metadata.dataMode !== 'mock') {
    return;
  }

  const labelText = `${metadata.datasetLabel} ${metadata.datasetNotice}`.toUpperCase();
  if (!labelText.includes('MOCK') && !labelText.includes('SAMPLE')) {
    throw new DataValidationError('Mock datasets must visibly label the dataset as mock/sample');
  }

  for (const source of sources) {
    if (source.sourceType !== 'mock' || source.confidence !== 'mock') {
      throw new DataValidationError('Mock datasets may only contain mock sources');
    }
  }

  for (const record of records) {
    if (record.confidence !== 'mock') {
      throw new DataValidationError(`Mock record ${record.id} must have mock confidence`);
    }

    const statuses = [
      record.prizePool.status,
      record.revenue.status,
      record.profitOrSurplus.status,
      record.winnerPayout.status,
      record.runnerUpPayout.status,
      ...record.roundPayouts.map((payout) => payout.payout.status),
    ];

    if (statuses.some((status) => status !== 'mock' && status !== 'unavailable')) {
      throw new DataValidationError(`Mock record ${record.id} contains a non-mock value status`);
    }
  }
}

function assertRealDatasetIntegrity(sources: Source[], records: TournamentEconomicsRecord[]) {
  for (const source of sources) {
    if (source.sourceType === 'mock' || source.confidence === 'mock') {
      throw new DataValidationError('Real datasets cannot contain mock sources');
    }
  }

  for (const record of records) {
    if (record.confidence === 'mock') {
      throw new DataValidationError(`Real record ${record.id} cannot have mock confidence`);
    }

    const statuses = [
      record.prizePool.status,
      record.revenue.status,
      record.profitOrSurplus.status,
      record.winnerPayout.status,
      record.runnerUpPayout.status,
      ...record.roundPayouts.map((payout) => payout.payout.status),
    ];

    if (statuses.includes('mock')) {
      throw new DataValidationError(`Real record ${record.id} cannot contain mock value status`);
    }
  }
}

function assertKnownSourceIds(ids: string[], sourceIds: Set<string>, path: string) {
  for (const id of ids) {
    if (!sourceIds.has(id)) {
      throw new DataValidationError(`${path} references unknown source id "${id}"`);
    }
  }
}

function ensureUniqueIds(ids: string[], path: string) {
  const seenIds = new Set<string>();

  for (const id of ids) {
    if (seenIds.has(id)) {
      throw new DataValidationError(`${path} contains duplicate id "${id}"`);
    }

    seenIds.add(id);
  }
}

function expectObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new DataValidationError(`${path} must be an object`);
  }

  return value as Record<string, unknown>;
}

function expectArray<T>(
  value: unknown,
  path: string,
  parseItem: (item: unknown, index: number) => T,
): T[] {
  if (!Array.isArray(value)) {
    throw new DataValidationError(`${path} must be an array`);
  }

  return value.map((item, index) => parseItem(item, index));
}

function expectEnum<T extends readonly string[]>(
  value: unknown,
  options: T,
  path: string,
): T[number] {
  if (typeof value !== 'string' || !(options as readonly string[]).includes(value)) {
    throw new DataValidationError(`${path} must be one of: ${options.join(', ')}`);
  }

  return value as T[number];
}

function expectLiteral<T extends string | number>(
  value: unknown,
  literal: T,
  path: string,
): T {
  if (value !== literal) {
    throw new DataValidationError(`${path} must be ${String(literal)}`);
  }

  return literal;
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new DataValidationError(`${path} must be a non-empty string`);
  }

  return value;
}

function expectOptionalString(value: unknown, path: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return expectString(value, path);
}

function expectStringArray(value: unknown, path: string): string[] {
  const strings = expectArray(value, path, (item, index) =>
    expectString(item, `${path}[${index}]`),
  );

  if (new Set(strings).size !== strings.length) {
    throw new DataValidationError(`${path} must not contain duplicate values`);
  }

  return strings;
}

function expectIntegerInRange(
  value: unknown,
  min: number,
  max: number,
  path: string,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new DataValidationError(`${path} must be an integer from ${min} through ${max}`);
  }

  return value;
}

function expectNumberOrNull(value: unknown, path: string, allowNegative: boolean): number | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new DataValidationError(`${path} must be a finite number or null`);
  }

  if (!allowNegative && value < 0) {
    throw new DataValidationError(`${path} must not be negative`);
  }

  return value;
}

function expectCurrencyCode(value: unknown, path: string): CurrencyCode {
  const currency = expectString(value, path);

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new DataValidationError(`${path} must be an ISO-style three-letter currency code`);
  }

  return currency;
}

function expectCurrencyCodeOrNull(value: unknown, path: string): CurrencyCode | null {
  if (value === null) {
    return null;
  }

  return expectCurrencyCode(value, path);
}

function expectDate(value: unknown, path: string): string {
  const date = expectString(value, path);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00.000Z`))) {
    throw new DataValidationError(`${path} must be a YYYY-MM-DD date`);
  }

  return date;
}

function expectDateTime(value: unknown, path: string): string {
  const dateTime = expectString(value, path);

  if (Number.isNaN(Date.parse(dateTime))) {
    throw new DataValidationError(`${path} must be an ISO datetime`);
  }

  return dateTime;
}

function expectUrl(value: unknown, path: string): string {
  const url = expectString(value, path);

  try {
    new URL(url);
  } catch {
    throw new DataValidationError(`${path} must be a valid URL`);
  }

  return url;
}
