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
});
