// Exact decimal text on scaled BigInt integers, shared inside money/: parsing onto a
// common scale, division rounded half up and the way back to text. Internal to
// money/; nothing outside it imports this file.

const DECIMAL = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/;

export interface Scaled {
  readonly units: bigint;
  /** Number of decimal digits `units` is scaled by. */
  readonly digits: number;
}

// No real amount is longer; the cap keeps a malformed string cheap to refuse.
const MAX_LENGTH = 30;

export function parse(text: string): Scaled {
  const match = text.length <= MAX_LENGTH ? DECIMAL.exec(text) : null;
  if (!match) throw new Error(`Not a decimal amount: "${text}"`);
  const [, sign, whole = '0', fraction = ''] = match;
  const units = BigInt(`${whole}${fraction}`);
  return { units: sign === '-' ? -units : units, digits: fraction.length };
}

// Parses several amounts onto one common scale.
export function parseAll(texts: readonly string[]): {
  units: bigint[];
  digits: number;
} {
  const parsed = texts.map(parse);
  const digits = parsed.reduce((most, p) => Math.max(most, p.digits), 0);
  return {
    units: parsed.map((p) => p.units * 10n ** BigInt(digits - p.digits)),
    digits,
  };
}

// Division rounded half up: a tie goes to the larger value, whatever the sign.
export function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  const n = denominator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const twice = 2n * n + d;
  const quotient = twice / (2n * d);
  return twice < 0n && twice % (2n * d) !== 0n ? quotient - 1n : quotient;
}

// Scaled integer back to text, trailing zeros of the fraction dropped.
export function unitsText(units: bigint, digits: number): string {
  const negative = units < 0n;
  const abs = (negative ? -units : units).toString().padStart(digits + 1, '0');
  const whole = abs.slice(0, abs.length - digits);
  const fraction = abs.slice(abs.length - digits).replace(/0+$/, '');
  const sign = negative && (whole !== '0' || fraction !== '') ? '-' : '';
  return `${sign}${whole}${fraction === '' ? '' : `.${fraction}`}`;
}
