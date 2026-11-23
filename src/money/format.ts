import { amountForPeriod, type PayPeriod } from './payPeriod';

// Display formatting for money text. Pure string work: the amount is never
// turned into a number, so no digit can be lost to float rounding.

// The part of the API's unit that display needs (money/ does not import api/).
export interface MoneyUnit {
  placement: 'before' | 'after';
  singular: string;
  plural: string;
  spaced: boolean;
  /** True when the amount is a fraction to show times 100 (0.2965 -> 29.65). */
  as_percentage?: boolean;
}

const AMOUNT = /^(-?)(0|[1-9]\d*)(\.\d+)?$/;

// "53468.68" -> "53,468.68". Text that is not a plain decimal is returned as is.
export function groupThousands(amount: string): string {
  const match = AMOUNT.exec(amount);
  if (!match) return amount;
  const [, sign = '', whole = '', fraction = ''] = match;
  return `${sign}${whole.replace(/\B(?=(\d{3})+$)/g, ',')}${fraction}`;
}

// "70000" -> "70000.00", "1471.5" -> "1471.50". An amount that already has two
// or more decimals, and text that is not a plain decimal, is returned as is:
// nothing is rounded.
export function withCents(amount: string): string {
  const match = AMOUNT.exec(amount);
  if (!match) return amount;
  const [, sign = '', whole = '', fraction = ''] = match;
  if (fraction.length >= 3) return amount;
  return `${sign}${whole}.${fraction.slice(1).padEnd(2, '0')}`;
}

// True for the Canadian dollar unit: its amounts always show two decimals.
export function isDollarUnit(unit: MoneyUnit): boolean {
  return unit.singular === '$' && unit.plural === '$';
}

const ONE = /^1(\.0+)?$/;

// "53,468.68" + $ -> "$53,468.68"; "12" + months -> "12 months". The minus
// sign stays first, the plural is used unless the amount is exactly 1, and a
// space separates text and number only when the unit says `spaced`. Text that is not a plain decimal is
// returned as is, with no unit.
export function withUnit(amount: string, unit: MoneyUnit): string {
  const digits = amount.replace(/,/g, '');
  if (!AMOUNT.test(digits)) return amount;
  const negative = digits.startsWith('-');
  const body = negative ? amount.slice(1) : amount;
  const text = ONE.test(digits) ? unit.singular : unit.plural;
  const sign = negative ? '-' : '';
  const gap = unit.spaced ? ' ' : '';
  return unit.placement === 'before'
    ? `${sign}${text}${gap}${body}`
    : `${sign}${body}${gap}${text}`;
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

// Like displayMoney, but a whole-dollar amount has no cents: "$70,000", not
// "$70,000.00". For headings, titles, descriptions and links; an amount with
// cents keeps them. Still string work only.
export function displayWholeMoney(
  yearly: string,
  period: PayPeriod,
  unit: MoneyUnit,
): string {
  try {
    const grouped = groupThousands(amountForPeriod(yearly, period));
    return withUnit(grouped.replace(/\.00$/, ''), unit);
  } catch {
    return yearly;
  }
}

// Moves the decimal point two places right in the text, so no digit is lost
// and nothing is rounded: "0.2965" -> "29.65", "0.1" -> "10", "-0.2537" ->
// "-25.37" (a rate below zero, where a benefit is bigger than the tax). Text
// that is not a plain decimal is returned as is.
function timesHundred(amount: string): string | null {
  const match = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/.exec(amount);
  if (!match) return null;
  const [, minus = '', whole = '', fraction = ''] = match;
  const padded = fraction.padEnd(2, '0');
  const digits = `${whole}${padded.slice(0, 2)}`.replace(/^0+(?=\d)/, '');
  const rest = padded.slice(2).replace(/0+$/, '');
  const shifted = rest === '' ? digits : `${digits}.${rest}`;
  // A rate of exactly zero has no sign, whatever it was written with.
  return minus !== '' && /[1-9]/.test(shifted) ? `-${shifted}` : shifted;
}

// A rate with its unit, ready to show; the same for every pay period. A unit
// marked as_percentage means the API sent a fraction, shown times 100.
export function displayRate(amount: string, unit: MoneyUnit): string {
  if (unit.as_percentage !== true)
    return withUnit(groupThousands(amount), unit);
  const shifted = timesHundred(amount);
  return shifted === null ? amount : withUnit(shifted, unit);
}

// Short label for an axis tick, from a round value the chart chose. A rate
// shows as the unit says (a percent when as_percentage). Money is grouped, and
// a whole number of hundreds from 1,000 up is shortened with a k: "$50k",
// "$2.5k". The unit's own text goes on as in withUnit; only digits are moved,
// never rounded. Anything not a plain decimal is returned as is.
export function displayTick(value: string, unit: MoneyUnit): string {
  if (unit.as_percentage === true) return displayRate(value, unit);
  const match = /^(-?)(\d+)(?:\.0+)?$/.exec(value);
  const whole = match?.[2] ?? '';
  if (whole.length < 4 || !whole.endsWith('00') || match === null) {
    return withUnit(groupThousands(value), unit);
  }
  const hundreds = whole.slice(-3, -2);
  const body = `${match[1] ?? ''}${groupThousands(whole.slice(0, -3))}${hundreds === '0' ? '' : `.${hundreds}`}`;
  // A shortened figure is never exactly 1 of the unit, so it takes the plural.
  const text = withUnit(body, { ...unit, singular: unit.plural });
  return unit.placement === 'before'
    ? `${text}k`
    : text.replace(body, `${body}k`);
}
