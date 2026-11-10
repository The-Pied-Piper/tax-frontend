import { describe, expect, it } from 'vitest';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture from '../api/fixtures/compute-on-2025-70000.json';
import { advancedGroups, fallbackLabel } from './fallback';
import { AdapterRegistry } from './registry';
import type { AdaptedResult, JurisdictionAdapter } from './types';

const response = fixture as ComputeTakeHomeCalculationResponse;

function fake(
  jurisdictionCode: string,
  tag: string,
  years?: readonly number[],
): JurisdictionAdapter {
  const result: AdaptedResult = {
    rows: [{ id: tag, name: tag, help: `${tag} help`, amount: '1.00' }],
    totals: [],
    advanced: [],
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
});

describe('fallbackLabel', () => {
  it('replaces underscores with spaces', () => {
    expect(fallbackLabel('cpp_basic_exemption')).toBe('cpp basic exemption');
  });

  it('copes with missing labels', () => {
    expect(fallbackLabel(null)).toBe('');
    expect(fallbackLabel(undefined)).toBe('');
  });

  it('handles repeated underscores and surrounding space', () => {
    expect(fallbackLabel('_a__b_ ')).toBe('a  b');
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
    });
  });

  it('uses the text when a line has no label, and null when it has no amount', () => {
    const groups = advancedGroups({
      salary: '1.00',
      total_deductions: '0.00',
      take_home: '1.00',
      provisional: false,
      trace: [
        { form: 'f', name: 'f', lines: [{ label: null, text: 'a_note' }] },
      ],
    });
    expect(groups[0]?.lines).toEqual([
      { label: 'a note', reference: null, amount: null },
    ]);
  });

  it('gives an empty label when both label and text are empty', () => {
    const groups = advancedGroups({
      salary: '1.00',
      total_deductions: '0.00',
      take_home: '1.00',
      provisional: false,
      trace: [{ form: 'f', name: 'f', lines: [{ text: '' }] }],
    });
    expect(groups[0]?.lines).toEqual([
      { label: '', reference: null, amount: null },
    ]);
  });

  it('prefers the API names, keeps the reference, and falls back to the form id', () => {
    const groups = advancedGroups({
      salary: '1.00',
      total_deductions: '0.00',
      take_home: '1.00',
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
            },
            { label: 'b_step', name: null, reference: null, text: 't' },
            { label: 'c_step', name: '  ', reference: ' ', text: 't' },
          ],
        },
        { form: 'ex/other', name: '', lines: [] },
        { form: 'ex/blank', name: '  ', lines: [] },
      ],
    });
    expect(groups.map((g) => g.name)).toEqual([
      'Example form',
      'ex/other',
      'ex/blank',
    ]);
    expect(groups[0]?.lines).toEqual([
      { label: 'Named figure', reference: '65', amount: '1.00' },
      { label: 'b step', reference: null, amount: null },
      { label: 'c step', reference: null, amount: null },
    ]);
  });

  it('returns no groups when the response has no trace', () => {
    expect(
      advancedGroups({
        salary: '1.00',
        total_deductions: '0.00',
        take_home: '1.00',
        provisional: false,
      }),
    ).toEqual([]);
  });
});
