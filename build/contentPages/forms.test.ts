import { readUnit } from '../../src/adapters/fallback';
import { formContentPage } from '../../src/state/formPage';
import { strings } from '../../src/strings';
import { plainSpec, sampleFormSpec } from '../../src/test/contentPageData';
import { compute70000 } from '../../src/test/syntheticPages';
import type { BuiltProvince } from '../salaryPages/generate';
import { provinces } from '../salaryPages/provinces';
import { withSalaryLinks } from './forms';

const unit = readUnit(compute70000.unit) ?? strings.fallbackUnit;
const [ontario, alberta] = provinces;
if (!ontario || !alberta) throw new Error('province list');

const built = (
  province: BuiltProvince['province'],
  salaries: string[],
): BuiltProvince => ({ province, unit, salaries });

// The sample form is in Ontario at $70,000.
const formPage = formContentPage(sampleFormSpec);

describe('withSalaryLinks', () => {
  it('marks a form whose province is built with its example salary', () => {
    const [page] = withSalaryLinks(
      [formPage],
      [built(ontario, ['30000', '70000'])],
    );
    expect(page?.form?.salaryPageWritten).toBe(true);
  });

  it('does not mark a form whose province was not built', () => {
    const [page] = withSalaryLinks([formPage], [built(alberta, ['70000'])]);
    expect(page?.form?.salaryPageWritten).toBe(false);
  });

  it('does not mark a form whose example salary is not among the built salaries', () => {
    const [page] = withSalaryLinks(
      [formPage],
      [built(ontario, ['30000', '35000'])],
    );
    expect(page?.form?.salaryPageWritten).toBe(false);
  });

  it('does not mark a form when nothing was built', () => {
    const [page] = withSalaryLinks([formPage], []);
    expect(page?.form?.salaryPageWritten).toBe(false);
  });

  it('returns a page without a form unchanged, in the same place', () => {
    const result = withSalaryLinks(
      [plainSpec, formPage],
      [built(ontario, ['70000'])],
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(plainSpec);
  });

  it('keeps the rest of a form page as it was', () => {
    const [page] = withSalaryLinks([formPage], [built(ontario, ['70000'])]);
    expect(page).toEqual({
      ...formPage,
      form: { ...formPage.form, salaryPageWritten: true },
    });
  });

  it('does not change the pages it was given', () => {
    withSalaryLinks([formPage], [built(ontario, ['70000'])]);
    expect(formPage.form?.salaryPageWritten).toBeUndefined();
  });
});
