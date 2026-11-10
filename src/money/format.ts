// Display formatting for money text. Pure string work: the amount is never
// turned into a number, so no digit can be lost to float rounding.

const AMOUNT = /^(-?)(\d+)(\.\d+)?$/;

// "53468.68" -> "53,468.68". Text that is not a plain decimal is returned as is.
export function groupThousands(amount: string): string {
  const match = AMOUNT.exec(amount);
  if (!match) return amount;
  const [, sign = '', whole = '', fraction = ''] = match;
  return `${sign}${whole.replace(/\B(?=(\d{3})+$)/g, ',')}${fraction}`;
}
