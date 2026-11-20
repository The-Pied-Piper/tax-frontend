import { pageOfForm } from '../adapters/formPages';

/** The forms the advanced view lists as groups: forms that share one page (such as the T1 return's two parts) are listed once, as the first of them. */
export function shownForms<T extends { form: string }>(forms: T[]): T[] {
  return forms.filter((form, at) => {
    const page = pageOfForm(form.form);
    return (
      page === null ||
      forms.findIndex((f) => pageOfForm(f.form) === page) === at
    );
  });
}
