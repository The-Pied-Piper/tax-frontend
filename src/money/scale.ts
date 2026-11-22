// Coordinate arithmetic for charts. A disclosed exception in money/ (gate
// ruling, 22 Nov 2026): exact decimal text goes in, a position or a round axis
// value comes out as text, never a figure that is shown as money. Every shown
// figure stays the API's own text, formatted by money/format. All work is on
// scaled BigInt integers; there is no float in the money path.
//
// A position is a coordinate in the chart's own units (SVG user units), kept
// to one decimal and written as text: "123.4".

const DECIMAL = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/;

interface Scaled {
  readonly units: bigint;
  /** Number of decimal digits `units` is scaled by. */
  readonly digits: number;
}

function parse(text: string): Scaled {
  const match = DECIMAL.exec(text);
  if (!match) throw new Error(`Not a decimal amount: "${text}"`);
  const [, sign, whole = '0', fraction = ''] = match;
  const units = BigInt(`${whole}${fraction}`);
  return { units: sign === '-' ? -units : units, digits: fraction.length };
}

// Parses several amounts onto one common scale.
function parseAll(texts: readonly string[]): {
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

// Division rounded half away from zero.
function divideHalfUp(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const rounded = (n * 2n + d) / (d * 2n);
  return negative ? -rounded : rounded;
}

// Scaled integer back to text, trailing zeros of the fraction dropped.
function unitsText(units: bigint, digits: number): string {
  const negative = units < 0n;
  const abs = (negative ? -units : units).toString().padStart(digits + 1, '0');
  const whole = abs.slice(0, abs.length - digits);
  const fraction = abs.slice(abs.length - digits).replace(/0+$/, '');
  const sign = negative && (whole !== '0' || fraction !== '') ? '-' : '';
  return `${sign}${whole}${fraction === '' ? '' : `.${fraction}`}`;
}

// A position always shows its one decimal: "123.0".
function positionText(tenths: bigint): string {
  const negative = tenths < 0n;
  const abs = negative ? -tenths : tenths;
  const sign = negative && abs !== 0n ? '-' : '';
  return `${sign}${(abs / 10n).toString()}.${(abs % 10n).toString()}`;
}

function parsePosition(position: string): bigint {
  const match = /^(-?)(\d+)\.(\d)$/.exec(position);
  if (!match) throw new Error(`Not a position: "${position}"`);
  const [, sign, whole = '0', tenth = '0'] = match;
  const tenths = BigInt(whole) * 10n + BigInt(tenth);
  return sign === '-' ? -tenths : tenths;
}

function coordinate(value: number): bigint {
  if (!Number.isInteger(value)) {
    throw new Error(`Not a whole coordinate: ${String(value)}`);
  }
  return BigInt(value);
}

/**
 * Where `value` sits on an axis running from `min` (at coordinate `from`) to
 * `max` (at `to`), as a position with one decimal, rounded half up. `from` and
 * `to` are whole layout coordinates; `to` may be smaller than `from` (a
 * vertical axis grows upward).
 */
export function scalePosition(
  value: string,
  min: string,
  max: string,
  from: number,
  to: number,
): string {
  const {
    units: [v = 0n, lo = 0n, hi = 0n],
  } = parseAll([value, min, max]);
  if (hi === lo) throw new Error('An axis needs a range wider than zero');
  const span = (coordinate(to) - coordinate(from)) * 10n;
  return positionText(
    coordinate(from) * 10n + divideHalfUp((v - lo) * span, hi - lo),
  );
}

/**
 * Turns a pointer offset (any pixel unit) inside a box of `boxWidth` into a
 * position on a drawing `viewWidth` wide. The only place a measured number
 * becomes text.
 */
export function pointerPosition(
  offset: number,
  boxWidth: number,
  viewWidth: number,
): string {
  if (!(boxWidth > 0)) throw new Error('The box has no width');
  return positionText(BigInt(Math.round((offset / boxWidth) * viewWidth * 10)));
}

/** Index of the position nearest `target` (the earlier one on a tie). */
export function nearestIndex(
  positions: readonly string[],
  target: string,
): number {
  if (positions.length === 0) throw new Error('No positions to choose from');
  const goal = parsePosition(target);
  let best = 0;
  let bestGap: bigint | null = null;
  positions.forEach((position, index) => {
    const diff = parsePosition(position) - goal;
    const gap = diff < 0n ? -diff : diff;
    if (bestGap === null || gap < bestGap) {
      best = index;
      bestGap = gap;
    }
  });
  return best;
}

/** True when position `a` is greater than position `b`. */
export function isBeyond(a: string, b: string): boolean {
  return parsePosition(a) > parsePosition(b);
}

export interface Axis {
  /** Axis ends and tick values, as decimal text. */
  readonly min: string;
  readonly max: string;
  readonly ticks: readonly string[];
}

const MAX_INTERVALS = 5n;

// The smallest 1, 2 or 5 times a power of ten that covers `range` in at most
// MAX_INTERVALS steps.
function roundStep(range: bigint): bigint {
  for (let power = 1n; ; power *= 10n) {
    for (const factor of [1n, 2n, 5n]) {
      const step = power * factor;
      if ((range + step - 1n) / step <= MAX_INTERVALS) return step;
    }
  }
}

/**
 * A round axis for these values: it always includes zero, and its ticks fall
 * on 1, 2 or 5 times a power of ten, in at most five steps.
 */
export function niceAxis(values: readonly string[]): Axis {
  const { units, digits } = parseAll(['0', ...values]);
  const low = units.reduce((a, b) => (b < a ? b : a));
  const high = units.reduce((a, b) => (b > a ? b : a));
  if (high === low) return { min: '0', max: '1', ticks: ['0', '1'] };
  const range = high - low;
  const step = roundStep(range);
  const first = (low < 0n ? -((-low + step - 1n) / step) : low / step) * step;
  const last = ((high + step - 1n) / step) * step;
  const ticks: string[] = [];
  for (let tick = first; tick <= last; tick += step) {
    ticks.push(unitsText(tick, digits));
  }
  return { min: unitsText(first, digits), max: unitsText(last, digits), ticks };
}

function group(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+$)/g, ',');
}

// Moves the decimal point `places` to the right, exactly.
function shiftRight(text: string, places: number): string {
  const { units, digits } = parse(text);
  const kept = Math.max(0, digits - places);
  return unitsText(units * 10n ** BigInt(Math.max(0, places - digits)), kept);
}

/**
 * Short label for an axis tick. 'dollars': "$500", "$2,500", "$50k", "$2.5k";
 * 'percent': a fraction shown times 100 ("0.2" -> "20%"). Tick values come
 * from niceAxis or are round figures the caller wrote, so the label is exact.
 */
export function tickLabel(value: string, kind: 'dollars' | 'percent'): string {
  if (kind === 'percent') return `${shiftRight(value, 2)}%`;
  const { units, digits } = parse(value);
  const negative = units < 0n;
  const abs = negative ? -units : units;
  const sign = negative ? '-' : '';
  const scale = 10n ** BigInt(digits);
  if (abs >= 1000n * scale && abs % (100n * scale) === 0n) {
    const hundreds = abs / (100n * scale);
    const rest = hundreds % 10n;
    return `${sign}$${group((hundreds / 10n).toString())}${rest === 0n ? '' : `.${rest.toString()}`}k`;
  }
  const [whole = '0', fraction] = unitsText(abs, digits).split('.');
  return `${sign}$${group(whole)}${fraction === undefined ? '' : `.${fraction}`}`;
}
