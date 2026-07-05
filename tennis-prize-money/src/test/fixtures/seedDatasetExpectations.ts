export interface SeedDatasetExpectation {
  id: string;
  tournament: string;
  year: number;
  event: string;
  currency: string;
  confidence: 'high' | 'medium';
  prizePool: number;
  prizeMoneyScopeType: 'event_main_draw' | 'tournament_total';
  sourceCount: number;
  winner?: number;
  runnerUp?: number;
  revenue?: number;
  profitOrSurplus?: number;
}

export const fullTournamentExpectations: SeedDatasetExpectation[] = [
  {
    id: 'wimbledon-2025-tournament-total',
    tournament: 'Wimbledon',
    year: 2025,
    event: 'Full tournament',
    currency: 'GBP',
    confidence: 'high',
    prizePool: 53500000,
    prizeMoneyScopeType: 'tournament_total',
    sourceCount: 2,
    revenue: 423626000,
    profitOrSurplus: 52720000,
  },
  {
    id: 'wimbledon-2024-tournament-total',
    tournament: 'Wimbledon',
    year: 2024,
    event: 'Full tournament',
    currency: 'GBP',
    confidence: 'high',
    prizePool: 50000000,
    prizeMoneyScopeType: 'tournament_total',
    sourceCount: 2,
    revenue: 406507000,
    profitOrSurplus: 54332000,
  },
  {
    id: 'australian-open-2025-tournament-total',
    tournament: 'Australian Open',
    year: 2025,
    event: 'Full tournament',
    currency: 'AUD',
    confidence: 'high',
    prizePool: 96500000,
    prizeMoneyScopeType: 'tournament_total',
    sourceCount: 2,
  },
  {
    id: 'australian-open-2024-tournament-total',
    tournament: 'Australian Open',
    year: 2024,
    event: 'Full tournament',
    currency: 'AUD',
    confidence: 'high',
    prizePool: 86500000,
    prizeMoneyScopeType: 'tournament_total',
    sourceCount: 1,
  },
];

export const eventSeedExpectations: SeedDatasetExpectation[] = [
  {
    id: 'australian-open-2025-ms',
    tournament: 'Australian Open',
    year: 2025,
    event: "Men's singles",
    currency: 'AUD',
    confidence: 'high',
    prizePool: 33108000,
    prizeMoneyScopeType: 'event_main_draw',
    sourceCount: 2,
    winner: 3500000,
    runnerUp: 1900000,
  },
  {
    id: 'roland-garros-2025-ms',
    tournament: 'Roland Garros',
    year: 2025,
    event: "Men's singles",
    currency: 'EUR',
    confidence: 'medium',
    prizePool: 20509000,
    prizeMoneyScopeType: 'event_main_draw',
    sourceCount: 1,
    winner: 2550000,
    runnerUp: 1275000,
  },
  {
    id: 'wimbledon-2025-ms',
    tournament: 'Wimbledon',
    year: 2025,
    event: "Men's singles",
    currency: 'GBP',
    confidence: 'high',
    prizePool: 19414000,
    prizeMoneyScopeType: 'event_main_draw',
    sourceCount: 1,
    winner: 3000000,
    runnerUp: 1520000,
  },
  {
    id: 'us-open-2025-ms',
    tournament: 'US Open',
    year: 2025,
    event: "Men's singles",
    currency: 'USD',
    confidence: 'medium',
    prizePool: 31620000,
    prizeMoneyScopeType: 'event_main_draw',
    sourceCount: 2,
    winner: 5000000,
    runnerUp: 2500000,
  },
];

export const seedDatasetExpectations: SeedDatasetExpectation[] = [
  ...fullTournamentExpectations,
  ...eventSeedExpectations,
];

export const mainDrawRoundMultipliers: Record<string, number> = {
  R128: 64,
  R64: 32,
  R32: 16,
  R16: 8,
  QF: 4,
  SF: 2,
  F: 1,
  W: 1,
};
