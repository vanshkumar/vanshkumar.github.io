import {
  isTournamentProfitOrSurplusKind,
  isTournamentRevenueKind,
  type CurrencyCode,
  type FinancialMetricKind,
  type FinancialValue,
  type MoneyValue,
  type PayoutAllocation,
  type RoundPayout,
  type TournamentEconomicsRecord,
} from '../data/dashboardDataset';

export type MetricUnavailableReason =
  | 'missing_data'
  | 'zero_denominator'
  | 'negative_denominator'
  | 'incompatible_currency'
  | 'incompatible_financial_kind'
  | 'no_prior_record';

export type NumericMetricResult =
  | {
      status: 'available';
      value: number;
      reason: null;
    }
  | {
      status: 'unavailable';
      value: null;
      reason: MetricUnavailableReason;
    };

export type MoneyMetricResult =
  | {
      status: 'available';
      value: MoneyValue;
      reason: null;
    }
  | {
      status: 'unavailable';
      value: null;
      reason: 'missing_data';
    };

export interface RoundPayoutPercentage {
  round: string;
  allocation: PayoutAllocation;
  payout: MoneyValue;
  percentage: NumericMetricResult;
}

type MoneyValueWithAmount = MoneyValue & {
  amount: number;
  currency: CurrencyCode;
};

type FinancialValueWithAmount = FinancialValue & {
  amount: number;
  currency: CurrencyCode;
};

export function getTotalPrizePool(record: TournamentEconomicsRecord): MoneyMetricResult {
  return getAvailableMoney(record.prizePool);
}

export function getWinnerPayout(record: TournamentEconomicsRecord): MoneyMetricResult {
  return getAvailableMoney(record.winnerPayout);
}

export function getRunnerUpPayout(record: TournamentEconomicsRecord): MoneyMetricResult {
  return getAvailableMoney(record.runnerUpPayout);
}

export function calculateWinnerRunnerUpRatio(
  record: TournamentEconomicsRecord,
): NumericMetricResult {
  const winner = getAvailableMoneyValue(record.winnerPayout);
  const runnerUp = getAvailableMoneyValue(record.runnerUpPayout);

  if (!winner || !runnerUp) {
    return unavailable('missing_data');
  }

  if (!hasCompatibleCurrency(winner, runnerUp)) {
    return unavailable('incompatible_currency');
  }

  return divideByPositiveDenominator(winner.amount, runnerUp.amount);
}

export function calculatePrizePoolToRevenue(
  record: TournamentEconomicsRecord,
): NumericMetricResult {
  return calculateMoneyOverFinancialValue(
    record.prizePool,
    record.revenue,
    isTournamentRevenueKind,
  );
}

export function calculatePrizePoolToProfitOrSurplus(
  record: TournamentEconomicsRecord,
): NumericMetricResult {
  return calculateMoneyOverFinancialValue(
    record.prizePool,
    record.profitOrSurplus,
    isTournamentProfitOrSurplusKind,
  );
}

export function calculateYearOverYearPrizePoolGrowth(
  records: TournamentEconomicsRecord[],
  currentRecord: TournamentEconomicsRecord,
): NumericMetricResult {
  const priorRecord = records.find(
    (record) =>
      record.tournament === currentRecord.tournament &&
      record.event === currentRecord.event &&
      record.year === currentRecord.year - 1,
  );

  if (!priorRecord) {
    return unavailable('no_prior_record');
  }

  const currentPrizePool = getAvailableMoneyValue(currentRecord.prizePool);
  const priorPrizePool = getAvailableMoneyValue(priorRecord.prizePool);

  if (!currentPrizePool || !priorPrizePool) {
    return unavailable('missing_data');
  }

  if (!hasCompatibleCurrency(currentPrizePool, priorPrizePool)) {
    return unavailable('incompatible_currency');
  }

  const denominatorCheck = validatePositiveDenominator(priorPrizePool.amount);
  if (denominatorCheck) {
    return unavailable(denominatorCheck);
  }

  return available((currentPrizePool.amount - priorPrizePool.amount) / priorPrizePool.amount);
}

export function calculateRoundPayoutPercentages(
  record: TournamentEconomicsRecord,
): RoundPayoutPercentage[] {
  return record.roundPayouts.map((roundPayout) => ({
    round: roundPayout.round,
    allocation: roundPayout.payout.allocation,
    payout: roundPayout.payout,
    percentage: calculateRoundPayoutPercentage(record.prizePool, roundPayout),
  }));
}

function calculateMoneyOverFinancialValue(
  numerator: MoneyValue,
  denominator: FinancialValue,
  isCompatibleKind: (kind: FinancialMetricKind) => boolean,
): NumericMetricResult {
  const numeratorValue = getAvailableMoneyValue(numerator);
  const denominatorValue = getAvailableFinancialValue(denominator);

  if (!numeratorValue || !denominatorValue) {
    return unavailable('missing_data');
  }

  if (!hasCompatibleCurrency(numeratorValue, denominatorValue)) {
    return unavailable('incompatible_currency');
  }

  if (!isCompatibleKind(denominator.kind)) {
    return unavailable('incompatible_financial_kind');
  }

  return divideByPositiveDenominator(numeratorValue.amount, denominatorValue.amount);
}

function calculateRoundPayoutPercentage(
  prizePool: MoneyValue,
  roundPayout: RoundPayout,
): NumericMetricResult {
  const prizePoolValue = getAvailableMoneyValue(prizePool);
  const payoutValue = getAvailableMoneyValue(roundPayout.payout);

  if (!prizePoolValue || !payoutValue) {
    return unavailable('missing_data');
  }

  if (!hasCompatibleCurrency(payoutValue, prizePoolValue)) {
    return unavailable('incompatible_currency');
  }

  return divideByPositiveDenominator(payoutValue.amount, prizePoolValue.amount);
}

function getAvailableMoney(value: MoneyValue): MoneyMetricResult {
  if (!getAvailableMoneyValue(value)) {
    return {
      status: 'unavailable',
      value: null,
      reason: 'missing_data',
    };
  }

  return {
    status: 'available',
    value,
    reason: null,
  };
}

function getAvailableMoneyValue(value: MoneyValue): MoneyValueWithAmount | null {
  if (value.amount === null || value.currency === null || value.status === 'unavailable') {
    return null;
  }

  return value as MoneyValueWithAmount;
}

function getAvailableFinancialValue(value: FinancialValue): FinancialValueWithAmount | null {
  const moneyValue = getAvailableMoneyValue(value);

  if (!moneyValue) {
    return null;
  }

  return value as FinancialValueWithAmount;
}

function hasCompatibleCurrency(
  first: MoneyValueWithAmount,
  second: MoneyValueWithAmount,
): boolean {
  return first.currency === second.currency;
}

function divideByPositiveDenominator(
  numerator: number,
  denominator: number,
): NumericMetricResult {
  const denominatorIssue = validatePositiveDenominator(denominator);

  if (denominatorIssue) {
    return unavailable(denominatorIssue);
  }

  return available(numerator / denominator);
}

function validatePositiveDenominator(denominator: number): MetricUnavailableReason | null {
  if (denominator === 0) {
    return 'zero_denominator';
  }

  if (denominator < 0) {
    return 'negative_denominator';
  }

  return null;
}

function available(value: number): NumericMetricResult {
  return {
    status: 'available',
    value,
    reason: null,
  };
}

function unavailable(reason: MetricUnavailableReason): NumericMetricResult {
  return {
    status: 'unavailable',
    value: null,
    reason,
  };
}
