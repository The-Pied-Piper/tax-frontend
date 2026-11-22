import { readEngineFigures } from './read';
import { responseChecker } from './openApiCheck';
import { provinces, salaries } from '../salaryPages/provinces';
import { engineOf } from '../../src/test/generatedSite';
import compute70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const saved = compute70000 as ComputeTakeHomeCalculationResponse;

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
        take_home: '900.00',
        average_income_tax_rate: '0.0100',
        marginal_income_tax_rate: '0.0505',
      },
    ],
    sweep_units: {
      unit: sweepUnit,
      average_income_tax_rate: saved.average_income_tax_rate.unit,
      marginal_income_tax_rate: saved.marginal_income_tax_rate.unit,
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
  },
);
