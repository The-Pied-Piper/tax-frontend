import type { Unit } from '../../src/adapters';
import type { ListJurisdictionsResponse } from '../../src/api';
import type { SalaryIndex } from '../../src/state/salaryIndex';
import { pagePath } from './address';
import type { Province } from './provinces';

/** What was built for one province: its salary steps, lowest first, and the unit of its answers. */
export type BuiltProvince = {
  province: Province;
  unit: Unit;
  salaries: string[];
};

/**
 * The links to every page that was built, by province, in the order given. A
 * province the API did not return, or with no pages, gets no group.
 */
export function salaryIndex(
  built: BuiltProvince[],
  jurisdictions: ListJurisdictionsResponse['jurisdictions'],
): SalaryIndex {
  return {
    groups: built.flatMap(({ province, unit, salaries }) => {
      const place = jurisdictions.find((j) => j.code === province.code);
      if (!place || salaries.length === 0) return [];
      return [
        {
          code: province.code,
          name: place.name,
          unit,
          pages: salaries.map((salary) => ({
            salary,
            href: pagePath(province.slug, salary),
          })),
        },
      ];
    }),
  };
}
