import {
  DESCRIPTION_LIMIT,
  TITLE_LIMIT,
} from '../../../build/salaryPages/limits';
import { everyString } from '../../test/copyRules';
import { formContentPage } from '../formPage';
import { formPages } from '../formPages';
import { formSlug } from '../siteLinks';

const EXPECTED_SECTIONS: Record<string, string[]> = {
  'schedule-8': [
    'months',
    'earnings',
    'second-contribution',
    'contribution',
    'on-return',
  ],
  't1-income': ['total-income', 'deductions', 'net-income', 'taxable-income'],
  't1-tax': [
    'federal-tax',
    'credits',
    'after-credits',
    'provincial',
    'balance',
  ],
};

// Built from pieces so this file does not hold the words it forbids.
const FORBIDDEN: [string, RegExp][] = [
  ['a third-party site', new RegExp(['tax', 'tips'].join('\\s*'), 'i')],
  ['an agency calculator', new RegExp(['cra', 'calculator'].join('\\s+'), 'i')],
  ['the agency calculator tool', new RegExp(['pd', 'oc'].join(''), 'i')],
  ['the agency formulas', new RegExp(['t', '4127'].join(''), 'i')],
];

function longestSentence(text: string): number {
  return Math.max(
    0,
    ...text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.split(/\s+/).filter(Boolean).length),
  );
}

describe.each(Object.keys(EXPECTED_SECTIONS))('the %s page', (id) => {
  const form = formPages.find((entry) => entry.id === id);
  const need = () => {
    if (!form) throw new Error(`No form page with id ${id}`);
    return form;
  };

  it('is listed for Ontario, 2025, at a $70,000 salary', () => {
    expect(form, `formPages has no ${id}`).toBeDefined();
    expect(need().province).toBe('ca-on');
    expect(need().year).toBe(2025);
    expect(need().exampleSalary).toBe('70000');
  });

  it('has these sections, in this order', () => {
    expect(need().sections.map((section) => section.id)).toEqual(
      EXPECTED_SECTIONS[id],
    );
  });

  it('gives each section its own line numbers', () => {
    const lines = need().sections.map((section) => section.lines);
    for (const line of lines) expect(line).toMatch(/^Lines? \d/);
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

  it('names no other site, calculator or agency tool in any field', () => {
    const words = everyString(need()).join('\n');
    for (const [what, pattern] of FORBIDDEN) {
      expect(words, what).not.toMatch(pattern);
    }
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
