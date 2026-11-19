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

  it.each([
    ['NL', nlResponse, 'ca-nl/nl428', 'nl428'],
    ['SK', skResponse, 'ca-sk/sk428', 'sk428'],
  ])(
    'advancedGroups lists the %s form once, with the lines of its credits',
    (_name, response, form, page) => {
      const groups = advancedGroups(
        response as unknown as ComputeTakeHomeCalculationResponse,
      );
      const names = groups.map((g) => g.name);
      expect(new Set(names).size).toBe(names.length);
      const own = groups.filter((g) => g.page === page);
      expect(own.map((g) => g.form)).toEqual([
        form.replace('428', '428_credits'),
      ]);
    },
  );
});
