import type { Unit } from '../adapters';
import { readUnit } from '../adapters/fallback';
import { compareAmounts } from '../money/scale';
import { isRecord } from './salaryPageData';

/** The regular salaries of the sweep as text, lowest first: every $1,000 from $1,000 to $250,000, then every $5,000 to $500,000. The API takes no salary of 0. The province comparison's slider has a step for each. */
export function regularSalaries(): string[] {
  const salaries: string[] = [];
  for (let n = 1000; n <= 250000; n += 1000) salaries.push(n.toString());
  for (let n = 255000; n <= 500000; n += 5000) salaries.push(n.toString());
  return salaries;
}

/** Salaries added to the sweep so the lines show what a regular step would miss: the $2,000 Employment Insurance band and the Ontario health premium steps near $201,000. */
const EXTRA_SALARIES = [
  '1990',
  '2020',
  '2040',
  '201100',
  '201200',
  '201700',
  '201800',
];

/** Every salary of the sweep as text, lowest first: the regular ones and the extra ones. */
export function sweepSalaries(): string[] {
  return [...regularSalaries(), ...EXTRA_SALARIES].sort(compareAmounts);
}

/** The indexes of the points at a regular salary, in order. */
export function regularIndexes(points: readonly SweepPoint[]): number[] {
  const regular = new Set(regularSalaries().map((salary) => `${salary}.00`));
  const indexes: number[] = [];
  points.forEach((point, at) => {
    if (regular.has(point[0])) indexes.push(at);
  });
  return indexes;
}

/**
 * One point of a sweep, all text as the engine wrote it: salary, take-home,
 * total deductions, income tax (the total payable, before credits paid to you) and its
 * average rate (the comparison's figures), then the figures the charts draw on one
 * basis, income tax plus Canada Pension Plan and Employment Insurance less the credits paid
 * to you when you file: the marginal rate (the change in that total per extra dollar),
 * the total for the year and its average rate.
 */
export type SweepPoint = [
  salary: string,
  takeHome: string,
  totalDeductions: string,
  incomeTax: string,
  averageRate: string,
  marginalRate: string,
  yearTotal: string,
  yearAverageRate: string,
];

/** The sweep of one province. */
export type ProvinceSweep = {
  slug: string;
  year: number;
  provisional: boolean;
  /** The unit of the money figures. */
  unit: Unit;
  /** The unit of the two rates. */
  rateUnit: Unit;
  points: SweepPoint[];
};

/** What a hub's data block holds: the sweep of every province the build served. */
export type HubChartsData = { provinces: ProvinceSweep[] };

/** A figure as the API writes it, and as money/ reads it: optional minus, no leading zero, optional decimals, at most 30 characters. */
const DECIMAL = /^-?(0|[1-9]\d*)(\.\d+)?$/;
const MAX_FIGURE_LENGTH = 30;
/** A slug as the site writes it. */
const SLUG = /^[a-z0-9-]+$/;

function isPoint(value: unknown): value is SweepPoint {
  return (
    Array.isArray(value) &&
    value.length === 8 &&
    value.every(
      (part: unknown) =>
        typeof part === 'string' &&
        part.length <= MAX_FIGURE_LENGTH &&
        DECIMAL.test(part),
    )
  );
}

function isProvinceSweep(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.slug === 'string' &&
    SLUG.test(value.slug) &&
    typeof value.year === 'number' &&
    typeof value.provisional === 'boolean' &&
    readUnit(value.unit) !== null &&
    readUnit(value.rateUnit) !== null &&
    Array.isArray(value.points) &&
    value.points.length > 0 &&
    value.points.every(isPoint)
  );
}

/** The salaries of a province's points, in order. */
function salariesOf(sweep: ProvinceSweep): string[] {
  return sweep.points.map((point) => point[0]);
}

/** True when the salaries of the points are above zero and rise. */
function hasRisingSalaries(sweep: ProvinceSweep): boolean {
  return salariesOf(sweep).every(
    (salary, at, all) =>
      compareAmounts(salary, at === 0 ? '0' : (all[at - 1] ?? '0')) > 0,
  );
}

/**
 * True when every province has the same salaries and year, and no slug is repeated. The comparison reads
 * every province at one position of the sweep and states one year.
 */
function shareSalariesAndYear(provinces: ProvinceSweep[]): boolean {
  const [first] = provinces;
  if (!first) return false;
  if (new Set(provinces.map((sweep) => sweep.slug)).size !== provinces.length) {
    return false;
  }
  const salaries = salariesOf(first).join(',');
  return provinces.every(
    (sweep) =>
      sweep.year === first.year && salariesOf(sweep).join(',') === salaries,
  );
}

function isHubChartsData(value: unknown): value is HubChartsData {
  return (
    isRecord(value) &&
    Array.isArray(value.provinces) &&
    value.provinces.length > 0 &&
    value.provinces.every(isProvinceSweep) &&
    // isProvinceSweep has checked the shape of every entry.
    shareSalariesAndYear(value.provinces as ProvinceSweep[]) &&
    (value.provinces as ProvinceSweep[]).every(hasRisingSalaries)
  );
}

/**
 * The text of a hub's data block, checked before it is trusted, or null for no
 * block, text that is not JSON, or a shape the charts do not expect.
 */
export function parseHubChartsData(text: string | null): HubChartsData | null {
  if (text === null || text.trim() === '') return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return isHubChartsData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** The salary the marker starts on. */
export const DEFAULT_SALARY = '70000';

/** The marker's first place: the index of the `DEFAULT_SALARY` point (salaries are quantized, so "70000.00"), or the first point. */
export function defaultIndex(points: readonly SweepPoint[]): number {
  return Math.max(
    0,
    points.findIndex((point) => point[0] === `${DEFAULT_SALARY}.00`),
  );
}

/** The salary axis of every chart: the ends and the labelled round salaries, as text. */
export const SALARY_AXIS = {
  min: '0',
  max: '500000',
  ticks: ['100000', '200000', '300000', '400000', '500000'],
  /** The labels a phone shows instead. */
  phoneTicks: ['250000', '500000'],
} as const;

/** The four charts of a hub, in the order of its sections. */
export const HUB_CHART_IDS = [
  'takeHome',
  'averageRate',
  'marginalRate',
  'yearTotal',
] as const;

export type HubChartId = (typeof HUB_CHART_IDS)[number];

/** The place of each figure in a `SweepPoint`. */
export const SWEEP_COLUMN = {
  takeHome: 1,
  deductions: 2,
  tax: 3,
  taxAverage: 4,
  marginal: 5,
  total: 6,
  average: 7,
} as const;

/** Which place of a `SweepPoint` each chart reads. */
export const CHART_COLUMN: Record<HubChartId, number> = {
  takeHome: SWEEP_COLUMN.takeHome,
  averageRate: SWEEP_COLUMN.average,
  marginalRate: SWEEP_COLUMN.marginal,
  yearTotal: SWEEP_COLUMN.total,
};

/** True for the two charts that draw a rate; the others draw money and follow Per year / Per month. */
export function isRateChart(chart: HubChartId): boolean {
  return chart === 'averageRate' || chart === 'marginalRate';
}
