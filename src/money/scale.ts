// Coordinate arithmetic for charts. A disclosed exception in money/ (gate
// ruling, 22 Nov 2026): exact decimal text goes in, a position or a round axis
// value comes out as text, never a figure that is shown as money. Every shown
// figure stays the API's own text, formatted by money/format. All work is on
// scaled BigInt integers; there is no float in the money path.
//
// A position is a coordinate in the chart's own units (SVG user units), kept
// to one decimal and written as text: "123.4".

import { divideHalfUp, parseAll, unitsText } from './decimal';

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

/** -1, 0 or 1: how amount `a` compares with amount `b`, judged exactly on the decimal text. */
export function compareAmounts(a: string, b: string): -1 | 0 | 1 {
  const {
    units: [x = 0n, y = 0n],
  } = parseAll([a, b]);
  if (x === y) return 0;
  return x < y ? -1 : 1;
}

/**
 * Index of the amount nearest `target`, judged exactly on the decimal text (the
 * earlier one on a tie).
 */
export function nearestAmountIndex(
  amounts: readonly string[],
  target: string,
): number {
  if (amounts.length === 0) throw new Error('No amounts to choose from');
  const { units } = parseAll([target, ...amounts]);
  const [goal = 0n, ...scaled] = units;
  let best = 0;
  let bestGap: bigint | null = null;
  scaled.forEach((unit, index) => {
    const diff = unit - goal;
    const gap = diff < 0n ? -diff : diff;
    if (bestGap === null || gap < bestGap) {
      best = index;
      bestGap = gap;
    }
  });
  return best;
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

// The smallest 1, 2 or 5 times a power of ten whose steps, aligned to
// multiples of the step, cover low..high in at most MAX_INTERVALS steps.
function roundStep(low: bigint, high: bigint): bigint {
  for (let power = 1n; ; power *= 10n) {
    for (const factor of [1n, 2n, 5n]) {
      const step = power * factor;
      const first = floorDiv(low, step);
      const last = -floorDiv(-high, step);
      if (last - first <= MAX_INTERVALS) return step;
    }
  }
}

function floorDiv(n: bigint, d: bigint): bigint {
  const q = n / d;
  return n % d !== 0n && n < 0n ? q - 1n : q;
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
  const step = roundStep(low, high);
  const first = floorDiv(low, step) * step;
  const last = -floorDiv(-high, step) * step;
  const ticks: string[] = [];
  for (let tick = first; tick <= last; tick += step) {
    ticks.push(unitsText(tick, digits));
  }
  return { min: unitsText(first, digits), max: unitsText(last, digits), ticks };
}
