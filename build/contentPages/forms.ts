import type { ContentPageSpec } from '../../src/state/contentPages';
import type { BuiltProvince } from '../salaryPages/generate';

/**
 * The content pages with each form page marked for its salary link: the example
 * salary page is linked only when the build wrote it. Other pages are returned
 * as they are, and the input is never changed.
 */
export function withSalaryLinks(
  pages: ContentPageSpec[],
  built: BuiltProvince[],
): ContentPageSpec[] {
  return pages.map((page) => {
    const { form } = page;
    if (!form) return page;
    const found = built.find((b) => b.province.slug === form.province);
    const salaryPageWritten = (found?.salaries ?? []).some(
      (salary) => salary === form.exampleSalary,
    );
    return { ...page, form: { ...form, salaryPageWritten } };
  });
}
