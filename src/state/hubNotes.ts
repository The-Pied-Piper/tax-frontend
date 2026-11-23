import {
  displayCents,
  displayRate,
  displayRateOneDecimal,
  displayWholeMoney,
} from '../money/format';
import {
  ratioText,
  roundToHalfPoint,
  roundToWhole,
  subtractAmounts,
  timesTenThousand,
} from '../money/amounts';
import { compareAmounts } from '../money/scale';
import {
  SWEEP_COLUMN,
  sweepSalaries,
  type HubChartId,
  type ProvinceSweep,
  type SweepEdge,
  type SweepPoint,
} from './hubCharts';
import { hubNoteText } from './hubNoteText';
import type { Note } from './hubNoteTypes';
import type { FooterProvinceSlug } from './siteLinks';

/**
 * The text under each hub chart (#288): what the chart shows for this province. The wording is
 * written and reviewed by the copy thread and lives in `hubNoteText/`, never in a component. A
 * figure in it is a `{name}` that a spec resolves, so a figure the data can give is never typed.
 *
 * A spec is one string, `kind:...`. Reads, resolved from the hub's data:
 *  - `m:column@salary`  a dollar figure at a sweep salary, to the whole dollar;
 *  - `r:column@salary`  a rate at a sweep salary: the marginal rate to the nearest half point
 *                       ("7.5%", "59%"), any other rate to one decimal ("23.2%");
 *  - `k:column@salary`  the share kept: one minus that rate;
 *  - `q:column@salary`  the column over the salary, as a rate (take-home over salary);
 *  - `c:column@salary`  a rate as cents on the dollar, to the nearest half cent: "7.5 cents";
 *  - `u:column@salary`  a rate times 10,000: what $10,000 more salary adds;
 *  - `e:amount`         where the marginal rate changes, from the engine's edges: the salary at which
 *                       the new rate has taken hold. The amount only says which change (the
 *                       one between the sweep salary just below it and the next); the figure is the
 *                       engine's. Where two changes fall in one step, the nearer is read;
 *  - `o:amount`         the same change, read as the salary where the rate first moves (the end of a band);
 *  - `y:amount`         the marginal rate once that change has taken hold, to one decimal ("54.9%");
 *  - `f:name`           a dollar figure the engine wrote for the province, to the whole dollar: a
 *                       parameter of its 2026 dataset (a surtax threshold) or a band it found;
 *  - `t:name`           a rate the engine wrote, as cents on the dollar, digits as written ("3.56 cents");
 *  - `p:name`           a rate the engine wrote, as a percent, digits as written ("20.5%").
 * Declared, because the data does not hold them:
 *  - `d:amount`         a dollar figure printed on a form or fixed by a rule (a cap, a threshold),
 *                       which nothing checks;
 *  - `l:words`          words that go in a figure's place, such as "27 cents".
 * Salaries and amounts are written as the sweep writes them: whole dollars, no commas.
 */

/** The columns a spec can read: the places of a `SweepPoint`, plus the Canada Pension Plan and Employment Insurance together. */
export type NoteColumn = keyof typeof SWEEP_COLUMN | 'cpe';

const COLUMN_NAMES = [...Object.keys(SWEEP_COLUMN), 'cpe'];

function isColumn(name: string): name is NoteColumn {
  return COLUMN_NAMES.includes(name);
}

/** What a column holds at a point, as text. */
export function columnValue(point: SweepPoint, column: NoteColumn): string {
  if (column === 'cpe') return subtractAmounts(point[2], point[3]);
  return point[SWEEP_COLUMN[column]];
}

function pointAt(points: readonly SweepPoint[], salary: string): SweepPoint {
  const found = points.find((point) => compareAmounts(point[0], salary) === 0);
  if (!found) throw new Error(`Hub notes: no sweep point at ${salary}`);
  return found;
}

/** A parsed spec. */
export type ParsedSpec =
  | {
      kind: 'm' | 'r' | 'k' | 'q' | 'u' | 'c';
      column: NoteColumn;
      salary: string;
    }
  | { kind: 'e' | 'o' | 'y' | 'd'; amount: string }
  | { kind: 'f' | 't' | 'p'; name: string }
  | { kind: 'l'; words: string };

const AMOUNT = /^-?\d+(\.\d+)?$/;
const FACT_NAME = /^[a-z0-9_]+$/;

/** Reads a spec; a spec that does not parse is a mistake in the text, so it throws. */
export function parseSpec(spec: string): ParsedSpec {
  const parts = spec.split(':');
  const [kind = '', first = ''] = parts;
  if (kind === 'l' && spec.length > 2) {
    return { kind, words: spec.slice(2) };
  }
  if (
    (kind === 'd' || kind === 'e' || kind === 'o' || kind === 'y') &&
    parts.length === 2 &&
    AMOUNT.test(first)
  ) {
    return { kind, amount: first };
  }
  if (
    (kind === 'f' || kind === 't' || kind === 'p') &&
    parts.length === 2 &&
    FACT_NAME.test(first)
  ) {
    return { kind, name: first };
  }
  if (
    (kind === 'm' ||
      kind === 'r' ||
      kind === 'k' ||
      kind === 'q' ||
      kind === 'u' ||
      kind === 'c') &&
    parts.length === 2
  ) {
    const [column = '', salary = ''] = first.split('@');
    if (isColumn(column) && AMOUNT.test(salary)) {
      return { kind, column, salary };
    }
  }
  throw new Error(`Hub notes: cannot read the figure "${spec}"`);
}

/**
 * The engine's change of the marginal rate the amount points at: among the edges just above the sweep
 * salary at or below the amount, the one nearest the amount. A note must not name a change the data does not
 * hold, so no edge is a throw.
 */
function edgeNear(sweep: ProvinceSweep, amount: string): SweepEdge {
  const below = sweep.points
    .map((point) => point[0])
    .filter((salary) => compareAmounts(salary, amount) <= 0)
    .pop();
  const candidates = sweep.edges.filter(
    (edge) => below !== undefined && compareAmounts(edge[0], below) === 0,
  );
  const [first, ...rest] = candidates;
  if (!first) throw new Error(`Hub notes: no change of rate near ${amount}`);
  let nearest = first;
  for (const edge of rest) {
    if (
      compareAmounts(
        absoluteGap(edge[2], amount),
        absoluteGap(nearest[2], amount),
      ) < 0
    ) {
      nearest = edge;
    }
  }
  return nearest;
}

function absoluteGap(a: string, b: string): string {
  const gap = subtractAmounts(a, b);
  return gap.startsWith('-') ? gap.slice(1) : gap;
}

function factOf(sweep: ProvinceSweep, name: string): string {
  const value = sweep.facts[name];
  if (value === undefined) throw new Error(`Hub notes: no figure "${name}"`);
  return value;
}

/** The text of a spec's figure. */
export function figureText(spec: ParsedSpec, sweep: ProvinceSweep): string {
  const { points, unit, rateUnit } = sweep;
  switch (spec.kind) {
    case 'l':
      return spec.words;
    case 'd':
      return displayWholeMoney(spec.amount, 'annually', unit);
    case 'e':
      return displayWholeMoney(
        edgeNear(sweep, spec.amount)[2],
        'annually',
        unit,
      );
    case 'o':
      return displayWholeMoney(
        edgeNear(sweep, spec.amount)[1],
        'annually',
        unit,
      );
    case 'y':
      return displayRateOneDecimal(edgeNear(sweep, spec.amount)[3], rateUnit);
    case 'f':
      return displayWholeMoney(
        roundToWhole(factOf(sweep, spec.name)),
        'annually',
        unit,
      );
    case 't':
      return displayCents(factOf(sweep, spec.name));
    case 'p':
      return displayRate(factOf(sweep, spec.name), rateUnit);
    case 'm':
    case 'r':
    case 'k':
    case 'q':
    case 'u':
    case 'c': {
      const value = columnValue(pointAt(points, spec.salary), spec.column);
      if (spec.kind === 'm') {
        return displayWholeMoney(roundToWhole(value), 'annually', unit);
      }
      if (spec.kind === 'u') {
        return displayWholeMoney(timesTenThousand(value), 'annually', unit);
      }
      if (spec.kind === 'c') {
        return displayCents(roundToHalfPoint(value));
      }
      if (spec.kind === 'k') {
        return displayRate(subtractAmounts('1', value), rateUnit);
      }
      if (spec.kind === 'q') {
        return displayRate(ratioText(value, spec.salary), rateUnit);
      }
      return spec.column === 'marginal'
        ? displayRate(roundToHalfPoint(value), rateUnit)
        : displayRateOneDecimal(value, rateUnit);
    }
  }
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
    return figureText(parseSpec(spec), sweep);
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
  province: FooterProvinceSlug,
  chart: HubChartId,
  sweep: ProvinceSweep,
): string[] {
  if (!isFullSweep(sweep)) return [];
  const notes = hubNoteText[province]?.[chart] ?? [];
  return notes.map((note) => noteWords(note, sweep));
}
