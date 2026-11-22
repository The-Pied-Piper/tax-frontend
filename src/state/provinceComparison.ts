import type { MoneyUnit } from '../money/format';
import { toPlainSalary, type Separators } from '../money/salaryInput';
import { compareAmounts, nearestIndex, scalePosition } from '../money/scale';
import type { ProvinceSweep } from './hubCharts';

/** What the bars show. */
export type Measure = 'takeHome' | 'incomeTax' | 'averageRate';

/** The measures in the order of the toggle. */
export const MEASURES: readonly Measure[] = [
  'takeHome',
  'incomeTax',
  'averageRate',
];

// Each measure's place in a sweep point.
const COLUMN = { takeHome: 1, incomeTax: 3, averageRate: 4 } as const;

/** The salary the comparison starts at. */
export const DEFAULT_SALARY = '70000';

// Salaries are laid on a long axis only to find the nearest one. Over a sweep
// ending at $500,000, a position (kept to a tenth) is worth half a cent, so
// two salaries a cent apart never share one and a tie is a true tie.
const AXIS = 10000000;

function position(salary: string, last: string): string {
  return scalePosition(salary, '0', last, 0, AXIS);
}

/** The index of the point nearest `salary` (the lower one on a tie). */
export function nearestSalaryIndex(
  salaries: readonly string[],
  salary: string,
): number {
  const last = salaries[salaries.length - 1] ?? '1';
  return nearestIndex(
    salaries.map((point) => position(point, last)),
    position(salary, last),
  );
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
  const plain = toPlainSalary(typed, separators);
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
