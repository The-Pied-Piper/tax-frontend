// Test data only: nothing in the build imports this file.
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixture70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { provinces, salaries } from './provinces';

export const compute70000 = fixture70000 as ComputeTakeHomeCalculationResponse;

/** A page's data for the real saved response of that salary. */
export function pageData(
  response: ComputeTakeHomeCalculationResponse,
  salary: string,
): SalaryPageData {
  return {
    jurisdictions: jurisdictions.jurisdictions,
    response,
    jurisdictionCode: 'CA-ON',
    year: 2026,
    salary,
  };
}

/**
 * SYNTHETIC test data, not engine output. The saved $70,000 response with only
 * `salary` and `take_home` replaced, so 25 pages differ in the way real pages
 * do. The take_home text is a stand-in (whole-dollar step minus 16,214, then
 * ".25"), chosen only to be distinct per salary. Every other field, including
 * both rates, is the real saved one.
 */
export function syntheticResponse(
  salary: number,
): ComputeTakeHomeCalculationResponse {
  return {
    ...compute70000,
    salary: `${salary.toString()}.00`,
    take_home: `${(salary - 16214).toString()}.25`,
  };
}

/** One synthetic page per Ontario salary step (25 of them). */
export function syntheticOntarioPages(): SalaryPageData[] {
  const ontario = provinces.find((p) => p.code === 'CA-ON');
  if (!ontario) throw new Error('Ontario is not in the province list');
  return salaries(ontario).map((n) =>
    pageData(syntheticResponse(n), n.toString()),
  );
}

/** The values that appear more than once, so a duplicate can be named. */
export function duplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i);
}
