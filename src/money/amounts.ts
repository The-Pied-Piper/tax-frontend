// Exact arithmetic on decimal text for the figures the hub chart notes show, that the
// API does not send (gate ruling, 23 Nov 2026: money/ is the one place that does
// arithmetic on money, and money/scale.ts stays positions only). Every function takes
// and gives exact decimal text, on scaled BigInt integers, with no float. The derived
// figures are:
//   - Canada Pension Plan and Employment Insurance together: total deductions less
//     income tax (subtractAmounts);
//   - the share kept: one less a rate (subtractAmounts);
//   - a rate times 10,000: what $10,000 more salary adds (timesTenThousand);
//   - take-home over salary, as a rate (ratioText);
//   - half of a value (halfOf);
//   - a whole-dollar figure, a half going up (roundToWhole).

import { divideHalfUp, parseAll, unitsText } from './decimal';

/** `a` minus `b`, exact, as text with trailing zeros of the fraction dropped. */
export function subtractAmounts(a: string, b: string): string {
  const {
    units: [x = 0n, y = 0n],
    digits,
  } = parseAll([a, b]);
  return unitsText(x - y, digits);
}

/** The whole-dollar amount nearest `amount`, a half going up, as text: "11133.97" gives "11134". Never shown with cents. */
export function roundToWhole(amount: string): string {
  const {
    units: [x = 0n],
    digits,
  } = parseAll([amount]);
  const scale = 10n ** BigInt(digits);
  return unitsText(divideHalfUp(x, scale), 0);
}

/** Half of `amount`, exact. */
export function halfOf(amount: string): string {
  const {
    units: [x = 0n],
    digits,
  } = parseAll([amount]);
  return unitsText(x * 5n, digits + 1);
}

/** `amount` times 10,000, exact: a rate of "0.5353" gives "5353". */
export function timesTenThousand(amount: string): string {
  const {
    units: [x = 0n],
    digits,
  } = parseAll([amount]);
  return unitsText(x * 10000n, digits);
}

/** `numerator` over `denominator` as a fraction written to four decimals, half up: 273077.60 over 500000 gives "0.5462". The denominator must be above zero. */
export function ratioText(numerator: string, denominator: string): string {
  const {
    units: [x = 0n, y = 0n],
  } = parseAll([numerator, denominator]);
  if (y <= 0n) throw new Error('The denominator must be above zero');
  return unitsText(divideHalfUp(x * 10000n, y), 4);
}
