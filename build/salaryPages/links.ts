import type { SalaryPageLinks } from '../../src/state/useTakeHome';
import { pagePath } from './address';

/** How many of a province's other pages one page lists. */
export const OTHERS_LIMIT = 6;

/** The calculator's address. */
const CALCULATOR = '/';

/**
 * The links of one salary page: its neighbours, the calculator and the nearest
 * other pages. `salaries` are the pages of the province that will be written,
 * lowest first, so nothing links to a page that does not exist.
 */
export function salaryLinks(
  slug: string,
  salaries: string[],
  salary: string,
): SalaryPageLinks {
  const index = salaries.indexOf(salary);
  if (index < 0) {
    throw new Error(`Salary ${salary} is not one of the pages of ${slug}`);
  }
  const link = (other: string) => ({
    salary: other,
    href: pagePath(slug, other),
  });
  const before = salaries[index - 1];
  const after = salaries[index + 1];
  const others = salaries
    .map((other, at) => ({ other, at, distance: Math.abs(at - index) }))
    .filter(({ at }) => at !== index)
    .sort((a, b) => a.distance - b.distance || a.at - b.at)
    .slice(0, OTHERS_LIMIT)
    .map(({ other }) => link(other));
  return {
    calculator: CALCULATOR,
    previous: before === undefined ? null : link(before),
    next: after === undefined ? null : link(after),
    others,
  };
}
