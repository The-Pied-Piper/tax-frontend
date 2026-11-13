import { toCents } from './payPeriod';

/**
 * True when the amount is above zero, judged exactly on whole cents. Throws
 * the same error as `toCents` for text that is not a money amount.
 */
export function isPositive(amount: string): boolean {
  return toCents(amount) > 0n;
}

/**
 * True when the amount is zero ("0", "0.00" and "-0.00" all are), judged
 * exactly on whole cents. Throws the same error as `toCents` for text that is
 * not a money amount.
 */
export function isZero(amount: string): boolean {
  return toCents(amount) === 0n;
}
