export interface SeedDatasetExpectation {
  id: string;
  tournament: string;
  currency: string;
  confidence: 'high' | 'medium';
  prizePool: number;
  winner: number;
  runnerUp: number;
  sourceCount: number;
}

export const seedDatasetExpectations: SeedDatasetExpectation[] = [
  {
    id: 'australian-open-2025-ms',
    tournament: 'Australian Open',
    currency: 'AUD',
    confidence: 'high',
    prizePool: 33108000,
    winner: 3500000,
    runnerUp: 1900000,
    sourceCount: 2,
  },
  {
    id: 'roland-garros-2025-ms',
    tournament: 'Roland Garros',
    currency: 'EUR',
    confidence: 'medium',
    prizePool: 20509000,
    winner: 2550000,
    runnerUp: 1275000,
    sourceCount: 1,
  },
  {
    id: 'wimbledon-2025-ms',
    tournament: 'Wimbledon',
    currency: 'GBP',
    confidence: 'high',
    prizePool: 19414000,
    winner: 3000000,
    runnerUp: 1520000,
    sourceCount: 1,
  },
  {
    id: 'us-open-2025-ms',
    tournament: 'US Open',
    currency: 'USD',
    confidence: 'medium',
    prizePool: 31620000,
    winner: 5000000,
    runnerUp: 2500000,
    sourceCount: 2,
  },
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
