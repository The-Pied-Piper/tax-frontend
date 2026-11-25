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
        average_rate: '0.1000',
        marginal_rate: '0.0505',
      },
    ],
    edges: [['20000', '20160', '20170', '0.2640']],
    facts: { surtax_first: '5818' },
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
        engine: '0.5.1',
        provinces: { 'CA-ON': { pages, ...extra } },
      }),
    );
    return file;
  }

  it('returns the answers by province and salary', () => {
    const answer = engineOf(saved);
    const figures = readEngineFigures(written({ '70000': answer }));
    expect(figures.engine).toBe('0.5.1');
    expect(figures.answers['CA-ON']?.['70000']).toEqual(answer);
  });

  it('returns the sweep of each province with its units', () => {
    const figures = readEngineFigures(written({ '70000': engineOf(saved) }));
    expect(figures.sweeps['CA-ON']?.points).toEqual(sweepFile.sweep);
    expect(figures.sweeps['CA-ON']?.edges).toEqual(sweepFile.edges);
    expect(figures.sweeps['CA-ON']?.facts).toEqual(sweepFile.facts);
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
    const noUnits = { ...sweepFile, sweep_units: undefined };
    expect(() => readEngineFigures(written(pages, noUnits))).toThrow(
      /CA-ON has no sweep units/,
    );
  });

  it('fails when the edges or the facts of a province are not whole', () => {
    const pages = { '70000': engineOf(saved) };
    expect(() =>
      readEngineFigures(written(pages, { ...sweepFile, edges: [['1', '2']] })),
    ).toThrow(/CA-ON has no valid edges/);
    expect(() =>
      readEngineFigures(written(pages, { ...sweepFile, facts: { a: 1 } })),
    ).toThrow(/CA-ON has no valid facts/);
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

    // The chart figures (tax-engine 0.5.1, 2026): the average and marginal rate are the engine's own, written to seven
    // places (the engine rounds to four, and a display of one decimal must round once; the pages' answers stay at four)
    // (income tax, CPP and EI line 16, no credits paid on filing counted; at $2,000 the engine reads the
    // marginal rate below the start of the EI band).
    it.each([
      ['2000.00', '0', '0', '2000.00'],
      ['3000.00', '0.0163', '0.0163', '2951.10'],
      ['38000.00', '0.1582839', '0.3607601', '31985.21'],
      ['70000.00', '0.231625', '0.3436053', '53786.25'],
      ['201200.00', '0.3445286', '0.7326453', '131880.84'],
    ])(
      'gives Ontario at %s the sweep figures',
      (salary, average, marginal, takeHome) => {
        const raw = JSON.parse(readFileSync(file, 'utf8')) as {
          provinces: Record<string, { sweep: Record<string, string>[] }>;
        };
        const point = raw.provinces['CA-ON']?.sweep.find(
          (entry) => entry.salary === salary,
        );
        expect(point?.average_rate).toBe(average);
        expect(point?.marginal_rate).toBe(marginal);
        expect(point?.take_home).toBe(takeHome);
      },
    );

    it('takes Employment Insurance from the EI form: nothing at $2,000, $1 at $2,001, the full premium from $2,034', () => {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as {
        provinces: Record<string, { sweep: Record<string, string>[] }>;
      };
      const ei = (salary: string): string | undefined => {
        const point = raw.provinces['CA-ON']?.sweep.find(
          (entry) => entry.salary === salary,
        );
        return point?.total_deductions;
      };
      expect(ei('2000.00')).toBe('0.00');
      expect(ei('2020.00')).toBe('20.00');
      expect(ei('2040.00')).toBe('33.25');
    });

    it('writes the changes of the Ontario marginal rate and the 2026 parameters the notes quote', () => {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as {
        provinces: Record<
          string,
          { edges: string[][]; facts: Record<string, string> }
        >;
      };
      const ontario = raw.provinces['CA-ON'];
      // The health premium band, and the first spike (settled, then first moving back).
      expect(
        ontario?.edges.find((edge) => edge[0] === '20000')?.slice(0, 3),
      ).toEqual(['20000', '20166', '20167']);
      // Exact to the dollar: the old rate holds to the second figure and the new one from the third.
      expect(ontario?.edges.map((edge) => edge[2])).toEqual(
        expect.arrayContaining(['25218', '48450', '72692', '201128']),
      );
      expect(ontario?.facts).toMatchObject({
        surtax_first: '5818',
        surtax_second: '7446',
        ei_band_end: '2033',
      });
    });

    it('holds the 323 hub-chart points of every province, $1,000 to $500,000 and the twenty-three extra salaries', () => {
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
        expect(sweep, province.code).toHaveLength(323);
        expect(sweep[0]?.salary).toBe('1000.00');
        expect(sweep[1]?.salary).toBe('1990.00');
        expect(sweep[322]?.salary).toBe('500000.00');
        expect(sweep_units).toBeDefined();
      }
    });
  },
);
