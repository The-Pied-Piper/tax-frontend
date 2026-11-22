import type { ListJurisdictionsResponse } from '../../src/api';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import fixture70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import { sweepSalaries } from '../../src/state/hubCharts';
import { provinces, sweepSteps } from './provinces';
import type { BuiltProvince } from './generate';
import type { EngineSweep } from '../localEngine/read';
import { provinceSweeps } from './sweep';

const saved = fixture70000 as ComputeTakeHomeCalculationResponse;
const list: ListJurisdictionsResponse = jurisdictions;
const [ontario, alberta] = provinces;
if (!ontario || !alberta) throw new Error('province list');
const builtOf = (...which: typeof provinces): BuiltProvince[] =>
  which.map((province) => ({ province, unit: saved.unit, salaries: [] }));

function sweepOf(): EngineSweep {
  return {
    points: sweepSalaries().map((salary) => ({
      salary: `${salary}.00`,
      total_deductions: `d${salary}`,
      take_home: `t${salary}`,
      average_income_tax_rate: '0.1000',
      marginal_income_tax_rate: '0.2000',
    })),
    units: {
      unit: { ...saved.unit, singular: 'CA$', plural: 'CA$' },
      average_income_tax_rate: saved.average_income_tax_rate.unit,
      marginal_income_tax_rate: saved.average_income_tax_rate.unit,
    },
  };
}

describe('the sweep steps of the Python step and of the charts', () => {
  it('are the same salaries: the one setting in provinces.json gives sweepSalaries()', () => {
    const { first, fineStep, fineTo, coarseStep, to } = sweepSteps;
    const steps: string[] = [];
    for (let n = first; n <= fineTo; n += fineStep) steps.push(n.toString());
    for (let n = fineTo + coarseStep; n <= to; n += coarseStep)
      steps.push(n.toString());
    expect(steps).toEqual(sweepSalaries());
  });
});

describe('provinceSweeps', () => {
  it('maps each served province to its points, with the list\'s provisional flag and "$" in the units', () => {
    const [sweep] = provinceSweeps(
      { 'CA-ON': sweepOf() },
      builtOf(ontario),
      list,
    );
    expect(sweep?.slug).toBe('ca-on');
    expect(sweep?.year).toBe(ontario.year);
    const expected = list.jurisdictions
      .find((j) => j.code === 'CA-ON')
      ?.years.find((y) => y.year === ontario.year)?.provisional;
    expect(sweep?.provisional).toBe(expected);
    expect(sweep?.unit.singular).toBe('$');
    expect(sweep?.points).toHaveLength(300);
    expect(sweep?.points[0]).toEqual([
      '1000.00',
      't1000',
      'd1000',
      '0.1000',
      '0.2000',
    ]);
  });

  it('sweeps only the provinces that were built', () => {
    const sweeps = provinceSweeps(
      { 'CA-ON': sweepOf(), 'CA-AB': sweepOf() },
      builtOf(ontario),
      list,
    );
    expect(sweeps.map((s) => s.slug)).toEqual(['ca-on']);
  });

  it('fails when a built province has no figures', () => {
    expect(() => provinceSweeps({}, builtOf(alberta), list)).toThrow(
      'Salary sweep: no figures for CA-AB',
    );
  });

  it('fails when the salaries are not the sweep salaries, in order', () => {
    const sweep = sweepOf();
    sweep.points.reverse();
    expect(() =>
      provinceSweeps({ 'CA-ON': sweep }, builtOf(ontario), list),
    ).toThrow('does not hold the sweep salaries');
    const short = { ...sweepOf(), points: sweepOf().points.slice(1) };
    expect(() =>
      provinceSweeps({ 'CA-ON': short }, builtOf(ontario), list),
    ).toThrow('does not hold the sweep salaries');
  });

  it('fails when the units are not whole or the two rates differ in unit', () => {
    const noUnit = { ...sweepOf(), units: { ...sweepOf().units, unit: {} } };
    expect(() =>
      provinceSweeps({ 'CA-ON': noUnit }, builtOf(ontario), list),
    ).toThrow('has no whole units');
    const differ = {
      ...sweepOf(),
      units: { ...sweepOf().units, marginal_income_tax_rate: saved.unit },
    };
    expect(() =>
      provinceSweeps({ 'CA-ON': differ }, builtOf(ontario), list),
    ).toThrow('has no whole units');
  });

  it('fails when the API does not list the province for the year', () => {
    const none = { jurisdictions: [] } as unknown as ListJurisdictionsResponse;
    expect(() =>
      provinceSweeps({ 'CA-ON': sweepOf() }, builtOf(ontario), none),
    ).toThrow('does not list CA-ON');
  });
});

// Runs only where the Python step has run (CI's engine-figures job, or by hand):
// ENGINE_FIGURES_FILE names the file it wrote.
describe.runIf(process.env.ENGINE_FIGURES_FILE)(
  'the sweep in the file the Python step wrote',
  () => {
    it('holds the sweep salaries for every listed province and fits the hub block cap', async () => {
      const { readEngineFigures } = await import('../localEngine/read');
      const { hubChartBlocks } = await import('../contentPages/hubs');
      const figures = readEngineFigures(process.env.ENGINE_FIGURES_FILE ?? '');
      const everyone = {
        jurisdictions: provinces.map((p) => ({
          code: p.code,
          name: p.code,
          years: [{ year: p.year, provisional: false }],
        })),
      } as unknown as ListJurisdictionsResponse;
      const sweeps = provinceSweeps(
        figures.sweeps,
        builtOf(...provinces),
        everyone,
      );
      expect(sweeps.map((s) => s.slug)).toEqual(provinces.map((p) => p.slug));
      for (const sweep of sweeps) expect(sweep.points).toHaveLength(300);
      expect(hubChartBlocks(sweeps).size).toBe(provinces.length);
    });
  },
);
