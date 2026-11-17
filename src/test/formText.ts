// Test data only: reading a form page's words the way a visitor sees them.
import { formPages } from '../state/formPages';
import type { FormPageSpec } from '../state/formPage';

type Section = FormPageSpec['sections'][number];

export function pageOf(id: string): FormPageSpec {
  const form = formPages.find((entry) => entry.id === id);
  if (!form) throw new Error(`No form page with id ${id}`);
  return form;
}

export function sectionOf(pageId: string, sectionId: string): Section {
  const section = pageOf(pageId).sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`No section ${sectionId} on ${pageId}`);
  return section;
}

/** A section's text with each `{name}` shown as its figure. */
export function shownText(section: Section, text: string): string {
  return text.replace(
    /\{([a-z][a-zA-Z0-9]*)\}/g,
    (whole, name: string) => section.figures[name]?.shown ?? whole,
  );
}
