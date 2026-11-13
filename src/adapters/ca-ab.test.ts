import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture2025 from '../api/fixtures/compute-ab-2025-70000.json';
import fixture2026 from '../api/fixtures/compute-ab-2026-70000.json';
import { sumAmounts } from '../money/sum';
import { strings } from '../strings';
import { cad, months } from '../test/units';
import { adapters } from './index';
import { caAbAdapter } from './ca-ab';

const r2025 = fixture2025 as ComputeTakeHomeCalculationResponse;
const r2026 = fixture2026 as ComputeTakeHomeCalculationResponse;

function figures(response: ComputeTakeHomeCalculationResponse) {
  const result = caAbAdapter.adapt(response);
  return [...result.rows, ...result.totals].map((r) => [r.id, r.amount]);
}

describe('Alberta adapter', () => {
  it('is registered for CA-AB in every year', () => {
    expect(adapters.find('CA-AB', 2025)).toBe(adapters.find('CA-AB', 2026));
    expect(adapters.find('CA-AB', 2025)).toBeDefined();
  });

  it('shows the engine figures for $70,000 in 2025', () => {
    expect(figures(r2025)).toEqual([
      ['cpp', '3956.75'],
      ['cpp2', '0.00'],
      ['ei', '1077.48'],
      ['federal-tax', '7585.64'],
      ['alberta-tax', '3598.12'],
      ['total-tax', '11183.76'],
      ['total-taken-off', '16217.99'],
    ]);
  });

  it('shows the engine figures for $70,000 in 2026', () => {
    expect(figures(r2026)).toEqual([
      ['cpp', '3956.75'],
      ['cpp2', '0.00'],
      ['ei', '1123.07'],
      ['federal-tax', '7278.19'],
      ['alberta-tax', '3534.79'],
      ['total-tax', '10812.98'],
      ['total-taken-off', '15892.80'],
    ]);
  });

  it('lists rows under Pension, Employment Insurance and Income tax', () => {
    const result = caAbAdapter.adapt(r2025);
    expect(
      [...result.rows, ...result.totals].map((r) => [r.id, r.group]),
    ).toEqual([
      ['cpp', 'Pension'],
      ['cpp2', 'Pension'],
      ['ei', 'Employment Insurance'],
      ['federal-tax', 'Income tax'],
      ['alberta-tax', 'Income tax'],
      ['total-tax', 'Income tax'],
      ['total-taken-off', undefined],
    ]);
  });

  it('gives every row help text and a unique id', () => {
    const result = caAbAdapter.adapt(r2025);
    const all = [...result.rows, ...result.totals];
    expect(all.every((r) => r.help.length > 0)).toBe(true);
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
  });

  it('keeps every numbered trace line in the advanced view', () => {
    const result = caAbAdapter.adapt(r2025);
    const numbered = (r2025.trace ?? [])
      .map((f) => ({
        form: f.form,
        lines: f.lines.filter((l) => (l.reference ?? '').trim() !== ''),
      }))
      .filter((f) => f.lines.length > 0);
    expect(result.advanced.map((g) => g.form)).toEqual(
      numbered.map((f) => f.form),
    );
    expect(result.advanced.flatMap((g) => g.lines)).toHaveLength(
      numbered.flatMap((f) => f.lines).length,
    );
  });

  it.each([
    'schedule_8_cpp_base_contributions_on_return',
    'cpp_part_3_line_12',
    'cpp_part_3_line_22',
    'ei_premiums_line_88',
    'net_federal_tax',
    'ab428_alberta_tax_line_75',
    'total_payable',
  ])('falls back to the advanced view when %s is missing', (missing) => {
    const trimmed: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.filter((l) => l.label !== missing),
      })),
    };
    const result = caAbAdapter.adapt(trimmed);
    expect(result.rows).toEqual([]);
    expect(result.totals).toEqual([]);
    expect(result.advanced.length).toBeGreaterThan(0);
  });

  it('falls back instead of throwing when a CPP amount is not a money amount', () => {
    const odd: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.map((l) =>
          l.label === 'schedule_8_cpp_base_contributions_on_return'
            ? { ...l, amount: '3291.755' }
            : l,
        ),
      })),
    };
    const result = caAbAdapter.adapt(odd);
    expect(result.rows).toEqual([]);
    expect(result.advanced.length).toBeGreaterThan(0);
  });

  it.each(['cpp_part_3_line_12', 'cpp_part_3_line_22'])(
    'falls back when %s is not a money amount',
    (label) => {
      const odd: ComputeTakeHomeCalculationResponse = {
        ...r2025,
        trace: (r2025.trace ?? []).map((f) => ({
          ...f,
          lines: f.lines.map((l) =>
            l.label === label ? { ...l, amount: '665.005' } : l,
          ),
        })),
      };
      const result = caAbAdapter.adapt(odd);
      expect(result.rows).toEqual([]);
      expect(result.advanced.length).toBeGreaterThan(0);
    },
  );

  it.each([
    ['2025 at $70,000', r2025],
    ['2026 at $70,000', r2026],
  ])('rows add up to Total taken off, %s', (_name, response) => {
    const result = caAbAdapter.adapt(response);
    const parts = result.rows
      .filter((r) => r.id !== 'federal-tax' && r.id !== 'alberta-tax')
      .map((r) => r.amount);
    const totalTax = result.totals.find((r) => r.id === 'total-tax');
    expect(sumAmounts([...parts, totalTax?.amount ?? 'missing'])).toBe(
      response.total_deductions,
    );
  });

  it('falls back when the response has no trace', () => {
    const noTrace: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: undefined,
    };
    expect(caAbAdapter.adapt(noTrace).rows).toEqual([]);
  });

  it('shows only numbered lines in the advanced view, none with an id as label', () => {
    const groups = caAbAdapter.adapt(r2025).advanced;
    const lines = groups.flatMap((g) => g.lines);
    expect(lines.every((l) => l.reference !== null)).toBe(true);
    expect(lines.every((l) => !l.label.includes('_'))).toBe(true);
    expect(groups.every((g) => g.lines.length > 0)).toBe(true);
    const line2 = groups
      .find((g) => g.form === 'ca/schedule_8')
      ?.lines.find((l) => l.reference === '2');
    expect(line2?.label).toBe('Line 2');
  });

  describe('units', () => {
    function withLineUnit(
      response: ComputeTakeHomeCalculationResponse,
      label: string,
      unit: ComputeTakeHomeCalculationResponse['unit'] | null | undefined,
    ): ComputeTakeHomeCalculationResponse {
      return {
        ...response,
        trace: (response.trace ?? []).map((f) => ({
          ...f,
          lines: f.lines.map((l) => (l.label === label ? { ...l, unit } : l)),
        })),
      };
    }

    it('gives every row the unit of the line it was read from', () => {
      const result = caAbAdapter.adapt(r2025);
      const rows = [...result.rows, ...result.totals];
      expect(rows.map((r) => [r.id, r.unit?.name, r.unit?.singular])).toEqual(
        rows.map((r) => [r.id, 'ca/cad', 'CA$']),
      );
    });

    it('carries the response unit on the result', () => {
      expect(caAbAdapter.adapt(r2025).unit).toEqual(r2025.unit);
      expect(caAbAdapter.adapt({ ...r2025, unit: months }).unit).toEqual(
        months,
      );
    });

    it('takes the unit of Total taken off from the response, not from a line', () => {
      const result = caAbAdapter.adapt({ ...r2025, unit: months });
      const total = result.totals.find((r) => r.id === 'total-taken-off');
      expect(total?.unit).toEqual(months);
      expect(result.rows.find((r) => r.id === 'ei')?.unit).toEqual(cad);
    });

    it('gives a row the unit of its own line', () => {
      const result = caAbAdapter.adapt(
        withLineUnit(r2025, 'ab428_alberta_tax_line_75', months),
      );
      expect(result.rows.find((r) => r.id === 'alberta-tax')?.unit).toEqual(
        months,
      );
      expect(result.rows.find((r) => r.id === 'cpp')?.unit).toEqual(cad);
    });

    it('gives a row null when its line has no unit', () => {
      const result = caAbAdapter.adapt(
        withLineUnit(r2025, 'ab428_alberta_tax_line_75', null),
      );
      expect(result.rows.find((r) => r.id === 'alberta-tax')?.unit).toBeNull();
    });

    it('sums the two CPP lines when they share a unit', () => {
      const result = caAbAdapter.adapt(r2025);
      const cpp = result.rows.find((r) => r.id === 'cpp');
      expect(cpp?.amount).toBe('3956.75');
      expect(cpp?.unit).toEqual(cad);
    });

    it.each([
      'schedule_8_cpp_base_contributions_on_return',
      'cpp_part_3_line_12',
    ])(
      'falls back when the CPP lines have different unit names (%s changed)',
      (label) => {
        const result = caAbAdapter.adapt(
          withLineUnit(r2025, label, { ...cad, name: 'other/unit' }),
        );
        expect(result.rows).toEqual([]);
        expect(result.totals).toEqual([]);
        expect(result.advanced.length).toBeGreaterThan(0);
        expect(result.unit).toEqual(r2025.unit);
      },
    );

    it('still adapts a response with no unit on any line', () => {
      const bare: ComputeTakeHomeCalculationResponse = {
        ...r2025,
        trace: (r2025.trace ?? []).map((f) => ({
          ...f,
          lines: f.lines.map((l) => ({ ...l, unit: undefined })),
        })),
      };
      const result = caAbAdapter.adapt(bare);
      expect(result.rows.map((r) => r.unit)).toEqual([
        null,
        null,
        null,
        null,
        null,
      ]);
      expect(
        result.totals.find((r) => r.id === 'total-taken-off')?.unit,
      ).toEqual(cad);
    });
  });
});

describe('Alberta adapter, help text', () => {
  const text = strings.adapters.caAb;

  /** Every string leaf of the Alberta text, names and help alike. */
  function leaves(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (value !== null && typeof value === 'object') {
      return Object.values(value).flatMap(leaves);
    }
    return [];
  }

  it('has a non-empty help text for every row', () => {
    for (const row of [
      text.cpp,
      text.cpp2,
      text.ei,
      text.federalTax,
      text.albertaTax,
      text.totalTax,
      text.totalTakenOff,
    ]) {
      expect(row.help.length).toBeGreaterThan(0);
    }
  });

  it('makes no claim of a check against CRA, and no official status', () => {
    for (const s of leaves(text)) {
      expect(s).not.toMatch(/CRA/i);
      expect(s).not.toMatch(/checked/i);
      expect(s).not.toMatch(/official/i);
    }
  });

  it('carries no dollar sign and no digit, so no figure or rate', () => {
    for (const s of leaves(text)) {
      expect(s).not.toContain('$');
      expect(s).not.toMatch(/\d/);
    }
  });

  it('names Alberta tax as Alberta, not Ontario', () => {
    expect(text.albertaTax.name).toMatch(/Alberta/);
    expect(text.albertaTax.help).toMatch(/Alberta/);
    for (const s of leaves(text)) {
      expect(s).not.toMatch(/Ontario/);
    }
  });
});
