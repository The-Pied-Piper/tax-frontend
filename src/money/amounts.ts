// Exact arithmetic on decimal text for the figures the hub chart notes show, that the
// API does not send (gate ruling, 23 Nov 2026: money/ is the one place that does
// arithmetic on money, and money/scale.ts stays positions only). Every function takes
// and gives exact decimal text, on scaled BigInt integers, with no float. The derived
// figures are:
//   - Canada Pension Plan and Employment Insurance together: total deductions less
//     income tax (subtractAmounts);
//   - the share kept: one less a rate (subtractAmounts);
//   - take-home over salary, as a rate (ratioText);
//   - a rate to the nearest half point (roundToHalfPoint);
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

/** A rate written as a fraction, rounded to the nearest half point, a half going up: "0.0758" gives "0.075", "0.5483" gives "0.55". */
export function roundToHalfPoint(rate: string): string {
  const {
    units: [x = 0n],
    digits,
  } = parseAll([rate]);
  const scale = 10n ** BigInt(digits);
  // A half point is 0.005, so the rate is a whole number of two-hundredths.
  return unitsText(divideHalfUp(x * 200n, scale) * 5n, 3);
}

/** `numerator` over `denominator` as a fraction written to four decimals, half up: 273077.60 over 500000 gives "0.5462". The denominator must be above zero. */
export function ratioText(numerator: string, denominator: string): string {
  const {
    units: [x = 0n, y = 0n],
  } = parseAll([numerator, denominator]);
  if (y <= 0n) throw new Error('The denominator must be above zero');
  return unitsText(divideHalfUp(x * 10000n, y), 4);
}
