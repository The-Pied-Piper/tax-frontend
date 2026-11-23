import type { MoneyUnit } from '../money/format';
import { displayRate, displayWholeMoney } from '../money/format';
import {
  compareAmounts,
  halfOf,
  ratioText,
  roundToWhole,
  subtractAmounts,
  timesTenThousand,
} from '../money/scale';
import {
  sweepSalaries,
  type HubChartId,
  type ProvinceSweep,
  type SweepPoint,
} from './hubCharts';
import { hubNoteText } from './hubNoteText';

/**
 * The text under each hub chart (#288): what the chart shows for this province. The wording is
 * written and reviewed by the copy thread and lives in `hubNoteText/`, never in a component. A
 * figure in it is a `{name}` that a spec resolves, so a figure the data can give is never typed.
 *
 * A spec is one string, `kind:...`. Reads, resolved from the hub's data:
 *  - `m:column@salary`  a dollar figure at a sweep salary, to the whole dollar;
 *  - `r:column@salary`  a rate at a sweep salary;
 *  - `k:column@salary`  the share kept: one minus that rate;
 *  - `q:column@salary`  the column over the salary, as a rate (take-home over salary);
 *  - `u:column@salary`  a rate times 10,000: what $10,000 more salary adds;
 *  - `x:column:level`   the first sweep salary where the column reaches the level;
 *  - `h:column`         the first sweep salary where the column reaches half its $500,000 value;
 *  - `v:column`         the lowest value the column takes, as a rate;
 *  - `w:column`         the salary where the column is lowest;
 *  - `z:column`         the first salary after the lowest where the column is no longer below zero.
 * Declared, because the sweep's steps are too coarse to read them out:
 *  - `e:amount:column`  a salary where the column changes, as the copy thread found it on a
 *                       finer sweep; a test fails unless the data changes within one step of it;
 *  - `s:amount:column`  a salary where the column stops growing, checked the same way;
 *  - `d:amount`         a dollar figure printed on a form or fixed by a rule (a cap, a threshold),
 *                       which the sweep does not hold, so nothing checks it;
 *  - `l:words`          words that go in a figure's place, such as "27 cents".
 * Salaries and amounts are written as the sweep writes them: whole dollars, no commas.
 */
export type FigureSpec = string;

/** The columns a spec can read: the places of a `SweepPoint`, plus the Canada Pension Plan and Employment Insurance together. */
export const NOTE_COLUMNS = {
  takeHome: 1,
  deductions: 2,
  tax: 3,
  taxAverage: 4,
  marginal: 5,
  total: 6,
  average: 7,
} as const;

export type NoteColumn = keyof typeof NOTE_COLUMNS | 'cpe';

/** One bullet: its words, with `{name}` where a figure goes, and the figures by name. */
export type Note = { text: string; figures?: Record<string, FigureSpec> };

/** The bullets of each chart of one province. The after-credits chart is not drawn, so it has none. */
export type ProvinceNotes = Partial<Record<HubChartId, Note[]>>;

const COLUMN_NAMES = [...Object.keys(NOTE_COLUMNS), 'cpe'];

function isColumn(name: string): name is NoteColumn {
  return COLUMN_NAMES.includes(name);
}

/** What a column holds at a point, as text. */
export function columnValue(point: SweepPoint, column: NoteColumn): string {
  if (column === 'cpe') return subtractAmounts(point[2], point[3]);
  return point[NOTE_COLUMNS[column]];
}

function pointAt(points: readonly SweepPoint[], salary: string): SweepPoint {
  const found = points.find((point) => compareAmounts(point[0], salary) === 0);
  if (!found) throw new Error(`Hub notes: no sweep point at ${salary}`);
  return found;
}

/** A parsed spec. */
export type ParsedSpec =
  | {
      kind: 'm' | 'r' | 'k' | 'q' | 'u';
      column: NoteColumn;
      salary: string;
    }
  | { kind: 'e' | 's'; amount: string; column: NoteColumn }
  | { kind: 'x'; column: NoteColumn; level: string }
  | { kind: 'h' | 'v' | 'w' | 'z'; column: NoteColumn }
  | { kind: 'd'; amount: string }
  | { kind: 'l'; words: string };

const AMOUNT = /^-?\d+(\.\d+)?$/;

/** Reads a spec; a spec that does not parse is a mistake in the text, so it throws. */
export function parseSpec(spec: string): ParsedSpec {
  const parts = spec.split(':');
  const [kind = '', first = '', second = ''] = parts;
  if (kind === 'l' && spec.length > 2) {
    return { kind, words: spec.slice(2) };
  }
  if (kind === 'd' && parts.length === 2 && AMOUNT.test(first)) {
    return { kind, amount: first };
  }
  if (
    (kind === 'm' ||
      kind === 'r' ||
      kind === 'k' ||
      kind === 'q' ||
      kind === 'u') &&
    parts.length === 2
  ) {
    const [column = '', salary = ''] = first.split('@');
    if (isColumn(column) && AMOUNT.test(salary)) {
      return { kind, column, salary };
    }
  }
  if (
    (kind === 'e' || kind === 's') &&
    parts.length === 3 &&
    AMOUNT.test(first) &&
    isColumn(second)
  ) {
    return { kind, amount: first, column: second };
  }
  if (
    kind === 'x' &&
    parts.length === 3 &&
    isColumn(first) &&
    AMOUNT.test(second)
  ) {
    return { kind, column: first, level: second };
  }
  if (
    (kind === 'h' || kind === 'v' || kind === 'w' || kind === 'z') &&
    parts.length === 2 &&
    isColumn(first)
  ) {
    return { kind, column: first };
  }
  throw new Error(`Hub notes: cannot read the figure "${spec}"`);
}

/** The first point where the column reaches the level, or a throw: a note must not name a level the data never reaches. */
function firstReaching(
  points: readonly SweepPoint[],
  column: NoteColumn,
  level: string,
): SweepPoint {
  const found = points.find(
    (point) => compareAmounts(columnValue(point, column), level) >= 0,
  );
  if (!found) throw new Error(`Hub notes: ${column} never reaches ${level}`);
  return found;
}

/** The text of a spec's figure. */
export function figureText(
  spec: ParsedSpec,
  points: readonly SweepPoint[],
  unit: MoneyUnit,
  rateUnit: MoneyUnit,
): string {
  switch (spec.kind) {
    case 'l':
      return spec.words;
    case 'd':
    case 'e':
    case 's':
      return displayWholeMoney(spec.amount, 'annually', unit);
    case 'x':
      return displayWholeMoney(
        firstReaching(points, spec.column, spec.level)[0],
        'annually',
        unit,
      );
    case 'h': {
      const top = pointAt(points, '500000');
      const half = halfOf(columnValue(top, spec.column));
      return displayWholeMoney(
        firstReaching(points, spec.column, half)[0],
        'annually',
        unit,
      );
    }
    case 'v':
    case 'w':
    case 'z': {
      let low = points[0];
      for (const point of points) {
        if (
          low &&
          compareAmounts(
            columnValue(point, spec.column),
            columnValue(low, spec.column),
          ) < 0
        ) {
          low = point;
        }
      }
      if (!low) throw new Error('Hub notes: no points');
      if (spec.kind === 'v') {
        return displayRate(columnValue(low, spec.column), rateUnit);
      }
      if (spec.kind === 'w') {
        return displayWholeMoney(low[0], 'annually', unit);
      }
      const lowest = low;
      const after = points.find(
        (point) =>
          compareAmounts(point[0], lowest[0]) > 0 &&
          compareAmounts(columnValue(point, spec.column), '0') >= 0,
      );
      if (!after) throw new Error(`Hub notes: ${spec.column} stays below zero`);
      return displayWholeMoney(after[0], 'annually', unit);
    }
    case 'm':
    case 'r':
    case 'k':
    case 'q':
    case 'u': {
      const value = columnValue(pointAt(points, spec.salary), spec.column);
      if (spec.kind === 'm') {
        return displayWholeMoney(roundToWhole(value), 'annually', unit);
      }
      if (spec.kind === 'u') {
        return displayWholeMoney(timesTenThousand(value), 'annually', unit);
      }
      if (spec.kind === 'k') {
        return displayRate(subtractAmounts('1', value), rateUnit);
      }
      if (spec.kind === 'q') {
        return displayRate(ratioText(value, spec.salary), rateUnit);
      }
      return displayRate(value, rateUnit);
    }
  }
}

/**
 * True when a declared salary agrees with the sweep: the column changes (or stops) at a sweep
 * point within one step of the amount. Reads, `d` and `l` have nothing to disagree with.
 */
export function figureAgrees(
  spec: ParsedSpec,
  points: readonly SweepPoint[],
): boolean {
  if (spec.kind !== 'e' && spec.kind !== 's') return true;
  let at = -1;
  points.forEach((point, index) => {
    if (compareAmounts(point[0], spec.amount) <= 0) at = index;
  });
  const here = points[at];
  const before = points[at - 1];
  const after = points[at + 1];
  if (!here || !after) return false;
  const now = columnValue(here, spec.column);
  const next = columnValue(after, spec.column);
  const last = before ? columnValue(before, spec.column) : null;
  if (spec.kind === 'e') {
    // A salary on a sweep step may be where the new value first shows, or the last of the old one.
    return (
      compareAmounts(now, next) !== 0 ||
      (last !== null &&
        compareAmounts(here[0], spec.amount) === 0 &&
        compareAmounts(last, now) !== 0)
    );
  }
  // Stops: flat from the amount on, and lower just before it.
  return (
    last !== null &&
    compareAmounts(now, next) === 0 &&
    compareAmounts(last, now) < 0
  );
}

const TOKEN = /\{([a-zA-Z0-9]+)\}/g;

/** The names a bullet's words use, in order. */
export function tokensOf(text: string): string[] {
  return [...text.matchAll(TOKEN)].map((match) => match[1] ?? '');
}

/** The bullet's words with every figure filled from the sweep. A name with no spec, or a spec no word uses, is a mistake in the text and throws. */
export function noteWords(note: Note, sweep: ProvinceSweep): string {
  const figures = note.figures ?? {};
  const used = new Set(tokensOf(note.text));
  for (const name of Object.keys(figures)) {
    if (!used.has(name)) throw new Error(`Hub notes: {${name}} is not used`);
  }
  return note.text.replace(TOKEN, (_all, name: string) => {
    const spec = figures[name];
    if (spec === undefined)
      throw new Error(`Hub notes: no figure for {${name}}`);
    return figureText(
      parseSpec(spec),
      sweep.points,
      sweep.unit,
      sweep.rateUnit,
    );
  });
}

/** True when the sweep holds every salary of `sweepSalaries()`, which the notes read figures at. The build refuses any other, so only partial test data fails this. */
function isFullSweep(sweep: ProvinceSweep): boolean {
  const expected = sweepSalaries();
  return (
    sweep.points.length === expected.length &&
    sweep.points.every((point, at) => point[0] === `${expected[at] ?? ''}.00`)
  );
}

/** The bullets under one chart of a province hub, or none when the province has no text for it or the sweep is not the full one. */
export function chartNotes(
  province: string,
  chart: HubChartId,
  sweep: ProvinceSweep,
): string[] {
  if (!isFullSweep(sweep)) return [];
  const notes = hubNoteText[province]?.[chart] ?? [];
  return notes.map((note) => noteWords(note, sweep));
}
