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

/** Salaries added to the sweep so the lines show what a regular step would miss: the $2,000 Employment Insurance band, the narrow stretch where Ontario tax has started and the LIFT credit has not yet begun to shrink, and, for each narrow Ontario health premium step, a salary just either side of both its edges (the lines join the points, so a step shows at its true place and width). */
const EXTRA_SALARIES = [
  '1990',
  '2020',
  '2040',
  '32570',
  '32580',
  '32790',
  '32800',
  '36320',
  '36340',
  '38840',
  '38860',
  '48440',
  '48460',
  '49050',
  '49070',
  '72680',
  '72700',
  '73290',
  '73310',
  '201100',
  '201120',
  '201140',
  '201200',
  '201700',
  '201720',
  '201740',
  '201800',
];

/**
 * Salaries added to one province's sweep only: a salary on each side of every change of its marginal rate (the engine's
 * edges), so its rates page draws each step at its true place. Only that province's sweep carries them, which keeps the
 * hub data block, which holds every province's sweep, under its size limit. The same lists are `extra` of each province in
 * `build/salaryPages/provinces.json`, which the Python step reads (a test fails if they differ).
 */
export const PROVINCE_EXTRA_SALARIES: Readonly<
  Record<string, readonly string[]>
> = {
  'ca-sk': [
    '1999',
    '2001',
    '2033',
    '2034',
    '3499',
    '3500',
    '3501',
    '19200',
    '19201',
    '21827',
    '21828',
    '55047',
    '55048',
    '59078',
    '59079',
    '68899',
    '68900',
    '74599',
    '74600',
    '74601',
    '84999',
    '118171',
    '118172',
    '118173',
    '156931',
    '156932',
    '156933',
    '182566',
    '182567',
    '182568',
    '259608',
    '259609',
    '259610',
  ],
  'ca-bc': [
    '1999',
    '2001',
    '2033',
    '2034',
    '3499',
    '3500',
    '3501',
    '19200',
    '19201',
    '26752',
    '26753',
    '45370',
    '45371',
    '50836',
    '50837',
    '59078',
    '59079',
    '68899',
    '68900',
    '74599',
    '74601',
    '84999',
    '101855',
    '101856',
    '116775',
    '116776',
    '118172',
    '118173',
    '141557',
    '141558',
    '182567',
    '182568',
    '191532',
    '191533',
    '259608',
    '259609',
    '259610',
    '266672',
    '266673',
  ],
  'ca-mb': [
    '2001',
    '2033',
    '2034',
    '3500',
    '3501',
    '17402',
    '17403',
    '19200',
    '19201',
    '23140',
    '23141',
    '47439',
    '47440',
    '59078',
    '59079',
    '68899',
    '68900',
    '74599',
    '74601',
    '84999',
    '101127',
    '101128',
    '118172',
    '118173',
    '182567',
    '182568',
    '201127',
    '201128',
    '259608',
    '259610',
    '401126',
    '401127',
  ],
  'ca-nl': [
    '2033',
    '2034',
    '3500',
    '19200',
    '19201',
    '25100',
    '25101',
    '30763',
    '30764',
    '45093',
    '45094',
    '59078',
    '59079',
    '68899',
    '68900',
    '74599',
    '74601',
    '84999',
    '90481',
    '118172',
    '160655',
    '182567',
    '224467',
    '259608',
    '259610',
    '286446',
  ],
  'ca-ab': [
    '1999',
    '2001',
    '2033',
    '2034',
    '3499',
    '3500',
    '3501',
    '19200',
    '19201',
    '24411',
    '24412',
    '59078',
    '59079',
    '61782',
    '61783',
    '68899',
    '68900',
    '74599',
    '74601',
    '84999',
    '118172',
    '118173',
    '155386',
    '155387',
    '182567',
    '182568',
    '186238',
    '186239',
    '247940',
    '247941',
    '259608',
    '259609',
    '259610',
    '371347',
    '371348',
  ],
  'ca-qc': [
    '1999',
    '2001',
    '2026',
    '2027',
    '3499',
    '3500',
    '19280',
    '19281',
    '20340',
    '20341',
    '21349',
    '21350',
    '24166',
    '24167',
    '26570',
    '26571',
    '29881',
    '29882',
    '56323',
    '56324',
    '59078',
    '59079',
    '68899',
    '68900',
    '74599',
    '74601',
    '84999',
    '85001',
    '102999',
    '103001',
    '111256',
    '111257',
    '118171',
    '118172',
    '134821',
    '134822',
    '182566',
    '182567',
    '259608',
    '259609',
    '259610',
  ],
};

/** Every salary of a province's sweep as text, lowest first: the regular ones, the extra ones every province has, and the province's own (`slug`; none for a province with no list). */
export function sweepSalaries(slug?: string): string[] {
  const own = (slug && PROVINCE_EXTRA_SALARIES[slug]) || [];
  return [...regularSalaries(), ...EXTRA_SALARIES, ...own].sort(compareAmounts);
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
 * One point of a sweep, all text as the engine wrote it: salary, take-home, total
 * deductions and income tax (the total payable, T1 line 43500, so tax cuts such as the Ontario
 * LIFT credit count), then the figures the charts draw. The deductions are income tax plus
 * Canada Pension Plan (all three parts) plus Employment Insurance as the Employment Insurance
 * form sets it, and credits paid to you when you file are not counted. The average rate is the
 * deductions over the salary and the marginal rate is their change per extra dollar.
 */
export type SweepPoint = [
  salary: string,
  takeHome: string,
  totalDeductions: string,
  incomeTax: string,
  averageRate: string,
  marginalRate: string,
];

/**
 * Where the marginal rate changes, as the engine found it, to the cent, between two neighbouring sweep
 * salaries: the sweep salary below, the last whole salary at the old rate, the first whole salary at the
 * new rate (a ramp settles later) and the marginal rate there (a fraction). A band starts where the rate has settled and ends where it first moves back. Whole dollars, as text.
 */
export type SweepEdge = [
  below: string,
  moves: string,
  settled: string,
  rate: string,
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
  /** The changes of the marginal rate between sweep salaries, lowest first. */
  edges: SweepEdge[];
  /** Engine parameters and band figures the notes quote, by name: the Ontario surtax thresholds, a reduction's start, and so on. */
  facts: Record<string, string>;
  /** The salaries (whole dollars as text, "70000") of the province's own salary pages, so a bar can link to the page of the salary shown. Absent where the build wrote none. */
  salaryPages?: string[];
};

/** What a hub's data block holds: the sweep of every province the build served. */
export type HubChartsData = { provinces: ProvinceSweep[] };

/** A figure as the API writes it, and as money/ reads it: optional minus, no leading zero, optional decimals, at most 30 characters. */
const DECIMAL = /^-?(0|[1-9]\d*)(\.\d+)?$/;
const MAX_FIGURE_LENGTH = 30;
/** A slug as the site writes it. */
const SLUG = /^[a-z0-9-]+$/;
/** A salary page's salary: whole dollars. */
const SALARY_PAGE = /^[1-9]\d{0,6}$/;
/** A fact's name as the engine step writes it. */
const SLUG_NAME = /^[a-z0-9_]+$/;

function isPoint(value: unknown): value is SweepPoint {
  return (
    Array.isArray(value) &&
    value.length === 6 &&
    value.every(
      (part: unknown) =>
        typeof part === 'string' &&
        part.length <= MAX_FIGURE_LENGTH &&
        DECIMAL.test(part),
    )
  );
}

function isEdge(value: unknown): value is SweepEdge {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every(
      (part: unknown) =>
        typeof part === 'string' &&
        part.length <= MAX_FIGURE_LENGTH &&
        DECIMAL.test(part),
    )
  );
}

function isFacts(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([name, fact]) =>
        SLUG_NAME.test(name) &&
        typeof fact === 'string' &&
        fact.length <= MAX_FIGURE_LENGTH &&
        DECIMAL.test(fact),
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
    value.points.every(isPoint) &&
    Array.isArray(value.edges) &&
    value.edges.every(isEdge) &&
    isFacts(value.facts) &&
    (value.salaryPages === undefined ||
      (Array.isArray(value.salaryPages) &&
        value.salaryPages.every(
          (salary) => typeof salary === 'string' && SALARY_PAGE.test(salary),
        )))
  );
}

/** The salaries of a province's points, in order. */
function salariesOf(sweep: ProvinceSweep): string[] {
  return sweep.points.map((point) => point[0]);
}

/** The salaries of a province's regular points: the ones every province has in common. */
function regularSalariesOf(sweep: ProvinceSweep): string[] {
  return regularIndexes(sweep.points).map((at) => sweep.points[at]?.[0] ?? '');
}

/** True when the salaries of the points are above zero and rise. */
function hasRisingSalaries(sweep: ProvinceSweep): boolean {
  return salariesOf(sweep).every(
    (salary, at, all) =>
      compareAmounts(salary, at === 0 ? '0' : (all[at - 1] ?? '0')) > 0,
  );
}

/**
 * True when every province has the same regular salaries and year, and no slug is repeated. The comparison reads
 * every province at one regular salary and states one year; a province's own extra points are its own.
 */
function shareSalariesAndYear(provinces: ProvinceSweep[]): boolean {
  const [first] = provinces;
  if (!first) return false;
  if (new Set(provinces.map((sweep) => sweep.slug)).size !== provinces.length) {
    return false;
  }
  const salaries = regularSalariesOf(first).join(',');
  return provinces.every(
    (sweep) =>
      sweep.year === first.year &&
      regularSalariesOf(sweep).join(',') === salaries,
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

/** The three charts of a hub, in the order of its sections. */
export const HUB_CHART_IDS = [
  'takeHome',
  'averageRate',
  'marginalRate',
] as const;

export type HubChartId = (typeof HUB_CHART_IDS)[number];

/** The place of each figure in a `SweepPoint`. */
export const SWEEP_COLUMN = {
  takeHome: 1,
  deductions: 2,
  tax: 3,
  average: 4,
  marginal: 5,
} as const;

/** Which place of a `SweepPoint` each chart reads. */
export const CHART_COLUMN: Record<HubChartId, number> = {
  takeHome: SWEEP_COLUMN.takeHome,
  averageRate: SWEEP_COLUMN.average,
  marginalRate: SWEEP_COLUMN.marginal,
};

/** True for the two charts that draw a rate; the other draws money and follow Per year / Per month. */
export function isRateChart(chart: HubChartId): boolean {
  return chart === 'averageRate' || chart === 'marginalRate';
}
