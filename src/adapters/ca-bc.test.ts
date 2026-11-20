import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture2025 from '../api/fixtures/compute-bc-2025-70000.json';
import { strings } from '../strings';
import { cad, months } from '../test/units';
import { adapters } from './index';
import { caBcAdapter } from './ca-bc';

// A saved response from the running service for $70,000 in 2025.
const r2025 = fixture2025 as ComputeTakeHomeCalculationResponse;

function figures(response: ComputeTakeHomeCalculationResponse) {
  const result = caBcAdapter.adapt(response);
  return [...result.rows, ...result.totals].map((r) => [r.id, r.amount]);
}

describe('British Columbia adapter', () => {
  it('is registered for CA-BC in 2025', () => {
    expect(adapters.find('CA-BC', 2025)?.jurisdictionCode).toBe('CA-BC');
  });

  it('shows the engine figures for $70,000 in 2025', () => {
    expect(figures(r2025)).toEqual([
      ['cpp', '3956.75'],
      ['cpp2', '0.00'],
      ['ei', '1077.48'],
      ['federal-tax', '7585.64'],
      ['british-columbia-tax', '3162.39'],
      ['total-tax', '10748.03'],
      ['total-taken-off', '15782.26'],
    ]);
  });

  it('lists rows under Pension, Employment Insurance and Income tax', () => {
    const result = caBcAdapter.adapt(r2025);
    expect(
      [...result.rows, ...result.totals].map((r) => [r.id, r.group]),
    ).toEqual([
      ['cpp', 'Pension'],
      ['cpp2', 'Pension'],
      ['ei', 'Employment Insurance'],
      ['federal-tax', 'Income tax'],
      ['british-columbia-tax', 'Income tax'],
      ['total-tax', 'Income tax'],
      ['total-taken-off', undefined],
    ]);
  });

  it('gives every row help text and a unique id', () => {
    const result = caBcAdapter.adapt(r2025);
    const all = [...result.rows, ...result.totals];
    expect(all.every((r) => r.help.length > 0)).toBe(true);
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
  });

  it('keeps every numbered trace line in the advanced view', () => {
    const result = caBcAdapter.adapt(r2025);
    const numbered = (r2025.trace ?? [])
      .map((f) => ({
        form: f.form,
        name: f.name,
        lines: f.lines.filter((l) => (l.reference ?? '').trim() !== ''),
      }))
      .filter((f) => f.lines.length > 0);
    // Groups are sorted by title; a title is listed once.
    expect(result.advanced.map((g) => g.name)).toEqual(
      [...new Set(numbered.map((f) => f.name))].sort((a, b) =>
        a.localeCompare(b, 'en'),
      ),
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
    'bc428_british_columbia_tax_line_91',
    'total_payable',
  ])('falls back to the advanced view when %s is missing', (missing) => {
    const trimmed: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.filter((l) => l.label !== missing),
      })),
    };
    const result = caBcAdapter.adapt(trimmed);
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
    const result = caBcAdapter.adapt(odd);
    expect(result.rows).toEqual([]);
    expect(result.advanced.length).toBeGreaterThan(0);
  });

  it('gives a row the unit of its own line, and null when the line has none', () => {
    const withUnit = (unit: typeof cad | null) => ({
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.map((l) =>
          l.label === 'bc428_british_columbia_tax_line_91' ? { ...l, unit } : l,
        ),
      })),
    });
    const row = (u: typeof cad | null) =>
      caBcAdapter
        .adapt(withUnit(u) as ComputeTakeHomeCalculationResponse)
        .rows.find((r) => r.id === 'british-columbia-tax');
    expect(row(months)?.unit).toEqual(months);
    expect(row(null)?.unit).toBeNull();
  });
});

describe('British Columbia adapter, help text', () => {
  const { cpp2, ...federal } = strings.adapters.caFederal;
  const { cpp2Zero, ...bc } = strings.adapters.caBc;
  // The second CPP help is built with British Columbia's own wording for a zero amount.
  const text = {
    ...federal,
    ...bc,
    cpp2: { name: cpp2.name, help: cpp2.help(cpp2Zero) },
  };

  /** Every string leaf of the British Columbia text, names and help alike. */
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
      text.britishColumbiaTax,
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

  it('names British Columbia tax as British Columbia, not Ontario', () => {
    expect(text.britishColumbiaTax.name).toMatch(/British Columbia/);
    expect(text.britishColumbiaTax.help).toMatch(/British Columbia/);
    for (const s of leaves(text)) {
      expect(s).not.toMatch(/Ontario/);
    }
  });
});
