import { readUnit } from '../../src/adapters/fallback';
import { sweepSalaries, type ProvinceSweep } from '../../src/state/hubCharts';
import { languageCode } from '../../src/strings';
import type { BuildApi } from './buildApi';
import { reason } from './buildApi';
import type { Province } from './provinces';

export type SweepOptions = {
  /** The build's one API client, so the sweep shares the salary pages' queue. */
  api: BuildApi;
  /** The provinces the API serves; the salary build has already failed or skipped the rest. */
  provinces: Province[];
};

/**
 * The salary sweep: for each province, one answer per salary of `sweepSalaries()`,
 * one call at a time, lowest salary first, never beside the salary pages. Only the
 * top-level figures are kept (no trace), as the API's text. The first failed call
 * fails the sweep, naming the province and salary; nothing is returned partly.
 */
export async function sweepProvinces(
  options: SweepOptions,
): Promise<ProvinceSweep[]> {
  const { api, provinces } = options;
  const salaries = sweepSalaries();
  const sweeps: ProvinceSweep[] = [];
  for (const province of provinces) {
    const points: ProvinceSweep['points'] = [];
    let first: {
      unit: ProvinceSweep['unit'];
      rateUnit: ProvinceSweep['rateUnit'];
      provisional: boolean;
    } | null = null;
    for (const salary of salaries) {
      try {
        const answer = await api.client.computeTakeHomeCalculation({
          jurisdiction_code: province.code,
          year: province.year,
          salary,
          language_code: languageCode,
          include_trace: false,
        });
        const unit = readUnit(answer.unit);
        const rateUnit = readUnit(answer.average_income_tax_rate.unit);
        if (!unit || !rateUnit) throw new Error('the answer has no unit');
        first ??= { unit, rateUnit, provisional: answer.provisional };
        points.push([
          answer.salary,
          answer.take_home,
          answer.total_deductions,
          answer.average_income_tax_rate.amount,
          answer.marginal_income_tax_rate.amount,
        ]);
      } catch (error) {
        throw new Error(
          `Salary sweep: ${province.slug}/${salary} failed: ${reason(error, api.attempts)}`,
          { cause: error },
        );
      }
    }
    if (!first) throw new Error(`Salary sweep: no answer for ${province.code}`);
    sweeps.push({
      slug: province.slug,
      year: province.year,
      ...first,
      points,
    });
  }
  return sweeps;
}
