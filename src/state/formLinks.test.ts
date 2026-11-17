import { FORM_PAGE_OF, formPageLink } from './formLinks';
import { formPages } from './formPages';

const FIXED_IDS = [
  'on428',
  'on428-a',
  'ab428',
  'bc428',
  'bc479',
  't4',
  't1-income',
  't1-tax',
  'schedule-8',
  't2204',
  'schedule-6',
];

describe('FORM_PAGE_OF', () => {
  it('is exactly the engine-key table', () => {
    expect({ ...FORM_PAGE_OF }).toEqual({
      'ca-on/on428': 'on428',
      'ca-on/on428_a': 'on428-a',
      'ca-ab/ab428': 'ab428',
      'ca-ab/ab428_credits': 'ab428',
      'ca-bc/bc428': 'bc428',
      'ca-bc/bc479': 'bc479',
      'ca/t1_taxable_income': 't1-income',
      'ca/t1_tax_and_credits': 't1-tax',
      'ca/schedule_8': 'schedule-8',
      'ca/t2204': 't2204',
      'ca/schedule_6': 'schedule-6',
    });
  });

  it('points only at ids from the fixed list', () => {
    for (const id of Object.values(FORM_PAGE_OF)) {
      expect(FIXED_IDS).toContain(id);
    }
  });

  it('has an entry for every published page', () => {
    const targets = new Set(Object.values(FORM_PAGE_OF));
    expect(formPages.length).toBeGreaterThan(0);
    for (const page of formPages) {
      expect(targets).toContain(page.id);
    }
  });
});

describe('formPageLink', () => {
  it('gives the page address of a mapped, published form', () => {
    expect(formPageLink('ca-on/on428', ['on428'])).toBe('/forms/on428/');
    expect(formPageLink('ca-ab/ab428_credits', ['ab428'])).toBe(
      '/forms/ab428/',
    );
  });

  it('gives no link for a key with no map entry', () => {
    expect(formPageLink('ca-on/unknown', ['on428'])).toBeNull();
    expect(formPageLink('ca-ab/worksheet_ab428', FIXED_IDS)).toBeNull();
  });

  it('gives no link for a mapped form whose page is not published', () => {
    expect(formPageLink('ca/t2204', ['on428'])).toBeNull();
    expect(formPageLink('ca-on/on428', [])).toBeNull();
  });

  it('gives no link for a return, even with every page published', () => {
    expect(formPageLink('ca/return', FIXED_IDS)).toBeNull();
  });

  it('gives only absolute links with a single leading slash', () => {
    for (const key of Object.keys(FORM_PAGE_OF)) {
      expect(formPageLink(key, FIXED_IDS)).toMatch(/^\/[^/]/);
    }
  });

  it('defaults to the pages that are published', () => {
    expect(formPageLink('ca-on/on428')).toBe('/forms/on428/');
  });
});
