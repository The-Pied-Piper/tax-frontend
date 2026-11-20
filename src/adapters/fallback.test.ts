import type { ComputeTakeHomeCalculationResponse } from '../api';
import nlResponse from '../api/fixtures/compute-nl-2025-70000.json';
import skResponse from '../api/fixtures/compute-sk-2025-70000.json';
import { strings } from '../strings';
import { compute70000 } from '../test/syntheticPages';
import { advancedGroups, readUnit, responseUnit } from './fallback';

const rawCad = {
  name: 'ca/cad',
  placement: 'before',
  singular: 'CA$',
  plural: 'CA$',
  spaced: false,
  as_percentage: false,
};

// Saved responses from the running service for $70,000 in 2025.
const rNl = nlResponse as ComputeTakeHomeCalculationResponse;
const rSk = skResponse as ComputeTakeHomeCalculationResponse;

describe('the dollar sign', () => {
  it('readUnit shows the API CA$ unit as $, keeping everything else', () => {
    expect(readUnit(rawCad)).toEqual({
      ...rawCad,
      singular: '$',
      plural: '$',
    });
  });

  it('readUnit leaves other units as they are', () => {
    const months = {
      name: 'core/months',
      placement: 'after',
      singular: 'month',
      plural: 'months',
      spaced: true,
      as_percentage: false,
    };
    expect(readUnit(months)).toEqual(months);
    expect(readUnit({ ...months, singular: '%', plural: '%' })).toMatchObject({
      singular: '%',
    });
  });

  it('responseUnit shows the response unit as $', () => {
    expect(responseUnit(compute70000)).toMatchObject({
      singular: '$',
      plural: '$',
    });
    expect(responseUnit({})).toEqual(strings.fallbackUnit);
  });

  it('advancedGroups shows no CA$ in a unit or in the detail text', () => {
    const groups = advancedGroups(compute70000);
    const lines = groups.flatMap((g) => g.lines);
    expect(lines.length).toBeGreaterThan(0);
    expect(JSON.stringify(groups)).not.toContain('CA$');
    expect(
      lines.some((l) => /\$\d/.test(l.detail) && !l.detail.includes('CA')),
    ).toBe(true);
  });

  it('advancedGroups carries the page id of each form, or null', () => {
    const page = Object.fromEntries(
      advancedGroups(compute70000).map((g) => [g.form, g.page]),
    );
    expect(page['ca-on/on428']).toBe('on428');
    expect(page['ca/t2204']).toBe('t2204');
    expect(page['ca/schedule_8']).toBe('schedule-8');
    expect(page['ca-on/return']).toBeNull();
  });

  it('advancedGroups lists the NL form once, with the lines of both parts', () => {
    const own = advancedGroups(rNl).filter((g) => g.page === 'nl428');
    expect(own).toHaveLength(1);
    expect(own[0]?.lines).toHaveLength(106);
  });

  it('advancedGroups lists the SK form once, with the lines of both parts', () => {
    const own = advancedGroups(rSk).filter((g) => g.page === 'sk428');
    expect(own).toHaveLength(1);
    expect(own[0]?.lines).toHaveLength(49);
  });

  it('advancedGroups never repeats a title', () => {
    for (const response of [rNl, rSk]) {
      const names = advancedGroups(response).map((g) => g.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('advancedGroups keeps the API order and lists the return summary last', () => {
    for (const response of [rNl, rSk, compute70000]) {
      const groups = advancedGroups(response);
      const apiOrder = [
        ...new Set(
          (response.trace ?? [])
            .filter((f) => f.lines.some((l) => l.reference?.trim()))
            .map((f) => f.name),
        ),
      ];
      expect(groups.map((g) => g.name)).toEqual(apiOrder);
      expect(groups.at(-1)?.form).toMatch(/\/return$/);
    }
  });

  it('advancedGroups joins forms that share a title, wherever they sit', () => {
    const part = (form: string, name: string, reference: string) => ({
      form,
      name,
      lines: [{ reference, text: 'x', amount: '1' }],
    });
    const response: ComputeTakeHomeCalculationResponse = {
      ...rNl,
      trace: [
        part('x/b1', 'B title', '1'),
        part('x/a', 'A title', '2'),
        part('x/b2', 'B title', '3'),
      ],
    };
    const groups = advancedGroups(response);
    expect(groups.map((g) => g.name)).toEqual(['B title', 'A title']);
    expect(groups[0]?.form).toBe('x/b1');
    expect(groups[0]?.lines.map((l) => l.reference)).toEqual(['1', '3']);
  });

  it('advancedGroups lists an input both parts of a form read once', () => {
    const line = (reference: string, amount: string, name = 'Other') => ({
      reference,
      name,
      text: 'No value given',
      amount,
    });
    const response: ComputeTakeHomeCalculationResponse = {
      ...rNl,
      trace: [
        { form: 'x/a', name: 'T', lines: [line('10400', '0'), line('1', '5')] },
        { form: 'x/b', name: 'T', lines: [line('10400', '0'), line('2', '5')] },
      ],
    };
    const [group] = advancedGroups(response);
    expect(group?.lines.map((l) => l.reference)).toEqual(['10400', '1', '2']);
  });

  it('advancedGroups keeps a line a single part prints twice', () => {
    const line = {
      reference: '7',
      name: 'Seven',
      text: 'Left blank',
      amount: '0',
    };
    const response: ComputeTakeHomeCalculationResponse = {
      ...rNl,
      trace: [
        { form: 'x/a', name: 'T', lines: [{ ...line, reference: '8' }] },
        { form: 'x/b', name: 'T', lines: [line, line] },
      ],
    };
    const [group] = advancedGroups(response);
    expect(group?.lines).toHaveLength(3);
  });

  it('advancedGroups keeps a line that differs in amount, name or text', () => {
    const line = (amount: string, name: string, text: string) => ({
      reference: '5',
      name,
      text,
      amount,
    });
    const response: ComputeTakeHomeCalculationResponse = {
      ...rNl,
      trace: [
        { form: 'x/a', name: 'T', lines: [line('1', 'One', 'a')] },
        {
          form: 'x/b',
          name: 'T',
          lines: [
            line('2', 'One', 'a'),
            line('1', 'Two', 'a'),
            line('1', 'One', 'b'),
          ],
        },
      ],
    };
    const [group] = advancedGroups(response);
    expect(group?.lines).toHaveLength(4);
  });
});
