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

/** The word count of the longest sentence in a piece of text. */
export function longestSentence(text: string): number {
  return Math.max(
    0,
    ...text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.split(/\s+/).filter(Boolean).length),
  );
}

/** Every `{name}` a piece of text uses. */
export function placeholdersIn(...texts: string[]): string[] {
  return texts.flatMap((text) =>
    [...text.matchAll(/\{([a-z][a-zA-Z0-9]*)\}/g)].map((m) => m[1] ?? ''),
  );
}
