import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture2025 from '../api/fixtures/compute-on-2025-70000.json';
import fixture2025High from '../api/fixtures/compute-on-2025-90000.json';
import fixture2026 from '../api/fixtures/compute-on-2026-70000.json';
import { sumAmounts } from '../money/sum';
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
});
