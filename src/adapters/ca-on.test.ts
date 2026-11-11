import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture2025 from '../api/fixtures/compute-on-2025-70000.json';
import fixture2026 from '../api/fixtures/compute-on-2026-70000.json';
import { adapters } from './index';
import { caOnAdapter } from './ca-on';

const r2025 = fixture2025 as ComputeTakeHomeCalculationResponse;
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
      ['ei', '1077.48'],
      ['federal-tax', '7585.64'],
      ['ontario-tax', '3911.45'],
      ['total-tax', '11497.09'],
      ['total-taken-off', '16531.32'],
    ]);
  });

  it('shows the engine figures for $70,000 in 2026', () => {
    expect(figures(r2026)).toEqual([
      ['cpp', '3956.75'],
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

  it('keeps every trace line in the advanced view', () => {
    const result = caOnAdapter.adapt(r2025);
    expect(result.advanced.map((g) => g.form)).toEqual(
      (r2025.trace ?? []).map((f) => f.form),
    );
    expect(result.advanced.flatMap((g) => g.lines)).toHaveLength(
      (r2025.trace ?? []).flatMap((f) => f.lines).length,
    );
  });

  it.each([
    'schedule_8_cpp_base_contributions_on_return',
    'schedule_8_cpp_enhanced_contributions_on_return',
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

  it('falls back when the response has no trace', () => {
    const noTrace: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: undefined,
    };
    expect(caOnAdapter.adapt(noTrace).rows).toEqual([]);
  });

  it('shows readable labels in the advanced view', () => {
    const groups = caOnAdapter.adapt(r2025).advanced;
    expect(
      groups.flatMap((g) => g.lines).every((l) => !l.label.includes('_')),
    ).toBe(true);
  });
});
