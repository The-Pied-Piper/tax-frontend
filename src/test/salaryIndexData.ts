// Test data only: nothing in the build imports this file. A small salary index
// for the component and App tests (the built one is covered by the build tests).
import { compute70000 } from './syntheticPages';
import type { SalaryIndex } from '../state/salaryIndex';

export const indexUnit = compute70000.unit;

function group(code: string, name: string, slug: string, salaries: number[]) {
  return {
    code,
    name,
    unit: indexUnit,
    pages: salaries.map((n) => ({
      salary: n.toString(),
      href: `/${slug}/${n.toString()}/`,
    })),
  };
}

const steps = Array.from({ length: 25 }, (_, i) => 30000 + i * 5000);

/** Ontario's 25 steps, as the build writes them. */
export const ontarioGroup = group('CA-ON', 'Ontario', 'ca-on', steps);
export const xlandGroup = group(
  'CA-XX',
  'Xland',
  'ca-xx',
  [10000, 15000, 20000],
);

export const ontarioIndex: SalaryIndex = { groups: [ontarioGroup] };
export const twoProvinceIndex: SalaryIndex = {
  groups: [ontarioGroup, xlandGroup],
};
/** An index with no group for Ontario. */
export const xlandOnlyIndex: SalaryIndex = { groups: [xlandGroup] };
