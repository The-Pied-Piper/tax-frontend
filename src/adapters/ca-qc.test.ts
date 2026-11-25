import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture2025 from '../api/fixtures/compute-qc-2025-70000.json';
import { sumAmounts } from '../money/sum';
import { strings } from '../strings';
import { cad, months } from '../test/units';
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
      ['federal-tax', '6282.16'],
      ['quebec-tax', '7641.16'],
      ['drug-premium', '755.00'],
      ['total-tax', '13923.32'],
      ['total-taken-off', '20140.79'],
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

  it('counts the federal tax after the Quebec abatement', () => {
    // 7523.55 (line 146) less 1241.39 (line 156).
    const federal = all(r2025).find((r) => r.id === 'federal-tax');
    expect(federal?.amount).toBe('6282.16');
  });

  it('shows the abatement as it is when it is nil, with the federal tax unchanged', () => {
    const lines = (r2025.trace ?? []).map((form) => ({
      ...form,
      lines: form.lines.map((line) =>
        line.label === 'refundable_quebec_abatement_line_156'
          ? { ...line, amount: '0.00' }
          : line,
      ),
    }));
    const rows = all({ ...r2025, trace: lines });
    expect(rows.find((r) => r.id === 'federal-tax')?.amount).toBe('7523.55');
  });

  it('falls back to the plain view when the abatement line is missing', () => {
    const lines = (r2025.trace ?? []).map((form) => ({
      ...form,
      lines: form.lines.filter(
        (line) => line.label !== 'refundable_quebec_abatement_line_156',
      ),
    }));
    const result = caQcAdapter.adapt({ ...r2025, trace: lines });
    expect(result.rows.map((r) => r.id)).not.toContain('federal-tax');
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
      ['drug-premium', 'Prescription drug insurance premium'],
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

  it.each([
    'schedule_u_line_17',
    'schedule_u_line_17_4',
    'ppip_premiums_paid',
    'ei_premiums_line_89',
    'net_federal_tax_line_146',
    'tp1_line_432',
    'tp1_drug_insurance_premium_line_447',
  ])('falls back to the advanced view when %s is missing', (missing) => {
    const trimmed: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.filter((l) => l.label !== missing),
      })),
    };
    const result = caQcAdapter.adapt(trimmed);
    expect(result.rows).toEqual([]);
    expect(result.totals).toEqual([]);
    expect(result.advanced.length).toBeGreaterThan(0);
  });

  it('falls back instead of throwing when the federal tax is not a money amount', () => {
    const odd: ComputeTakeHomeCalculationResponse = {
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.map((l) =>
          l.label === 'net_federal_tax_line_146'
            ? { ...l, amount: '7523.555' }
            : l,
        ),
      })),
    };
    const result = caQcAdapter.adapt(odd);
    expect(result.rows).toEqual([]);
    expect(result.advanced.length).toBeGreaterThan(0);
  });

  it('falls back when federal and Quebec tax are in different units', () => {
    const mixed = {
      ...r2025,
      trace: (r2025.trace ?? []).map((f) => ({
        ...f,
        lines: f.lines.map((l) =>
          l.label === 'tp1_line_432' ? { ...l, unit: months } : l,
        ),
      })),
    } as ComputeTakeHomeCalculationResponse;
    expect(caQcAdapter.adapt(mixed).rows).toEqual([]);
  });

  it('gives a row the unit of its own line', () => {
    const rows = all(r2025);
    expect(rows.find((r) => r.id === 'qpip')?.unit).toEqual(cad);
  });

  it('keeps every numbered trace line in the advanced view', () => {
    const result = caQcAdapter.adapt(r2025);
    const numbered = (r2025.trace ?? [])
      .map((f) => ({
        name: f.name,
        lines: f.lines.filter((l) => (l.reference ?? '').trim() !== ''),
      }))
      .filter((f) => f.lines.length > 0);
    expect(result.advanced.map((g) => g.name)).toEqual([
      ...new Set(numbered.map((f) => f.name)),
    ]);
    expect(result.advanced.flatMap((g) => g.lines)).toHaveLength(
      numbered.flatMap((f) => f.lines).length,
    );
  });
});

describe('Quebec adapter, wording and help text', () => {
  const { wording, zero, qpp2, ...rest } = strings.adapters.caQc;
  const text = { ...rest, qpp2: { name: qpp2.name, help: qpp2.help(zero) } };

  function leaves(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (value !== null && typeof value === 'object') {
      return Object.values(value).flatMap(leaves);
    }
    return [];
  }

  it('hands the page its own wording', () => {
    expect(caQcAdapter.adapt(r2025).wording).toBe(wording);
  });

  it('words the page text and card help with QPP and QPIP, never the Canada Pension Plan', () => {
    const texts = [
      wording.answer.takenOff,
      wording.answer.averageRate,
      wording.answer.marginalRate,
      wording.pageText.description('$70,000', 'Quebec', 2026, '$49,073.39'),
      wording.pageText.paragraph(
        '$70,000',
        'Quebec',
        2026,
        '$49,073.39',
        '$20,926.61',
        '29.90%',
        '45.03%',
      ),
    ];
    for (const t of texts) {
      expect(t).not.toMatch(/Canada Pension|CPP/);
      expect(t).toMatch(/[Pp]arental [Ii]nsurance/);
    }
    expect(texts[4]).toContain('drug insurance premium');
    expect(texts[4]).not.toContain('abatement');
  });

  it('has help for every row, with no dollar sign, digit, CRA claim or Ontario', () => {
    for (const row of Object.values(text).filter(
      (v): v is { name: string; help: string } =>
        typeof v === 'object' && 'help' in v,
    )) {
      expect(row.help.length).toBeGreaterThan(0);
    }
    for (const s of leaves(text)) {
      expect(s).not.toContain('$');
      expect(s).not.toMatch(/\d/);
      expect(s).not.toMatch(/CRA|checked|official|Ontario/i);
    }
  });
});
