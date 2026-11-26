import { sweepSalaries } from '../../src/state/hubCharts';
import {
  FOOTER_PROVINCE_SLUGS,
  PROVINCES_WITHOUT_SALARY_PAGES,
} from '../../src/state/siteLinks';
import { provinces, salaries, TAX_YEAR } from './provinces';

describe('the province list', () => {
  it('has a page list entry, or a hub-only entry, for every province the footer links to', () => {
    const slugs = [
      ...provinces.map((p) => p.slug),
      ...PROVINCES_WITHOUT_SALARY_PAGES,
    ];
    for (const slug of FOOTER_PROVINCE_SLUGS) expect(slugs).toContain(slug);
  });

  it('lists no province both here and as one with a hub but no salary pages', () => {
    const slugs = provinces.map((p) => p.slug);
    for (const slug of PROVINCES_WITHOUT_SALARY_PAGES) {
      expect(slugs, slug).not.toContain(slug);
    }
  });

  it('has Ontario, Alberta, British Columbia, Manitoba, Saskatchewan, Newfoundland and Labrador then Québec, each from $30,000 to $150,000 in $5,000 steps', () => {
    expect(provinces).toEqual([
      {
        code: 'CA-ON',
        slug: 'ca-on',
        year: TAX_YEAR,
        from: 30000,
        to: 150000,
        step: 5000,
      },
      {
        code: 'CA-AB',
        slug: 'ca-ab',
        year: TAX_YEAR,
        from: 30000,
        to: 150000,
        step: 5000,
        extra: expect.arrayContaining([24412, 371347]) as unknown,
      },
      {
        code: 'CA-BC',
        slug: 'ca-bc',
        year: TAX_YEAR,
        from: 30000,
        to: 150000,
        step: 5000,
      },
      {
        code: 'CA-MB',
        slug: 'ca-mb',
        year: TAX_YEAR,
        from: 30000,
        to: 150000,
        step: 5000,
        extra: expect.arrayContaining([17402, 259610, 401127]) as unknown,
      },
      {
        code: 'CA-SK',
        slug: 'ca-sk',
        year: TAX_YEAR,
        from: 30000,
        to: 150000,
        step: 5000,
      },
      {
        code: 'CA-NL',
        slug: 'ca-nl',
        year: TAX_YEAR,
        from: 30000,
        to: 150000,
        step: 5000,
      },
      {
        code: 'CA-QC',
        slug: 'ca-qc',
        year: TAX_YEAR,
        from: 30000,
        to: 150000,
        step: 5000,
      },
    ]);
  });

  it('takes the year from the one build setting, 2026 now', () => {
    expect(TAX_YEAR).toBe(2026);
    for (const province of provinces) {
      expect(province.year).toBe(TAX_YEAR);
    }
  });
});

describe('salaries', () => {
  it('lists the 25 Ontario steps, ends included', () => {
    const [ontario] = provinces;
    if (!ontario) throw new Error('Ontario is missing from the list');
    const steps = salaries(ontario);
    expect(steps).toHaveLength(25);
    expect(steps[0]).toBe(30000);
    expect(steps[1]).toBe(35000);
    expect(steps[24]).toBe(150000);
  });

  it('lists the 25 Alberta steps, ends included', () => {
    const [, alberta] = provinces;
    if (!alberta) throw new Error('Alberta is missing from the list');
    const steps = salaries(alberta);
    expect(steps).toHaveLength(25);
    expect(steps[0]).toBe(30000);
    expect(steps[1]).toBe(35000);
    expect(steps[24]).toBe(150000);
  });

  it('follows the entry, so another province needs no code', () => {
    expect(
      salaries({
        code: 'CA-XX',
        slug: 'ca-xx',
        year: 2026,
        from: 10000,
        to: 20000,
        step: 5000,
      }),
    ).toEqual([10000, 15000, 20000]);
  });

  it('refuses a step of zero or less, or a range that runs backwards', () => {
    const base = {
      code: 'CA-XX',
      slug: 'ca-xx',
      year: 2026,
      from: 10000,
      to: 20000,
      step: 5000,
    };
    expect(() => salaries({ ...base, step: 0 })).toThrow();
    expect(() => salaries({ ...base, step: -5000 })).toThrow();
    expect(() => salaries({ ...base, from: 30000 })).toThrow();
  });
});

describe('salary pages and the rates page', () => {
  it('has a sweep point for every salary page, so the rates page link with ?salary= lands on a point', () => {
    const swept = new Set(sweepSalaries());
    for (const province of provinces) {
      for (const salary of salaries(province)) {
        expect(swept.has(salary.toString())).toBe(true);
      }
    }
  });
});
