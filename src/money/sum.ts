import { formatCents, toCents } from './payPeriod';

/** Adds decimal amounts exactly, on whole cents, and returns text with two decimals. */
export function sumAmounts(amounts: readonly string[]): string {
  return formatCents(amounts.reduce((total, a) => total + toCents(a), 0n));
}
