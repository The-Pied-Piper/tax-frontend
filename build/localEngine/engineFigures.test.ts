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

  function written(pages: Record<string, unknown>): string {
    const file = join(
      dir,
      `figures-${Math.random().toString(36).slice(2)}.json`,
    );
    writeFileSync(
      file,
      JSON.stringify({ engine: '0.4.1', provinces: { 'CA-ON': { pages } } }),
    );
    return file;
  }

  it('returns the answers by province and salary', () => {
    const answer = engineOf(saved);
    const figures = readEngineFigures(written({ '70000': answer }));
    expect(figures.engine).toBe('0.4.1');
    expect(figures.answers['CA-ON']?.['70000']).toEqual(answer);
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

    it('holds the 300 hub-chart points of every province, $1,000 to $500,000', () => {
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
        expect(sweep, province.code).toHaveLength(300);
        expect(sweep[0]?.salary).toBe('1000.00');
        expect(sweep[249]?.salary).toBe('250000.00');
        expect(sweep[299]?.salary).toBe('500000.00');
        expect(sweep_units).toBeDefined();
      }
    });
  },
);
