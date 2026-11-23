import { readEngineFigures } from './read';
import { responseChecker } from './openApiCheck';
import { provinces, salaries } from '../salaryPages/provinces';
import { engineOf } from '../../src/test/generatedSite';
import compute70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import computeAlberta from '../../src/api/fixtures/compute-ab-2026-70000.json';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The saved fixtures predate the `income_tax` field of the response (tax-service #83), which the
// spec now requires; the shape tests add it so they test the rest of the answer.
const saved = {
  ...(compute70000 as ComputeTakeHomeCalculationResponse),
  income_tax: '11133.93',
};

describe('the OpenAPI check', () => {
  const check = responseChecker();

  it('accepts a saved answer of the service', () => {
    expect(check(saved)).toEqual([]);
  });

  it('names what is wrong when a figure is missing', () => {
    expect(check({ ...saved, take_home: undefined }).join(' ')).toContain(
      'take_home',
    );
  });

  it('refuses a figure that is not text', () => {
    expect(check({ ...saved, take_home: 1 }).join(' ')).toContain('/take_home');
  });

  it('refuses a unit placement the spec does not list', () => {
    const unit = { ...saved.unit, placement: 'middle' };
    expect(check({ ...saved, unit }).join(' ')).toContain('/unit/placement');
  });
});

describe("reading the Python step's file", () => {
  const dir = mkdtempSync(join(tmpdir(), 'engine-figures-'));
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const sweepUnit = { ...saved.unit };
  const sweepFile = {
    sweep: [
      {
        salary: '1000.00',
        total_deductions: '100.00',
        income_tax: '40.00',
        take_home: '900.00',
        average_income_tax_rate: '0.0100',
        net_total: '100.00',
        net_average_rate: '0.1000',
        net_marginal_rate: '0.0505',
      },
    ],
    sweep_units: {
      unit: sweepUnit,
      average_income_tax_rate: saved.average_income_tax_rate.unit,
    },
  };

  function written(
    pages: Record<string, unknown>,
    extra: Record<string, unknown> = sweepFile,
  ): string {
    const file = join(
      dir,
      `figures-${Math.random().toString(36).slice(2)}.json`,
    );
    writeFileSync(
      file,
      JSON.stringify({
        engine: '0.4.1',
        provinces: { 'CA-ON': { pages, ...extra } },
      }),
    );
    return file;
  }

  it('returns the answers by province and salary', () => {
    const answer = engineOf(saved);
    const figures = readEngineFigures(written({ '70000': answer }));
    expect(figures.engine).toBe('0.4.1');
    expect(figures.answers['CA-ON']?.['70000']).toEqual(answer);
  });

  it('returns the sweep of each province with its units', () => {
    const figures = readEngineFigures(written({ '70000': engineOf(saved) }));
    expect(figures.sweeps['CA-ON']?.points).toEqual(sweepFile.sweep);
    expect(figures.sweeps['CA-ON']?.units.unit).toEqual(sweepUnit);
  });

  it('fails when a province has no sweep, a point is not text, or the units are missing', () => {
    const pages = { '70000': engineOf(saved) };
    expect(() => readEngineFigures(written(pages, {}))).toThrow(
      /CA-ON has no valid sweep/,
    );
    const bad = { ...sweepFile, sweep: [{ salary: 1000 }] };
    expect(() => readEngineFigures(written(pages, bad))).toThrow(
      /CA-ON has no valid sweep/,
    );
    const noUnits = { sweep: sweepFile.sweep };
    expect(() => readEngineFigures(written(pages, noUnits))).toThrow(
      /CA-ON has no sweep units/,
    );
  });

  it('fails, naming the page, when an answer does not fit the spec', () => {
    const answer = { ...engineOf(saved), total_deductions: 5 };
    expect(() => readEngineFigures(written({ '70000': answer }))).toThrow(
      /CA-ON\/70000 does not fit api\/openapi.yml.*total_deductions/,
    );
  });

  it("fails when the file is not there or not the step's", () => {
    expect(() => readEngineFigures(join(dir, 'missing.json'))).toThrow(
      /cannot read/,
    );
    const file = join(dir, 'other.json');
    writeFileSync(file, '[]');
    expect(() => readEngineFigures(file)).toThrow(/not what the Python step/);
  });
});

// Runs only where the Python step has run (CI's engine-figures job, or by hand):
// ENGINE_FIGURES_FILE names the file it wrote.
describe.runIf(process.env.ENGINE_FIGURES_FILE)(
  'the file the Python step wrote',
  () => {
    const file = process.env.ENGINE_FIGURES_FILE ?? '';

    it('has an answer that fits the spec for every page of every listed province', () => {
      const { answers } = readEngineFigures(file);
      for (const province of provinces) {
        for (const salary of salaries(province)) {
          const answer = answers[province.code]?.[salary.toString()];
          expect(answer, `${province.code}/${salary.toString()}`).toBeDefined();
          expect(answer?.salary).toBe(`${salary.toString()}.00`);
          expect(answer?.trace?.length).toBeGreaterThan(0);
        }
      }
    });

    // The figures that matter, pinned to the service's own saved answers for $70,000
    // (the fixtures at other salaries predate the line 43500 basis).
    it.each([
      ['CA-ON', compute70000],
      ['CA-AB', computeAlberta],
    ])('gives %s the same figures as the service at $70,000', (code, saved) => {
      const answer = readEngineFigures(file).answers[code]?.['70000'];
      const expected = engineOf(saved as ComputeTakeHomeCalculationResponse);
      expect(answer?.total_deductions).toBe(expected.total_deductions);
      expect(answer?.take_home).toBe(expected.take_home);
      // The income tax part alone (tax-service's `income_tax`): in cents, and part of the total.
      expect(answer?.income_tax).toMatch(/^\d+\.\d{2}$/);
      expect(answer?.unit).toEqual(expected.unit);
      expect(answer?.average_income_tax_rate).toEqual(
        expected.average_income_tax_rate,
      );
      expect(answer?.marginal_income_tax_rate).toEqual(
        expected.marginal_income_tax_rate,
      );
    });

    // The chart figures, pinned to the independent sweep of the hub-charts thread (tax-engine 0.4.1,
    // 2026): net_total is income tax plus CPP and EI less the credits paid on filing, net_marginal_rate
    // its change over the next $100 (or $10 near a narrow step).
    it.each([
      ['2000.00', '0.00', '0.0000', '1.0000'],
      ['3000.00', '48.90', '0.0163', '-0.2537'],
      ['38000.00', '5889.24', '0.1550', '0.5093'],
      ['70000.00', '16213.75', '0.2316', '0.3435'],
      ['201200.00', '69319.16', '0.3445', '0.7327'],
    ])(
      'gives Ontario at %s the sweep figures',
      (salary, total, average, marginal) => {
        const raw = JSON.parse(readFileSync(file, 'utf8')) as {
          provinces: Record<string, { sweep: Record<string, string>[] }>;
        };
        const point = raw.provinces['CA-ON']?.sweep.find(
          (entry) => entry.salary === salary,
        );
        expect(point?.net_total).toBe(total);
        expect(point?.net_average_rate).toBe(average);
        expect(point?.net_marginal_rate).toBe(marginal);
      },
    );

    it('holds the 307 hub-chart points of every province, $1,000 to $500,000 and the seven extra salaries', () => {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as {
        provinces: Record<
          string,
          { sweep: { salary: string }[]; sweep_units: unknown }
        >;
      };
      for (const province of provinces) {
        const { sweep, sweep_units } = raw.provinces[province.code] ?? {
          sweep: [],
          sweep_units: undefined,
        };
        expect(sweep, province.code).toHaveLength(307);
        expect(sweep[0]?.salary).toBe('1000.00');
        expect(sweep[1]?.salary).toBe('1990.00');
        expect(sweep[306]?.salary).toBe('500000.00');
        expect(sweep_units).toBeDefined();
      }
    });
  },
);
