import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { compute70000 } from '../../src/test/syntheticPages';
import { xland } from '../../src/test/generatedSite';
import { provinces } from './provinces';
import { salaryIndex } from './salaryIndex';

// The pure builder of the link index: what was built, by province, with the
// API's names. No file or network here.
const unit = compute70000.unit;
const names = jurisdictions.jurisdictions;
const ontario = provinces[0];
if (!ontario) throw new Error('the province list is empty');
const steps = ['30000', '35000', '40000'];
const built = { province: ontario, unit, salaries: steps };
const builtXland = {
  province: xland,
  unit,
  salaries: ['10000', '15000'],
};
const withXlandName = [...names, { code: 'CA-XX', name: 'Xland', years: [] }];

describe('salaryIndex', () => {
  it('gives a group with code, API name, unit and pages with their addresses', () => {
    expect(salaryIndex([built], names)).toEqual({
      groups: [
        {
          code: 'CA-ON',
          name: 'Ontario',
          unit,
          pages: [
            { salary: '30000', href: '/ca-on/30000/' },
            { salary: '35000', href: '/ca-on/35000/' },
            { salary: '40000', href: '/ca-on/40000/' },
          ],
        },
      ],
    });
  });

  it('keeps the order of the provinces and of the salaries given', () => {
    const index = salaryIndex([builtXland, built], withXlandName);
    expect(index.groups.map((g) => g.code)).toEqual(['CA-XX', 'CA-ON']);
    expect(index.groups[0]?.pages.map((p) => p.href)).toEqual([
      '/ca-xx/10000/',
      '/ca-xx/15000/',
    ]);
  });

  it('takes each group its own unit', () => {
    const other = { ...unit, singular: 'XX$', plural: 'XX$' };
    const index = salaryIndex(
      [built, { ...builtXland, unit: other }],
      withXlandName,
    );
    expect(index.groups.map((g) => g.unit)).toEqual([unit, other]);
  });

  it('leaves out a province the API did not return', () => {
    const index = salaryIndex([built, builtXland], names);
    expect(index.groups.map((g) => g.code)).toEqual(['CA-ON']);
  });

  it('leaves out a province with no pages', () => {
    expect(
      salaryIndex(
        [{ ...built, salaries: [] }, builtXland],
        withXlandName,
      ).groups.map((g) => g.code),
    ).toEqual(['CA-XX']);
  });

  it('has no groups when nothing was built', () => {
    expect(salaryIndex([], names)).toEqual({ groups: [] });
  });
});
