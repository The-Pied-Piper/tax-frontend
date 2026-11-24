/**
 * The page of each engine form, by the form key the service returns in the
 * trace. Two keys may share one page; a form with no entry (a return, a
 * worksheet, the payroll step) has no page. This module imports nothing from
 * `state/`: the calculator carries no page copy.
 */
export const FORM_PAGE_OF: Readonly<Record<string, string>> = {
  'ca-on/on428': 'on428',
  'ca-on/on428_a': 'on428-a',
  'ca-ab/ab428': 'ab428',
  'ca-ab/ab428_credits': 'ab428',
  'ca-bc/bc428': 'bc428',
  'ca-bc/bc479': 'bc479',
  'ca-mb/mb428': 'mb428',
  'ca-mb/mb428_credits': 'mb428',
  'ca-mb/mb479': 'mb479',
  'ca-mb/mb428_a': 'mb428-a',
  'ca-sk/sk428': 'sk428',
  'ca-sk/sk428_credits': 'sk428',
  'ca-nl/nl428': 'nl428',
  'ca-nl/nl428_credits': 'nl428',
  'ca-qc/tp1_schedule_k': 'schedule-k',
  'ca/t1_taxable_income': 't1',
  'ca/t1_tax_and_credits': 't1',
  'ca/schedule_8': 'schedule-8',
  'ca/t2204': 't2204',
  'ca/schedule_6': 'schedule-6',
};

/** The id of the page that explains an engine form, or null when it has none. */
export function pageOfForm(formKey: string): string | null {
  return Object.hasOwn(FORM_PAGE_OF, formKey)
    ? (FORM_PAGE_OF[formKey] ?? null)
    : null;
}
