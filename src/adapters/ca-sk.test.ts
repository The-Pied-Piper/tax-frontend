import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture2025 from '../api/fixtures/compute-sk-2025-70000.json';
import fixture2026 from '../api/fixtures/compute-sk-2026-70000.json';
import { strings } from '../strings';
import { cad, months } from '../test/units';
import { adapters } from './index';
import { caSkAdapter } from './ca-sk';

// Saved responses from the running service for $70,000 in 2025 and 2026.
const r2025 = fixture2025 as ComputeTakeHomeCalculationResponse;
const r2026 = fixture2026 as ComputeTakeHomeCalculationResponse;

function figures(response: ComputeTakeHomeCalculationResponse) {
  const result = caSkAdapter.adapt(response);
  return [...result.rows, ...result.totals].map((r) => [r.id, r.amount]);
}

describe('Saskatchewan adapter', () => {
  it('is registered for CA-SK in 2025 and 2026', () => {
    expect(adapters.find('CA-SK', 2025)?.jurisdictionCode).toBe('CA-SK');
    expect(adapters.find('CA-SK', 2026)?.jurisdictionCode).toBe('CA-SK');
  });

  it('shows the engine figures for $70,000 in 2025', () => {
    expect(figures(r2025)).toEqual([
      ['cpp', '3956.75'],
      ['cpp2', '0.00'],
      ['ei', '1077.48'],
      ['federal-tax', '7585.64'],
      ['saskatchewan-tax', '5092.30'],
      ['total-tax', '12677.94'],
      ['total-taken-off', '17712.17'],
    ]);
  });

  it('shows the engine figures for $70,000 in 2026', () => {
    expect(figures(r2026)).toEqual([
      ['cpp', '3956.75'],
      ['cpp2', '0.00'],
      ['ei', '1123.07'],
      ['federal-tax', '7278.19'],
      ['saskatchewan-tax', '4972.68'],
      ['total-tax', '12250.87'],
      ['total-taken-off', '17330.69'],
    ]);
  });

  it('gives 5 rows and 2 totals, 7 in all, for both 2025 and 2026', () => {
    for (const response of [r2025, r2026]) {
      const result = caSkAdapter.adapt(response);
      expect(result.rows).toHaveLength(5);
      expect(result.totals).toHaveLength(2);
      expect([...result.rows, ...result.totals]).toHaveLength(7);
    }
  });

  it('lists rows under Pension, Employment Insurance and Income tax', () => {
    const result = caSkAdapter.adapt(r2025);
    expect(
      [...result.rows, ...result.totals].map((r) => [r.id, r.group]),
    ).toEqual([
      ['cpp', 'Pension'],
      ['cpp2', 'Pension'],
      ['ei', 'Employment Insurance'],
      ['federal-tax', 'Income tax'],
      ['saskatchewan-tax', 'Income tax'],
      ['total-tax', 'Income tax'],
      ['total-taken-off', undefined],
    ]);
  });

  it('gives every row help text and a unique id', () => {
    const result = caSkAdapter.adapt(r2025);
    const all = [...result.rows, ...result.totals];
    expect(all.every((r) => r.help.length > 0)).toBe(true);
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
  });

  it('keeps every numbered trace line in the advanced view', () => {
    const result = caSkAdapter.adapt(r2025);
    const numbered = (r2025.trace ?? [])
      .map((f) => ({
        form: f.form,
        lines: f.lines.filter((l) => (l.reference ?? '').trim() !== ''),
      }))
      .filter((f) => f.lines.length > 0);
    // A province's main form and its credits share one title and one group. Less the
    // 2 line(s) the credits part repeats from the main form: an input both read is listed once.
    const names = result.advanced.map((g) => g.name);
    expect(new Set(names).size).toBe(names.length);
    expect(result.advanced.flatMap((g) => g.lines)).toHaveLength(
      numbered.flatMap((f) => f.lines).length - 2,
    );
  });

  it.each([
    'schedule_8_cpp_base_contributions_on_return',
    'cpp_part_3_line_12',
    'cpp_part_3_line_22',
    'ei_premiums_line_88',
    'net_federal_tax',
    'sk428_saskatchewan_tax_line_82',
    'total_payable',
  ])('falls back to the advanced view when %s is missing', (missing) => {
    const trimmed: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.filter((l) => l.label !== missing),
      })),
    };
    const result = caSkAdapter.adapt(trimmed);
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
    const result = caSkAdapter.adapt(odd);
    expect(result.rows).toEqual([]);
    expect(result.advanced.length).toBeGreaterThan(0);
  });

  it('gives a row the unit of its own line, and null when the line has none', () => {
    const withUnit = (unit: typeof cad | null) => ({
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.map((l) =>
          l.label === 'sk428_saskatchewan_tax_line_82' ? { ...l, unit } : l,
        ),
      })),
    });
    const row = (u: typeof cad | null) =>
      caSkAdapter
        .adapt(withUnit(u) as ComputeTakeHomeCalculationResponse)
        .rows.find((r) => r.id === 'saskatchewan-tax');
    expect(row(months)?.unit).toEqual(months);
    expect(row(null)?.unit).toBeNull();
  });
});

describe('Saskatchewan adapter, help text', () => {
  const { cpp2, ...federal } = strings.adapters.caFederal;
  const { cpp2Zero, ...sk } = strings.adapters.caSk;
  // The second CPP help is built with Saskatchewan's own wording for a zero amount.
  const text = {
    ...federal,
    ...sk,
    cpp2: { name: cpp2.name, help: cpp2.help(cpp2Zero) },
  };

  /** Every string leaf of the Saskatchewan text, names and help alike. */
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
      text.saskatchewanTax,
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

  it('names Saskatchewan tax as Saskatchewan, and no other province', () => {
    expect(text.saskatchewanTax.name).toMatch(/Saskatchewan/);
    expect(text.saskatchewanTax.help).toMatch(/Saskatchewan/);
    for (const s of leaves(text)) {
      expect(s).not.toMatch(/Ontario/);
      expect(s).not.toMatch(/British Columbia/);
      expect(s).not.toMatch(/Manitoba/);
    }
  });
});
