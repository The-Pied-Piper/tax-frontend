import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture2025 from '../api/fixtures/compute-on-2025-70000.json';
import fixture2025High from '../api/fixtures/compute-on-2025-90000.json';
import fixture2026 from '../api/fixtures/compute-on-2026-70000.json';
import { sumAmounts } from '../money/sum';
import { cad, months } from '../test/units';
import { adapters } from './index';
import { caOnAdapter } from './ca-on';

const r2025 = fixture2025 as ComputeTakeHomeCalculationResponse;
const r2025High = fixture2025High as ComputeTakeHomeCalculationResponse;
const r2026 = fixture2026 as ComputeTakeHomeCalculationResponse;

function figures(response: ComputeTakeHomeCalculationResponse) {
  const result = caOnAdapter.adapt(response);
  return [...result.rows, ...result.totals].map((r) => [r.id, r.amount]);
}

describe('Ontario adapter', () => {
  it('is registered for CA-ON in every year', () => {
    expect(adapters.find('CA-ON', 2025)).toBe(adapters.find('CA-ON', 2026));
    expect(adapters.find('CA-ON', 2025)).toBeDefined();
  });

  it('shows the engine figures for $70,000 in 2025', () => {
    expect(figures(r2025)).toEqual([
      ['cpp', '3956.75'],
      ['cpp2', '0.00'],
      ['ei', '1077.48'],
      ['federal-tax', '7585.64'],
      ['ontario-tax', '3911.45'],
      ['total-tax', '11497.09'],
      ['total-taken-off', '16531.32'],
    ]);
  });

  it('shows CPP2 as its own row above the ceiling, $90,000 in 2025', () => {
    expect(figures(r2025High)).toEqual([
      ['cpp', '4034.10'],
      ['cpp2', '396.00'],
      ['ei', '1077.48'],
      ['federal-tax', '11592.47'],
      ['ontario-tax', '5850.78'],
      ['total-tax', '17443.25'],
      ['total-taken-off', '22950.83'],
    ]);
  });

  it('shows the engine figures for $70,000 in 2026', () => {
    expect(figures(r2026)).toEqual([
      ['cpp', '3956.75'],
      ['cpp2', '0.00'],
      ['ei', '1123.07'],
      ['federal-tax', '7278.19'],
      ['ontario-tax', '3855.74'],
      ['total-tax', '11133.93'],
      ['total-taken-off', '16213.75'],
    ]);
  });

  it('lists rows under Pension, Employment Insurance and Income tax', () => {
    const result = caOnAdapter.adapt(r2025);
    expect(
      [...result.rows, ...result.totals].map((r) => [r.id, r.group]),
    ).toEqual([
      ['cpp', 'Pension'],
      ['cpp2', 'Pension'],
      ['ei', 'Employment Insurance'],
      ['federal-tax', 'Income tax'],
      ['ontario-tax', 'Income tax'],
      ['total-tax', 'Income tax'],
      ['total-taken-off', undefined],
    ]);
  });

  it('gives every row help text and a unique id', () => {
    const result = caOnAdapter.adapt(r2025);
    const all = [...result.rows, ...result.totals];
    expect(all.every((r) => r.help.length > 0)).toBe(true);
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
  });

  it('keeps every numbered trace line in the advanced view', () => {
    const result = caOnAdapter.adapt(r2025);
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
    'on428_ontario_tax_line_90',
    'total_payable',
  ])('falls back to the advanced view when %s is missing', (missing) => {
    const trimmed: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.filter((l) => l.label !== missing),
      })),
    };
    const result = caOnAdapter.adapt(trimmed);
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
    const result = caOnAdapter.adapt(odd);
    expect(result.rows).toEqual([]);
    expect(result.advanced.length).toBeGreaterThan(0);
  });

  it.each(['cpp_part_3_line_12', 'cpp_part_3_line_22'])(
    'falls back when %s is not a money amount',
    (label) => {
      const odd: ComputeTakeHomeCalculationResponse = {
        ...r2025High,
        trace: (r2025High.trace ?? []).map((f) => ({
          ...f,
          lines: f.lines.map((l) =>
            l.label === label ? { ...l, amount: '396.005' } : l,
          ),
        })),
      };
      const result = caOnAdapter.adapt(odd);
      expect(result.rows).toEqual([]);
      expect(result.advanced.length).toBeGreaterThan(0);
    },
  );

  it.each([
    ['2025 at $70,000', r2025],
    ['2025 at $90,000', r2025High],
    ['2026 at $70,000', r2026],
  ])('rows add up to Total taken off, %s', (_name, response) => {
    const result = caOnAdapter.adapt(response);
    const parts = result.rows
      .filter((r) => r.id !== 'federal-tax' && r.id !== 'ontario-tax')
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
    expect(caOnAdapter.adapt(noTrace).rows).toEqual([]);
  });

  it('shows only numbered lines in the advanced view, none with an id as label', () => {
    const groups = caOnAdapter.adapt(r2025).advanced;
    const lines = groups.flatMap((g) => g.lines);
    expect(lines.every((l) => l.reference !== null)).toBe(true);
    expect(lines.every((l) => !l.label.includes('_'))).toBe(true);
    expect(groups.every((g) => g.lines.length > 0)).toBe(true);
    const line2 = groups
      .find((g) => g.form === 'ca/schedule_8')
      ?.lines.find((l) => l.reference === '2');
    expect(line2?.label).toBe('Line 2');
    expect(line2?.detail).toMatch(/^cpp_part_3_line_2:/);
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
      const result = caOnAdapter.adapt(r2025);
      const rows = [...result.rows, ...result.totals];
      expect(rows.map((r) => [r.id, r.unit?.name, r.unit?.singular])).toEqual(
        rows.map((r) => [r.id, 'ca/cad', 'CA$']),
      );
    });

    it('carries the response unit on the result', () => {
      expect(caOnAdapter.adapt(r2025).unit).toEqual(r2025.unit);
      expect(caOnAdapter.adapt({ ...r2025, unit: months }).unit).toEqual(
        months,
      );
    });

    it('takes the unit of Total taken off from the response, not from a line', () => {
      const result = caOnAdapter.adapt({ ...r2025, unit: months });
      const total = result.totals.find((r) => r.id === 'total-taken-off');
      expect(total?.unit).toEqual(months);
      expect(result.rows.find((r) => r.id === 'ei')?.unit).toEqual(cad);
    });

    it('gives a row the unit of its own line', () => {
      const result = caOnAdapter.adapt(
        withLineUnit(r2025, 'ei_premiums_line_88', months),
      );
      expect(result.rows.find((r) => r.id === 'ei')?.unit).toEqual(months);
      expect(result.rows.find((r) => r.id === 'cpp')?.unit).toEqual(cad);
    });

    it('gives a row null when its line has no unit', () => {
      const result = caOnAdapter.adapt(
        withLineUnit(r2025, 'ei_premiums_line_88', null),
      );
      expect(result.rows.find((r) => r.id === 'ei')?.unit).toBeNull();
      const absent = caOnAdapter.adapt(
        withLineUnit(r2025, 'net_federal_tax', undefined),
      );
      expect(absent.rows.find((r) => r.id === 'federal-tax')?.unit).toBeNull();
    });

    it('sums the two CPP lines when they share a unit', () => {
      const result = caOnAdapter.adapt(r2025);
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
        const result = caOnAdapter.adapt(
          withLineUnit(r2025, label, { ...cad, name: 'other/unit' }),
        );
        expect(result.rows).toEqual([]);
        expect(result.totals).toEqual([]);
        expect(result.advanced.length).toBeGreaterThan(0);
        expect(result.unit).toEqual(r2025.unit);
      },
    );

    it('keeps the unit of every advanced line, null where the API sent none', () => {
      const result = caOnAdapter.adapt(
        withLineUnit(r2025, 'cpp_part_3_line_2', null),
      );
      const lines = result.advanced.flatMap((g) => g.lines);
      const line2 = result.advanced
        .find((g) => g.form === 'ca/schedule_8')
        ?.lines.find((l) => l.reference === '2');
      expect(line2?.unit).toBeNull();
      expect(lines.filter((l) => l.unit === null)).toHaveLength(1);
      expect(lines.filter((l) => l.unit?.name === 'ca/cad')).toHaveLength(
        lines.length - 1,
      );
    });

    it('still adapts a response with no unit on any line', () => {
      const bare: ComputeTakeHomeCalculationResponse = {
        ...r2025,
        trace: (r2025.trace ?? []).map((f) => ({
          ...f,
          lines: f.lines.map((l) => ({ ...l, unit: undefined })),
        })),
      };
      const result = caOnAdapter.adapt(bare);
      expect(result.rows.map((r) => r.unit)).toEqual([
        null,
        null,
        null,
        null,
        null,
      ]);
      expect(
        result.advanced.flatMap((g) => g.lines).every((l) => l.unit === null),
      ).toBe(true);
      expect(
        result.totals.find((r) => r.id === 'total-taken-off')?.unit,
      ).toEqual(cad);
    });
  });
});
