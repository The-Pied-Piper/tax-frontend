// The only money arithmetic in the browser: one exact division of a yearly
// amount into pay periods. Amounts are decimal strings from the API and are
// never turned into floats; all work is done on whole cents with BigInt.

export type PayPeriod = 'weekly' | 'biweekly' | 'monthly' | 'annually';

export const PERIODS_PER_YEAR: Record<PayPeriod, bigint> = {
  weekly: 52n,
  biweekly: 26n,
  monthly: 12n,
  annually: 1n,
};

const AMOUNT = /^(-?)(0|[1-9]\d*)(?:\.(\d{1,2}))?$/;

function toCents(amount: string): bigint {
  const match = AMOUNT.exec(amount);
  if (!match) {
    throw new Error(`Not a money amount: "${amount}"`);
  }
  const [, sign, whole = '0', fraction = ''] = match;
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return sign === '-' ? -cents : cents;
}

function formatCents(cents: bigint): string {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = abs / 100n;
  const fraction = (abs % 100n).toString().padStart(2, '0');
  return `${negative && abs !== 0n ? '-' : ''}${whole.toString()}.${fraction}`;
}

// Divides a yearly amount by the number of pay periods, rounding half up
// (half away from zero for negatives), and returns text with two decimals.
export function amountForPeriod(yearly: string, period: PayPeriod): string {
  const cents = toCents(yearly);
  const divisor = PERIODS_PER_YEAR[period];
  if (!Object.hasOwn(PERIODS_PER_YEAR, period)) {
    throw new Error(`Unknown pay period: "${period}"`);
  }
  const abs = cents < 0n ? -cents : cents;
  const rounded = (abs * 2n + divisor) / (divisor * 2n);
  return formatCents(cents < 0n ? -rounded : rounded);
}
