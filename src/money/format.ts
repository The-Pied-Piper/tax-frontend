import { amountForPeriod, type PayPeriod } from './payPeriod';

// Display formatting for money text. Pure string work: the amount is never
// turned into a number, so no digit can be lost to float rounding.

const AMOUNT = /^(-?)(0|[1-9]\d*)(\.\d+)?$/;

// "53468.68" -> "53,468.68". Text that is not a plain decimal is returned as is.
export function groupThousands(amount: string): string {
  const match = AMOUNT.exec(amount);
  if (!match) return amount;
  const [, sign = '', whole = '', fraction = ''] = match;
  return `${sign}${whole.replace(/\B(?=(\d{3})+$)/g, ',')}${fraction}`;
}

// The figure shown for one pay period. An amount the division cannot read is
// shown as the API sent it, so one odd value never blanks the page.
export function displayAmount(yearly: string, period: PayPeriod): string {
  try {
    return groupThousands(amountForPeriod(yearly, period));
  } catch {
    return yearly;
  }
}
