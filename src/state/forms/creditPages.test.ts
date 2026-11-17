import {
  DESCRIPTION_LIMIT,
  TITLE_LIMIT,
} from '../../../build/salaryPages/limits';
import { copyRules, everyString } from '../../test/copyRules';
import { formContentPage } from '../formPage';
import { formPages } from '../formPages';
import { formSlug } from '../siteLinks';
import { pageOf, shownText } from '../../test/formText';

const EXPECTED: Record<string, { province: string; sections: string[] }> = {
  t2204: { province: 'ca-on', sections: ['earnings', 'premiums', 'refund'] },
  'schedule-6': {
    province: 'ca-on',
    sections: ['earnings', 'benefit', 'income'],
  },
  'on428-a': { province: 'ca-on', sections: ['credit', 'reduction'] },
  bc479: { province: 'ca-bc', sections: ['income', 'sales-tax', 'total'] },
};

// The one fact each page must state plainly.
const FACT: Record<string, RegExp> = {
  t2204: /\$2,000/,
  'schedule-6': /Canada Workers Benefit/,
  'on428-a': /LIFT/,
  bc479: /paid to you even if you owe no BC tax/i,
};

/** A page's paragraphs and examples, each `{name}` shown as its figure. */
function bodyOf(id: string): string {
  return pageOf(id)
    .sections.flatMap((section) =>
      [section.paragraph, section.example].map((text) =>
        shownText(section, text),
      ),
    )
    .join(' ');
}

function longestSentence(text: string): number {
  return Math.max(
    0,
    ...text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.split(/\s+/).filter(Boolean).length),
  );
}

describe.each(Object.keys(EXPECTED))('the %s page', (id) => {
  const form = formPages.find((entry) => entry.id === id);
  const need = () => {
    if (!form) throw new Error(`No form page with id ${id}`);
    return form;
  };

  it('is listed for 2025, at a $70,000 salary', () => {
    expect(form, `formPages has no ${id}`).toBeDefined();
    expect(need().province).toBe(EXPECTED[id]?.province);
    expect(need().year).toBe(2025);
    expect(need().exampleSalary).toBe('70000');
  });

  it('has these sections, in this order', () => {
    expect(need().sections.map((section) => section.id)).toEqual(
      EXPECTED[id]?.sections,
    );
  });

  it('gives each section its own line numbers', () => {
    const lines = need().sections.map((section) => section.lines);
    for (const line of lines) expect(line).toMatch(/^Lines? [A-Z\d]/);
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('keeps every sentence to 40 words or fewer', () => {
    const page = need();
    const texts = [
      page.intro,
      ...page.sections.flatMap((s) => [s.paragraph, s.example]),
    ];
    for (const text of texts) {
      expect(longestSentence(text), text).toBeLessThanOrEqual(40);
    }
  });

  it.each(copyRules)('holds no %s in any field', (_what, pattern) => {
    expect(everyString(need()).join('\n')).not.toMatch(pattern);
  });

  it('states its one plain fact', () => {
    expect(bodyOf(id)).toMatch(FACT[id] ?? /^$/);
  });

  it('holds no markup or link in its words', () => {
    const page = need();
    const texts = [
      page.intro,
      ...page.sections.flatMap((s) => [s.paragraph, s.example]),
    ];
    for (const text of texts) {
      expect(text).not.toMatch(/<|http|href/i);
    }
  });

  it('is served at its slug, with an intro, title and description in range', () => {
    const page = need();
    expect(formContentPage(page).slug).toBe(formSlug(id));
    expect(page.intro.length).toBeGreaterThan(0);
    expect(page.intro.length).toBeLessThan(300);
    expect(page.title.length).toBeGreaterThan(0);
    expect(page.title.length).toBeLessThan(TITLE_LIMIT);
    expect(page.description.length).toBeGreaterThan(0);
    expect(page.description.length).toBeLessThan(DESCRIPTION_LIMIT);
  });
});
