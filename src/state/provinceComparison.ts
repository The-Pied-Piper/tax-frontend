import type { MoneyUnit } from '../money/format';
import { toPlainSalary, type Separators } from '../money/salaryInput';
import {
  compareAmounts,
  nearestAmountIndex,
  scalePosition,
} from '../money/scale';
import { regularIndexes, SWEEP_COLUMN, type ProvinceSweep } from './hubCharts';

/** What the bars show. */
export type Measure = 'takeHome' | 'takenOff' | 'averageRate';

/** The measures in the order of the toggle. */
export const MEASURES: readonly Measure[] = [
  'takeHome',
  'takenOff',
  'averageRate',
];

// Each measure's place in a sweep point.
const COLUMN = {
  takeHome: SWEEP_COLUMN.takeHome,
  takenOff: SWEEP_COLUMN.deductions,
  averageRate: SWEEP_COLUMN.average,
} as const;

/** The salary the comparison starts at. */
export const DEFAULT_SALARY = '70000';

/** The index of the point nearest `salary` (the lower one on a tie). */
export function nearestSalaryIndex(
  salaries: readonly string[],
  salary: string,
): number {
  return nearestAmountIndex(salaries, salary);
}

/**
 * The index of the point nearest a typed salary, or null when the text is not
 * a salary inside the sweep (below its first point or above its last).
 */
export function typedSalaryIndex(
  typed: string,
  salaries: readonly string[],
  separators: Separators,
): number | null {
  // Leading zeros mean nothing in a typed salary; the amounts of money/scale have none.
  const plain = toPlainSalary(typed, separators).replace(/^0+(?=\d)/, '');
  const first = salaries[0];
  const last = salaries[salaries.length - 1];
  if (
    first === undefined ||
    last === undefined ||
    !/^\d{1,15}(\.\d{1,2})?$/.test(plain) ||
    compareAmounts(plain, first) < 0 ||
    compareAmounts(plain, last) > 0
  ) {
    return null;
  }
  return nearestSalaryIndex(salaries, plain);
}

/** One bar: a province, its figure as the API wrote it, and its length as a percent of the longest bar. */
export type ComparisonRow = {
  slug: string;
  value: string;
  unit: MoneyUnit;
  /** Position text such as "34.5", from 0 to 100. */
  width: string;
};

/** A province's figure for a measure at one regular salary (`index` counts the regular salaries, so a province's own extra points do not move it). The sweep keeps rates to seven places; a rate is shown once rounded to four. */
function figureOf(
  province: ProvinceSweep,
  index: number,
  measure: Measure,
): string {
  const at = regularIndexes(province.points)[index];
  const value = province.points[at ?? -1]?.[COLUMN[measure]] ?? '0';
  return value;
}

/** True when no province takes anything off at one regular salary (the `index`th): no income tax and no contributions, so none ranks above another. */
export function allTied(
  provinces: readonly ProvinceSweep[],
  index: number,
): boolean {
  return provinces.every(
    (province) => compareAmounts(takenOffOf(province, index), '0') <= 0,
  );
}

/** What comes off the salary in a province at one regular salary (the `index`th): income tax and contributions together, salary minus take-home. Every view is ranked by it, which puts take-home pay and the average tax rate in the same order. */
function takenOffOf(province: ProvinceSweep, index: number): string {
  return figureOf(province, index, 'takenOff');
}

/**
 * Every province at one regular salary of the sweep (the `index`th), with the least taken off the salary first (income
 * tax and contributions together), whichever measure the bars show. That is the order of take-home pay, highest first,
 * and of the average tax rate, lowest first, so switching the measure never reorders the list (provinces with the same
 * amount taken off keep the order of the list).
 * The longest bar is 100.
 */
export function comparisonRows(
  provinces: readonly ProvinceSweep[],
  index: number,
  measure: Measure,
): ComparisonRow[] {
  const ranked = [...provinces].sort((a, b) =>
    compareAmounts(takenOffOf(a, index), takenOffOf(b, index)),
  );
  const rows = ranked.map((province) => ({
    slug: province.slug,
    value: figureOf(province, index, measure),
    unit: measure === 'averageRate' ? province.rateUnit : province.unit,
  }));
  const longest = rows.reduce(
    (most, row) => (compareAmounts(row.value, most) > 0 ? row.value : most),
    '0',
  );
  return rows.map((row) => ({
    ...row,
    width:
      compareAmounts(row.value, '0') <= 0
        ? '0.0'
        : scalePosition(row.value, '0', longest, 0, 100),
  }));
}
