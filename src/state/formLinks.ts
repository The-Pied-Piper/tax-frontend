import { contentPath, formSlug } from './siteLinks';

/**
 * The page of each engine form, by the form key the service returns in the
 * saved answers. Two keys may share one page; a form with no entry (a return,
 * a worksheet, the payroll step) has no page and so no link. This module does
 * not import `formPages`: the calculator carries no page copy.
 */
export const FORM_PAGE_OF: Readonly<Record<string, string>> = {
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
};

/**
 * The address of the page that explains a form, such as `/forms/on428/`, or
 * null when the form has no entry or its page is not published. `published` is
 * the ids of the form pages, set at build time.
 */
export function formPageLink(
  formKey: string,
  published: readonly string[] = __FORM_PAGE_IDS__,
): string | null {
  const id = FORM_PAGE_OF[formKey];
  if (id === undefined || !published.includes(id)) return null;
  return contentPath(formSlug(id));
}
