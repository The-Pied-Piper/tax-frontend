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

// "53,468.68" -> "$53,468.68"; a minus sign stays in front of the symbol.
export function withSymbol(amount: string, symbol: string): string {
  return amount.startsWith('-')
    ? `-${symbol}${amount.slice(1)}`
    : `${symbol}${amount}`;
}

// Amount for one pay period with the currency symbol, ready to show. An amount
// the division cannot read is shown as sent, with no symbol in front of it.
export function displayMoney(
  yearly: string,
  period: PayPeriod,
  symbol: string,
): string {
  try {
    return withSymbol(groupThousands(amountForPeriod(yearly, period)), symbol);
  } catch {
    return yearly;
  }
}
