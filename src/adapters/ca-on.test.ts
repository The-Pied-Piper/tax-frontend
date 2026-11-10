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
  return [...result.rows, ...result.totals].map((r) => [r.name, r.amount]);
}

describe('Ontario adapter', () => {
  it('is registered for CA-ON in every year', () => {
    expect(adapters.find('CA-ON', 2025)).toBe(adapters.find('CA-ON', 2026));
    expect(adapters.find('CA-ON', 2025)).toBeDefined();
  });

  it('shows the engine figures for $70,000 in 2025', () => {
    expect(figures(r2025)).toEqual([
      ['Canada Pension Plan', '3956.75'],
      ['Employment Insurance', '1077.48'],
      ['Federal income tax', '7585.64'],
      ['Ontario income tax', '3911.45'],
      ['Total income tax', '11497.09'],
      ['Total taken off', '16531.32'],
    ]);
  });

  it('shows the engine figures for $70,000 in 2026', () => {
    expect(figures(r2026)).toEqual([
      ['Canada Pension Plan', '3956.75'],
      ['Employment Insurance', '1123.07'],
      ['Federal income tax', '7278.19'],
      ['Ontario income tax', '3855.74'],
      ['Total income tax', '11133.93'],
      ['Total taken off', '16213.75'],
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

  it('falls back to the advanced view when a needed label is missing', () => {
    const trimmed: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.filter((l) => l.label !== 'net_federal_tax'),
      })),
    };
    const result = caOnAdapter.adapt(trimmed);
    expect(result.rows).toEqual([]);
    expect(result.totals).toEqual([]);
    expect(result.advanced.length).toBeGreaterThan(0);
  });

  it('falls back when the response has no trace', () => {
    const noTrace: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: undefined,
    };
    expect(caOnAdapter.adapt(noTrace).rows).toEqual([]);
  });

  it('prefers display names from the API when present', () => {
    // The API will add `name`; the generated types do not have it yet.
    const trace = [
      {
        form: 'ca-on/on428',
        name: 'Ontario Tax',
        lines: [{ label: 'x_y', amount: '1.00', text: 't', name: 'X Why' }],
      },
    ];
    const named: ComputeTakeHomeCalculationResponse = { ...r2025, trace };
    const [group] = caOnAdapter.adapt(named).advanced;
    expect(group?.name).toBe('Ontario Tax');
    expect(group?.lines[0]?.label).toBe('X Why');
  });

  it('shows readable labels when the API sends no names', () => {
    const [group] = caOnAdapter.adapt(r2025).advanced;
    expect(group?.name).toBeUndefined();
    expect(group?.lines[0]?.label).not.toContain('_');
  });
});
