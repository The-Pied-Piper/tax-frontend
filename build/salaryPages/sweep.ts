import type { ListJurisdictionsResponse } from '../../src/api';
import { readUnit } from '../../src/adapters/fallback';
import { sweepSalaries, type ProvinceSweep } from '../../src/state/hubCharts';
import { provisionalOf, type BuiltProvince } from './generate';
import type { EngineSweep } from '../localEngine/read';

/**
 * The hub-chart sweep of every province the salary build served, from the figures the
 * Python step wrote. `provisional` is the API list's, as for the pages. Nothing is
 * returned partly: a province whose sweep is missing, does not hold exactly the salaries
 * of `sweepSalaries()` in order, or whose units are not whole fails the build.
 */
export function provinceSweeps(
  sweeps: Record<string, EngineSweep>,
  built: BuiltProvince[],
  list: ListJurisdictionsResponse,
): ProvinceSweep[] {
  const expected = sweepSalaries();
  return built.map(({ province }) => {
    const sweep = sweeps[province.code];
    if (!sweep) {
      throw new Error(`Salary sweep: no figures for ${province.code}`);
    }
    const provisional = provisionalOf(list, province);
    if (provisional === undefined) {
      throw new Error(
        `Salary sweep: the API does not list ${province.code} for ${province.year.toString()}`,
      );
    }
    // The salary is a quantized amount, so $1,000 is "1000.00".
    const salaries = sweep.points.map((point) => point.salary);
    if (
      salaries.length !== expected.length ||
      salaries.some((salary, at) => salary !== `${expected[at] ?? ''}.00`)
    ) {
      throw new Error(
        `Salary sweep: ${province.code} does not hold the sweep salaries`,
      );
    }
    const unit = readUnit(sweep.units.unit);
    const rateUnit = readUnit(sweep.units.average_income_tax_rate);
    if (!unit || !rateUnit) {
      throw new Error(`Salary sweep: ${province.code} has no whole units`);
    }
    return {
      slug: province.slug,
      year: province.year,
      provisional,
      unit,
      rateUnit,
      points: sweep.points.map((point) => [
        point.salary,
        point.take_home,
        point.total_deductions,
        point.income_tax,
        point.average_income_tax_rate,
        point.net_marginal_rate,
        point.net_total,
        point.net_average_rate,
      ]),
    };
  });
}
