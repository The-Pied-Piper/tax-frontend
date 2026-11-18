import { formPages } from '../state/formPages';
import { FORM_PAGE_OF, pageOfForm } from './formPages';

const FIXED_IDS = [
  'on428',
  'on428-a',
  'ab428',
  'bc428',
  'bc479',
  'mb428',
  'mb479',
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
      'ca-mb/mb428': 'mb428',
      'ca-mb/mb428_credits': 'mb428',
      'ca-mb/mb479': 'mb479',
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

  // The T4 slip is read, not computed, so the service has no form of that
  // name and the advanced view has no heading for it to link from.
  const NO_ENGINE_FORM = ['t4'];

  it('has an entry for every published page that has an engine form', () => {
    const targets = new Set(Object.values(FORM_PAGE_OF));
    expect(formPages.length).toBeGreaterThan(0);
    for (const page of formPages) {
      if (NO_ENGINE_FORM.includes(page.id)) continue;
      expect(targets).toContain(page.id);
    }
  });
});

describe('pageOfForm', () => {
  it('gives the page id of a form with a page', () => {
    expect(pageOfForm('ca-on/on428')).toBe('on428');
    expect(pageOfForm('ca/t2204')).toBe('t2204');
  });

  it('gives one page for both Alberta keys', () => {
    expect(pageOfForm('ca-ab/ab428')).toBe('ab428');
    expect(pageOfForm('ca-ab/ab428_credits')).toBe('ab428');
  });

  it('gives null for a return, a worksheet or an unknown key', () => {
    expect(pageOfForm('ca-on/return')).toBeNull();
    expect(pageOfForm('ca/return')).toBeNull();
    expect(pageOfForm('ca-ab/worksheet_ab428')).toBeNull();
    expect(pageOfForm('ca-on/unknown')).toBeNull();
    expect(pageOfForm('')).toBeNull();
  });
});
