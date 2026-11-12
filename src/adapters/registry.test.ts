import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture from '../api/fixtures/compute-on-2025-70000.json';
import { strings } from '../strings';
import { cad, months } from '../test/units';
import { advancedGroups } from './fallback';
import { AdapterRegistry } from './registry';
import type { AdaptedResult, JurisdictionAdapter } from './types';

const response = fixture as ComputeTakeHomeCalculationResponse;

function fake(
  jurisdictionCode: string,
  tag: string,
  years?: readonly number[],
): JurisdictionAdapter {
  const result: AdaptedResult = {
    rows: [
      { id: tag, name: tag, help: `${tag} help`, amount: '1.00', unit: null },
    ],
    totals: [],
    advanced: [],
    unit: cad,
  };
  return { jurisdictionCode, years, adapt: () => result };
}

describe('AdapterRegistry', () => {
  it('finds the adapter by jurisdiction code', () => {
    const registry = new AdapterRegistry();
    const adapter = fake('XX', 'a');
    registry.register(adapter);
    expect(registry.find('XX', 2025)?.adapt(response)).toBe(
      adapter.adapt(response),
    );
    expect(registry.find('YY', 2025)).toBeUndefined();
  });

  it('prefers an adapter for the exact year over one for every year', () => {
    const registry = new AdapterRegistry();
    const every = fake('XX', 'every');
    const y2026 = fake('XX', 'y2026', [2026]);
    registry.register(every);
    registry.register(y2026);
    expect(registry.find('XX', 2026)?.adapt(response)).toBe(
      y2026.adapt(response),
    );
    expect(registry.find('XX', 2025)?.adapt(response)).toBe(
      every.adapt(response),
    );
  });

  it('returns nothing for a year no adapter covers', () => {
    const registry = new AdapterRegistry();
    registry.register(fake('XX', 'y2026', [2026]));
    expect(registry.find('XX', 2025)).toBeUndefined();
  });

  it('refuses two adapters for the same code and year', () => {
    const registry = new AdapterRegistry();
    registry.register(fake('XX', 'a'));
    expect(() => {
      registry.register(fake('XX', 'b'));
    }).toThrow(/already covers/);
    registry.register(fake('XX', 'c', [2026]));
    expect(() => {
      registry.register(fake('XX', 'd', [2026, 2027]));
    }).toThrow();
  });

  it('refuses an adapter with a blank jurisdiction code', () => {
    const registry = new AdapterRegistry();
    expect(() => {
      registry.register(fake(' ', 'a'));
    }).toThrow(/jurisdiction code/);
  });

  it('refuses an adapter with an empty list of years', () => {
    const registry = new AdapterRegistry();
    expect(() => {
      registry.register(fake('XX', 'a', []));
    }).toThrow(/no years/);
  });

  it('is not affected by later changes to the years array', () => {
    const registry = new AdapterRegistry();
    const years = [2026];
    registry.register(fake('XX', 'a', years));
    years[0] = 2025;
    expect(registry.find('XX', 2026)).toBeDefined();
    expect(registry.find('XX', 2025)).toBeUndefined();
  });

  it('adapts through the matching adapter', () => {
    const registry = new AdapterRegistry();
    registry.register(fake('XX', 'a'));
    expect(registry.adapt('XX', 2025, response).rows[0]?.name).toBe('a');
  });

  it('falls back to the advanced view when no adapter matches', () => {
    const registry = new AdapterRegistry();
    const result = registry.adapt('ZZ', 2025, response);
    expect(result.rows).toEqual([]);
    expect(result.totals).toEqual([]);
    expect(result.advanced).toEqual(advancedGroups(response));
  });

  it('carries the response unit on the result it falls back to', () => {
    const registry = new AdapterRegistry();
    expect(registry.adapt('ZZ', 2025, response).unit).toEqual(cad);
    const inMonths = { ...response, unit: months };
    expect(registry.adapt('ZZ', 2025, inMonths).unit).toEqual(months);
  });
});

describe('advancedGroups', () => {
  it('groups lines by form in API order and keeps amounts as text', () => {
    const groups = advancedGroups(response);
    expect(groups.map((g) => g.form)).toEqual(
      (response.trace ?? []).map((f) => f.form),
    );
    expect(groups[0]?.lines[0]).toEqual({
      label: 'Additional maximum pensionable earnings',
      reference: 'D',
      amount: '81200.00',
      detail:
        'cpp_additional_maximum_pensionable_earnings: 81200.00 for cpp_months 12 (half-up to 0.01)',
      named: true,
      unit: cad,
    });
  });

  it('shows only numbered lines: the API name or "Line N", with the text as detail; falls back to the form id', () => {
    const groups = advancedGroups({
      salary: '1.00',
      total_deductions: '0.00',
      take_home: '1.00',
      unit: cad,
      provisional: false,
      trace: [
        {
          form: 'ex/form',
          name: 'Example form',
          lines: [
            {
              label: 'a_step',
              name: 'Named figure',
              reference: '65',
              text: 't',
              amount: '1.00',
              unit: months,
            },
            { label: 'b_step', name: null, reference: null, text: 't' },
            { label: 'c_step', name: '  ', reference: ' ', text: 't' },
            { label: 'd_step', name: null, reference: ' 2 ', text: 'x = 2' },
            { label: 'e_step', name: null, reference: '3', text: '  ' },
          ],
        },
        { form: 'ex/other', name: '', lines: [{ text: 't', reference: '1' }] },
        {
          form: 'ex/blank',
          name: '  ',
          lines: [{ text: 't', reference: '1' }],
        },
        { form: 'ex/unnumbered', name: 'No numbers', lines: [{ text: 't' }] },
        { form: 'ex/empty', name: 'Empty', lines: [] },
      ],
    });
    expect(groups.map((g) => g.name)).toEqual([
      'Example form',
      'ex/other',
      'ex/blank',
    ]);
    expect(groups[0]?.lines).toEqual([
      {
        label: 'Named figure',
        reference: '65',
        amount: '1.00',
        detail: 't',
        named: true,
        unit: months,
      },
      {
        label: 'Line 2',
        reference: '2',
        amount: null,
        detail: 'x = 2',
        named: false,
        unit: null,
      },
      {
        label: 'Line 3',
        reference: '3',
        amount: null,
        detail: strings.advanced.noDetail,
        named: false,
        unit: null,
      },
    ]);
  });

  it('returns no groups when the response has no trace', () => {
    expect(
      advancedGroups({
        salary: '1.00',
        total_deductions: '0.00',
        take_home: '1.00',
        unit: cad,
        provisional: false,
      }),
    ).toEqual([]);
  });

  it('gives every line the unit the API sent for it, and null for none', () => {
    const lines = advancedGroups(response).flatMap((g) => g.lines);
    expect(lines.every((l) => l.unit?.name === 'ca/cad')).toBe(true);
    const mixed = advancedGroups({
      ...response,
      trace: [
        {
          form: 'ex/form',
          name: 'Example',
          lines: [
            { text: 't', reference: '1', amount: '12', unit: months },
            { text: 't', reference: '2', amount: '0.0915', unit: null },
            { text: 't', reference: '3', amount: '0.205' },
          ],
        },
      ],
    });
    expect(mixed[0]?.lines.map((l) => l.unit)).toEqual([months, null, null]);
  });
});
