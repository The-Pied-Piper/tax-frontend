import { formPageLink } from './formLinks';

const FIXED_IDS = [
  'on428',
  'on428-a',
  'ab428',
  'bc428',
  'bc479',
  'mb479',
  'mb428-a',
  't4',
  't1',
  'schedule-8',
  't2204',
  'schedule-6',
  'schedule-b',
];

describe('formPageLink', () => {
  it('gives the page address of a published page', () => {
    expect(formPageLink('on428', ['on428'])).toBe('/forms/on428/');
    expect(formPageLink('ab428', ['on428', 'ab428'])).toBe('/forms/ab428/');
  });

  it('gives no link for a page that is not published', () => {
    expect(formPageLink('t2204', ['on428'])).toBeNull();
    expect(formPageLink('on428', [])).toBeNull();
  });

  it('gives only absolute links with a single leading slash', () => {
    for (const id of FIXED_IDS) {
      expect(formPageLink(id, FIXED_IDS)).toMatch(/^\/[^/]/);
    }
  });

  it('defaults to the pages that are published', () => {
    expect(formPageLink('on428')).toBe('/forms/on428/');
    expect(formPageLink('no-such-page')).toBeNull();
  });
});
