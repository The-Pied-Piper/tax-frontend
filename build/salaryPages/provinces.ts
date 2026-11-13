/** The tax year of every pre-built page: the one build setting. Change it each January. */
export const TAX_YEAR = 2026;

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

/** One entry per province. A province the API does not return yet gets no pages. */
export const provinces: Province[] = [
  {
    code: 'CA-ON',
    slug: 'ca-on',
    year: TAX_YEAR,
    from: 30000,
    to: 150000,
    step: 5000,
  },
  {
    code: 'CA-AB',
    slug: 'ca-ab',
    year: TAX_YEAR,
    from: 30000,
    to: 150000,
    step: 5000,
  },
];

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
