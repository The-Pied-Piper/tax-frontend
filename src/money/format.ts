import { amountForPeriod, type PayPeriod } from './payPeriod';

// Display formatting for money text. Pure string work: the amount is never
// turned into a number, so no digit can be lost to float rounding.

// The part of the API's unit that display needs (money/ does not import api/).
export interface MoneyUnit {
  placement: 'before' | 'after';
  singular: string;
  plural: string;
}

const AMOUNT = /^(-?)(0|[1-9]\d*)(\.\d+)?$/;

// "53468.68" -> "53,468.68". Text that is not a plain decimal is returned as is.
export function groupThousands(amount: string): string {
  const match = AMOUNT.exec(amount);
  if (!match) return amount;
  const [, sign = '', whole = '', fraction = ''] = match;
  return `${sign}${whole.replace(/\B(?=(\d{3})+$)/g, ',')}${fraction}`;
}

const ONE = /^1(\.0+)?$/;

// "53,468.68" + CA$ -> "CA$53,468.68"; "12" + months -> "12 months". The minus
// sign stays first, the plural is used unless the amount is exactly 1, and only
// a unit after the number gets a space. Text that is not a plain decimal is
// returned as is, with no unit.
export function withUnit(amount: string, unit: MoneyUnit): string {
  const digits = amount.replace(/,/g, '');
  if (!AMOUNT.test(digits)) return amount;
  const negative = digits.startsWith('-');
  const body = negative ? amount.slice(1) : amount;
  const text = ONE.test(digits) ? unit.singular : unit.plural;
  const sign = negative ? '-' : '';
  return unit.placement === 'before'
    ? `${sign}${text}${body}`
    : `${sign}${body} ${text}`;
}

// Amount for one pay period as a bare grouped number (a row with no unit). An
// amount the division cannot read is shown as sent.
export function displayBare(yearly: string, period: PayPeriod): string {
  try {
    return groupThousands(amountForPeriod(yearly, period));
  } catch {
    return yearly;
  }
}

// Amount for one pay period with its unit, ready to show. An amount the
// division cannot read is shown as sent, with no unit.
export function displayMoney(
  yearly: string,
  period: PayPeriod,
  unit: MoneyUnit,
): string {
  try {
    return withUnit(groupThousands(amountForPeriod(yearly, period)), unit);
  } catch {
    return yearly;
  }
}
