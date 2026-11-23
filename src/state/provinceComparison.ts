import type { MoneyUnit } from '../money/format';
import { toPlainSalary, type Separators } from '../money/salaryInput';
import {
  compareAmounts,
  nearestAmountIndex,
  scalePosition,
} from '../money/scale';
import { SWEEP_COLUMN, type ProvinceSweep } from './hubCharts';

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

/**
 * Every province at one point of the sweep, highest figure first (provinces
 * with the same figure keep the order of the list). The longest bar is 100.
 */
export function comparisonRows(
  provinces: readonly ProvinceSweep[],
  index: number,
  measure: Measure,
): ComparisonRow[] {
  const rows = provinces.map((province) => ({
    slug: province.slug,
    value: province.points[index]?.[COLUMN[measure]] ?? '0',
    unit: measure === 'averageRate' ? province.rateUnit : province.unit,
  }));
  rows.sort((a, b) => compareAmounts(b.value, a.value));
  const longest = rows[0]?.value ?? '0';
  return rows.map((row) => ({
    ...row,
    width:
      compareAmounts(row.value, '0') <= 0
        ? '0.0'
        : scalePosition(row.value, '0', longest, 0, 100),
  }));
}
