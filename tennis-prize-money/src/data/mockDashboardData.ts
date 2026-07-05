import rawMockDashboardData from './mockPrizeEconomics.json';

export type Confidence = 'high' | 'medium' | 'low' | 'mock';
export type SourceType =
  | 'official_report'
  | 'annual_report'
  | 'form_990'
  | 'official_prize_money_page'
  | 'press_release'
  | 'reputable_secondary'
  | 'manual_verified'
  | 'mock';

export type MoneyStatus = 'mock' | 'unavailable';
export type FinancialKind =
  | 'tournament_revenue'
  | 'organizer_revenue'
  | 'tournament_profit'
  | 'organizer_surplus_profit'
  | 'expenses'
  | 'unknown';
export type PayoutAllocation = 'per_player' | 'per_team' | 'total_allocation';

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
  status: MoneyStatus;
}

export interface FinancialValue extends MoneyValue {
  kind: FinancialKind;
}

export interface PayoutValue extends MoneyValue {
  allocation: PayoutAllocation;
}

export interface RoundPayout {
  round: string;
  amount: number;
  allocation: PayoutAllocation;
}

export interface TournamentEconomicsRecord {
  id: string;
  tournament: string;
  year: number;
  event: string;
  confidence: Confidence;
  currency: string;
  sourceId: string;
  prizePool: MoneyValue;
  revenue: FinancialValue;
  profitOrSurplus: FinancialValue;
  winnerPayout: PayoutValue;
  runnerUpPayout: PayoutValue;
  roundPayouts: RoundPayout[];
  caveats: string[];
}

export interface MockDashboardData {
  datasetLabel: string;
  datasetNotice: string;
  lastRefreshedAt: string;
  sources: Source[];
  records: TournamentEconomicsRecord[];
}

export const mockDashboardData = rawMockDashboardData as MockDashboardData;
