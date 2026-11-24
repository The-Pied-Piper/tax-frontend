import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture2025 from '../api/fixtures/compute-qc-2025-70000.json';
import { sumAmounts } from '../money/sum';
import { adapters } from './index';
import { caQcAdapter } from './ca-qc';

// A saved response from the engine for $70,000 in 2025.
const r2025 = fixture2025 as ComputeTakeHomeCalculationResponse;

function all(response: ComputeTakeHomeCalculationResponse) {
  const result = caQcAdapter.adapt(response);
  return [...result.rows, ...result.totals];
}

describe('Quebec adapter', () => {
  it('is registered for CA-QC in every year', () => {
    expect(adapters.find('CA-QC', 2025)?.jurisdictionCode).toBe('CA-QC');
    expect(adapters.find('CA-QC', 2026)?.jurisdictionCode).toBe('CA-QC');
  });

  it('shows the engine figures for $70,000 in 2025', () => {
    expect(all(r2025).map((r) => [r.id, r.amount])).toEqual([
      ['qpp', '4256.00'],
      ['qpp2', '0.00'],
      ['ei', '860.67'],
      ['qpip', '345.80'],
      ['federal-tax', '7523.55'],
      ['quebec-tax', '7641.16'],
      ['drug-premium', '755.00'],
      ['total-tax', '15164.71'],
      ['total-taken-off', '21382.18'],
    ]);
  });

  it('adds up to the total taken off, every line counted once', () => {
    const rows = all(r2025);
    const amount = (id: string) => rows.find((r) => r.id === id)?.amount ?? '';
    const parts = [
      'qpp',
      'qpp2',
      'ei',
      'qpip',
      'federal-tax',
      'quebec-tax',
      'drug-premium',
    ];
    expect(sumAmounts(parts.map(amount))).toBe(amount('total-taken-off'));
  });

  it('counts the federal tax before the Quebec abatement', () => {
    const federal = all(r2025).find((r) => r.id === 'federal-tax');
    expect(federal?.amount).toBe('7523.55');
  });

  it('lists rows under the Quebec headings, with no Canada Pension Plan wording', () => {
    const rows = all(r2025);
    expect(rows.map((r) => [r.id, r.group])).toEqual([
      ['qpp', 'Quebec Pension Plan'],
      ['qpp2', 'Quebec Pension Plan'],
      ['ei', 'Employment Insurance'],
      ['qpip', 'Quebec Parental Insurance Plan'],
      ['federal-tax', 'Income tax'],
      ['quebec-tax', 'Income tax'],
      ['drug-premium', 'Drug insurance premium'],
      ['total-tax', 'Income tax'],
      ['total-taken-off', undefined],
    ]);
    for (const r of rows) {
      expect(`${r.name} ${r.help}`).not.toMatch(/Canada Pension|CPP/);
    }
  });

  it('gives every row help text and a unique id', () => {
    const rows = all(r2025);
    expect(rows.every((r) => r.help.length > 0)).toBe(true);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
  });

  it('explains a zero Employment Insurance premium on a real salary', () => {
    const response = {
      ...r2025,
      trace: r2025.trace?.map((f) => ({
        ...f,
        lines: f.lines.map((l) =>
          l.label === 'ei_premiums_line_89' ? { ...l, amount: '0.00' } : l,
        ),
      })),
    };
    const ei = all(response).find((r) => r.id === 'ei');
    expect(ei?.help).toContain('refunded when you file');
  });

  it('falls back to the advanced view when a line it relies on is missing', () => {
    const response = {
      ...r2025,
      trace: r2025.trace?.filter((f) => f.form !== 'ca-qc/ppip_premium'),
    };
    const result = caQcAdapter.adapt(response);
    expect(result.rows).toEqual([]);
    expect(result.totals).toEqual([]);
  });
});
