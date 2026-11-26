import type { MoneyUnit } from '../money/format';
import { toPlainSalary, type Separators } from '../money/salaryInput';
import {
  compareAmounts,
  nearestAmountIndex,
  scalePosition,
} from '../money/scale';
import { regularIndexes, SWEEP_COLUMN, type ProvinceSweep } from './hubCharts';

/** What the bars show. */
export type Measure = 'takeHome' | 'incomeTax' | 'averageRate';

/** The measures in the order of the toggle. */
export const MEASURES: readonly Measure[] = [
  'takeHome',
  'incomeTax',
  'averageRate',
];

// Each measure's place in a sweep point.
const COLUMN = {
  takeHome: SWEEP_COLUMN.takeHome,
  incomeTax: SWEEP_COLUMN.tax,
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

/** True when no province has any income tax at one regular salary (the `index`th), so none ranks above another. */
export function allTied(
  provinces: readonly ProvinceSweep[],
  index: number,
): boolean {
  return provinces.every(
    (province) => compareAmounts(taxOf(province, index), '0') <= 0,
  );
}

/** A province's income tax at one regular salary (the `index`th): what every view is ranked by. */
function taxOf(province: ProvinceSweep, index: number): string {
  return figureOf(province, index, 'incomeTax');
}

/**
 * Every province at one regular salary of the sweep (the `index`th), lowest income tax first, whichever measure the
 * bars show, so switching the measure never reorders the list (provinces with the same tax keep the order of the list).
 * The longest bar is 100.
 */
export function comparisonRows(
  provinces: readonly ProvinceSweep[],
  index: number,
  measure: Measure,
): ComparisonRow[] {
  const ranked = [...provinces].sort((a, b) =>
    compareAmounts(taxOf(a, index), taxOf(b, index)),
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
