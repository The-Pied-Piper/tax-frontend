import type { Unit } from '../adapters';
import { readUnit } from '../adapters/fallback';
import { isRecord } from './salaryPageData';

/** The id of the data block on a province hub that holds every served province's salary sweep. */
export const HUB_CHARTS_DATA_ID = 'hub-charts-data';

/** The salaries of the sweep as text, lowest first: every $1,000 from $1,000 to $250,000, then every $5,000 to $500,000. The API takes no salary of 0. */
export function sweepSalaries(): string[] {
  const salaries: string[] = [];
  for (let n = 1000; n <= 250000; n += 1000) salaries.push(n.toString());
  for (let n = 255000; n <= 500000; n += 5000) salaries.push(n.toString());
  return salaries;
}

/**
 * One point of a sweep, all text exactly as the API sent it: salary, take-home,
 * total deductions, income tax (the total payable, before credits paid to you),
 * average rate, marginal rate. Credits paid to you join when the engine has them.
 */
export type SweepPoint = [
  salary: string,
  takeHome: string,
  totalDeductions: string,
  incomeTax: string,
  averageRate: string,
  marginalRate: string,
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

/** A figure as the API writes it: optional minus, digits, optional decimals. */
const DECIMAL = /^-?\d+(\.\d+)?$/;

function isPoint(value: unknown): value is SweepPoint {
  return (
    Array.isArray(value) &&
    value.length === 6 &&
    value.every(
      (part: unknown) => typeof part === 'string' && DECIMAL.test(part),
    )
  );
}

function isProvinceSweep(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.slug === 'string' &&
    typeof value.year === 'number' &&
    typeof value.provisional === 'boolean' &&
    readUnit(value.unit) !== null &&
    readUnit(value.rateUnit) !== null &&
    Array.isArray(value.points) &&
    value.points.length > 0 &&
    value.points.every(isPoint)
  );
}

function isHubChartsData(value: unknown): value is HubChartsData {
  return (
    isRecord(value) &&
    Array.isArray(value.provinces) &&
    value.provinces.length > 0 &&
    value.provinces.every(isProvinceSweep)
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
