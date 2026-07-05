import recordsJson from './normalized/mockTournamentEconomics.json';
import sourcesJson from './raw/source-metadata/mockSources.json';
import metadataJson from './static/mockDatasetMetadata.json';
import { parseDashboardDataset } from './schemas';

export { isTournamentProfitOrSurplusKind, isTournamentRevenueKind } from './schemas';
export type {
  Confidence,
  CurrencyCode,
  DashboardDataset,
  DatasetMetadata,
  FinancialMetricKind,
  FinancialValue,
  MoneyValue,
  PayoutAllocation,
  PayoutValue,
  RoundPayout,
  Source,
  SourceType,
  TournamentEconomicsRecord,
  ValueStatus,
} from './schemas';

export const dashboardDataset = parseDashboardDataset({
  metadata: metadataJson,
  sources: sourcesJson,
  records: recordsJson,
});
