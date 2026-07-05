import recordsJson from './normalized/grandSlam2025MensSingles.json';
import sourcesJson from './raw/source-metadata/grandSlam2025Sources.json';
import metadataJson from './static/seedDatasetMetadata.json';
import { parseDashboardDataset } from './schemas';

export { isTournamentProfitOrSurplusKind, isTournamentRevenueKind } from './schemas';
export type {
  Confidence,
  CurrencyCode,
  DashboardDataset,
  DataMode,
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
