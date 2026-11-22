import config from './provinces.json';

/** The tax year of every pre-built page: the one build setting. Change it each January. */
export const TAX_YEAR = config.year;

export type Province = {
  /** The API's jurisdiction code. */
  code: string;
  /** The first part of the page address. */
  slug: string;
  year: number;
  from: number;
  to: number;
  step: number;
};

/** What the Python step also reads, so the two never disagree on who is built: the year, the provinces and the hub-chart salary steps. */
export type SweepSteps = {
  first: number;
  fineStep: number;
  fineTo: number;
  coarseStep: number;
  to: number;
};

/** One entry per province (build/salaryPages/provinces.json, which the Python step reads too). A province the API does not return fails a build with a site URL and is skipped without one. */
export const provinces: Province[] = config.provinces.map((p) => ({
  ...p,
  year: TAX_YEAR,
}));

export const sweepSteps: SweepSteps = config.sweep;

export function salaries(province: Province): number[] {
  const { code, from, to, step } = province;
  if (!(step > 0) || from > to) {
    throw new Error(
      `Province ${code}: step must be above 0 and from must not exceed to (from ${from.toString()}, to ${to.toString()}, step ${step.toString()})`,
    );
  }
  const steps: number[] = [];
  for (let n = province.from; n <= province.to; n += province.step) {
    steps.push(n);
  }
  return steps;
}
