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

describe('Québec adapter', () => {
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

  it('counts the federal tax before the Québec abatement', () => {
    const federal = all(r2025).find((r) => r.id === 'federal-tax');
    expect(federal?.amount).toBe('7523.55');
  });

  it('lists rows under the Québec headings, with no Canada Pension Plan wording', () => {
    const rows = all(r2025);
    expect(rows.map((r) => [r.id, r.group])).toEqual([
      ['qpp', 'Québec Pension Plan'],
      ['qpp2', 'Québec Pension Plan'],
      ['ei', 'Employment Insurance'],
      ['qpip', 'Québec Parental Insurance Plan'],
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

  it('falls back when federal and Québec tax are in different units', () => {
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
      ...new Set(
        numbered.map((f) =>
          f.name ===
          'Schedule 8: Canada Pension Plan Contributions and Overpayment'
            ? strings.adapters.caQc.schedule8Title
            : f.name,
        ),
      ),
    ]);
    expect(result.advanced.flatMap((g) => g.lines)).toHaveLength(
      numbered.flatMap((f) => f.lines).length,
    );
  });
});

describe('Québec adapter, wording and help text', () => {
  const { wording, zero, qpp2, ...rest } = strings.adapters.caQc;
  // The Schedule 8 title is a CRA form title with its number, not row copy.
  const text = {
    ...rest,
    schedule8Title: '',
    rewrite: '',
    qpp2: { name: qpp2.name, help: qpp2.help(zero) },
  };

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
      wording.pageText.description('$70,000', 'Québec', 2026, '$49,073.39'),
      wording.pageText.paragraph(
        '$70,000',
        'Québec',
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

describe('Québec adapter, advanced view wording', () => {
  const groups = caQcAdapter.adapt(r2025).advanced;
  const schedule8 = groups.find((g) => g.form === 'ca/schedule_8');

  it('titles Schedule 8 for the Québec Pension Plan and links the Québec page', () => {
    expect(schedule8?.name).toBe(
      'Schedule 8: Québec Pension Plan Contributions',
    );
    expect(schedule8?.page).toBe('schedule-8-qc');
  });

  it('words the Schedule 8 lines with QPP, never CPP or the Canada Pension Plan', () => {
    const words = (schedule8?.lines ?? []).flatMap((l) => [l.label, l.detail]);
    expect(words.length).toBeGreaterThan(0);
    for (const w of words) expect(w).not.toMatch(/Canada Pension|CPP/);
    expect(words).toContain(
      'Total QPP pensionable earnings from box 26 of all of your T4 slips',
    );
  });

  it('words the exemption label as the basic exemption, in Schedule 8 and where it is quoted', () => {
    const details = groups.flatMap((g) => g.lines.map((l) => l.detail));
    expect(details.some((d) => d.includes('after the basic exemption'))).toBe(
      true,
    );
    for (const d of details) expect(d).not.toMatch(/Pension Plan exemption/);
  });

  it('words the fallback advanced view the same way', () => {
    const noLabels = {
      ...r2025,
      trace: r2025.trace?.filter((f) => f.form !== 'ca-qc/tp1_tax'),
    };
    const fallback = caQcAdapter.adapt(noLabels);
    expect(fallback.rows).toEqual([]);
    const s8 = fallback.advanced.find((g) => g.form === 'ca/schedule_8');
    expect(s8?.name).toBe('Schedule 8: Québec Pension Plan Contributions');
    expect(s8?.page).toBe('schedule-8-qc');
  });

  it('spells the province with its accent in every group and line', () => {
    for (const g of groups) {
      for (const w of [
        g.name,
        ...g.lines.flatMap((l) => [l.label, l.detail]),
      ]) {
        expect(w).not.toContain('Quebec');
      }
    }
  });

  it('leaves other forms’ pages alone', () => {
    expect(groups.find((g) => g.form === 'ca-qc/tp1_schedule_u')?.page).toBe(
      'schedule-u',
    );
  });
});
