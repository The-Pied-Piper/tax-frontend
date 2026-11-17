import type { ContentPageSpec } from './contentPages';
import { formSlug, type FooterProvinceSlug } from './siteLinks';

/**
 * A figure shown in a form page's words, taken from a saved answer. Either it
 * is a result the calculator printed (`trace`), or a figure the form itself
 * prints (`printed`), which must appear in the words of that form's steps.
 */
export type FormFigure =
  | { shown: string; trace: { form: string; label: string } }
  | { shown: string; printed: { form: string; text: string } };

/** One part of a form: a few lines that belong together. */
export type FormSection = {
  /** The address fragment, such as `credits`: lower-case, readable, unique on the page. */
  id: string;
  heading: string;
  /** The form lines this part covers, as shown in the pill: `Line 1` or `Lines 3–8`. */
  lines: string;
  /** One short paragraph. `{name}` shows the figure `name` in monospace. */
  paragraph: string;
  /** The worked example at the page's salary, written the same way. */
  example: string;
  /** Every figure the paragraph and the example use. */
  figures: Record<string, FormFigure>;
};

/** One form's page. Adding a form is one entry in `formPages`. */
export type FormPageSpec = {
  /** The last part of the address: `on428` is served at `/forms/on428/`. */
  id: string;
  /** The form's name as people know it, such as `Form ON428: Ontario Tax`. */
  name: string;
  /** The province page this form belongs to. */
  province: FooterProvinceSlug;
  /** The tax year of the figures the page quotes. */
  year: number;
  /** The salary the examples use, in whole dollars. */
  exampleSalary: string;
  title: string;
  description: string;
  /** What the form is for, in plain words. */
  intro: string;
  /** Set on the pages shared by every province: their related links name each province's forms and salary pages. */
  federal?: true;
  sections: FormSection[];
};

/** The data a form page's body is drawn from; the shell's `ContentPageSpec` carries it. */
export type FormBody = Pick<
  FormPageSpec,
  'province' | 'year' | 'exampleSalary' | 'sections' | 'federal'
> & {
  /** Set by the build: true when the example salary page was written. Unset or false means no salary link. */
  salaryPageWritten?: boolean;
};

/** The page entry for a form. */
export function formContentPage(form: FormPageSpec): ContentPageSpec {
  return {
    slug: formSlug(form.id),
    title: form.title,
    description: form.description,
    heading: form.name,
    lede: form.intro,
    trail: [],
    sections: [],
    form: {
      province: form.province,
      year: form.year,
      exampleSalary: form.exampleSalary,
      federal: form.federal,
      sections: form.sections,
    },
  };
}

/** The words of a `{name}` template cut into plain text and figure names. */
export function splitFigures(
  text: string,
): { kind: 'text' | 'figure'; value: string }[] {
  return text
    .split(/\{([a-z][a-zA-Z0-9]*)\}/)
    .map((value, at) => ({
      kind: at % 2 === 1 ? ('figure' as const) : ('text' as const),
      value,
    }))
    .filter((part) => part.value !== '');
}

/**
 * The two kinds of figure for a form's file: a result of the saved answer, and a
 * figure the form prints. `form` is the trace form the page's own steps are in.
 */
export function figuresOf(form: string) {
  return {
    result: (shown: string, label: string, of = form): FormFigure => ({
      shown,
      trace: { form: of, label },
    }),
    printed: (shown: string, text: string): FormFigure => ({
      shown,
      printed: { form, text },
    }),
  };
}
