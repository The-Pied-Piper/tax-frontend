import {
  DESCRIPTION_LIMIT,
  TITLE_LIMIT,
} from '../../../build/salaryPages/limits';
import { copyRules, everyString } from '../../test/copyRules';
import { formContentPage } from '../formPage';
import { formPages } from '../formPages';
import { formSlug } from '../siteLinks';

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
  bc479: /refundable/i,
};

function pageOf(id: string) {
  const form = formPages.find((entry) => entry.id === id);
  if (!form) throw new Error(`No form page with id ${id}`);
  return form;
}

type Section = ReturnType<typeof pageOf>['sections'][number];

/** A section's paragraph and example, each `{name}` shown as its figure. */
function wordsOf(section: Section): string {
  return [section.paragraph, section.example]
    .map((text) =>
      text.replace(
        /\{([a-z][a-zA-Z0-9]*)\}/g,
        (whole, name: string) => section.figures[name]?.shown ?? whole,
      ),
    )
    .join(' ');
}

/** A page's paragraphs and examples, with figures shown. */
function bodyOf(id: string): string {
  return pageOf(id).sections.map(wordsOf).join(' ');
}

/** One section's paragraph and example, with figures shown. */
function sectionOf(id: string, sectionId: string): string {
  const section = pageOf(id).sections.find((entry) => entry.id === sectionId);
  if (!section) throw new Error(`No section ${sectionId} on ${id}`);
  return wordsOf(section);
}

function introOf(id: string): string {
  return pageOf(id).intro;
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

// Facts each page's copy must state, as [what, pattern, section id].
// Without a section id the pattern is matched against the whole body.
type Fact = [string, RegExp, string?];

const FACTS: Record<string, Fact[]> = {
  bc479: [
    [
      'counts only the sales tax credit',
      /(count|use|include|add)\w*[^.]*\b(only|just)\b[^.]*sales tax credit|\b(only|just) the sales tax credit/i,
    ],
    ["names the renter's credit as left out", /renter/i],
    ['names the home renovation credit as left out', /home renovation/i],
    ['names the venture capital credit as left out', /venture capital/i],
    ['names the mining exploration credit as left out', /mining exploration/i],
    ['names the clean buildings credit as left out', /clean buildings/i],
    ['names the training credit as left out', /\btraining\b/i],
    ['sends the total to line 47900', /47900/, 'total'],
  ],
  t2204: [
    [
      'says a refund needs more than $1 in the refund section',
      /more than \$1\b/,
      'refund',
    ],
    [
      'says pay under the exempt amount is entered as zero',
      /under[^.]*(zero|\$0)|(zero|\$0)[^.]*under/i,
      'earnings',
    ],
    [
      'limits the zero rule to employer pay, not self-employment',
      /under[^.]*(self-employ|only (work|earn)|employer)[^.]*\.|(self-employ|only (work|earn)|employer)[^.]*under/i,
      'earnings',
    ],
    [
      'never lets pay less the exempt amount go below zero',
      /never below zero/i,
      'earnings',
    ],
    ['uses the amount for the refund', /refund/i, 'earnings'],
    ['uses the amount for the EI credit', /credit/i, 'earnings'],
    ['points line 16 to the return', /line 16/i],
    ['names the EI credit line 31200', /31200/],
    ['names the provincial EI credit line 58300', /58300/],
    ['mentions the provincial form', /provincial/i],
  ],
  'schedule-6': [
    ['says the amounts are for a single person', /single person/i],
    ['says a spouse gives other amounts', /spouse/i],
    ['says full-time students cannot claim', /full-time student/i],
    ['says prisoners cannot claim', /prison/i],
    ['says diplomats cannot claim', /diplomat/i],
    [
      'mentions an eligible dependant or under 19',
      /eligible dependant|under 19/i,
    ],
    ['sends the benefit to line 45300', /45300/],
    [
      'says it is paid even with no tax owed',
      /even if you owe no (income )?tax/i,
    ],
  ],
  'on428-a': [
    ['says the amounts are for a single person', /single person/i],
    ['says a spouse gives other amounts', /spouse/i],
    ['sends the result to line 85 of the ON428', /ON428/],
    ['names line 85', /line 85/i],
  ],
};

// Words each page must not use.
const NEVER: Record<string, [string, RegExp][]> = {
  bc479: [['"the main one"', /the main one/i]],
  t2204: [['"takes $2,000 off"', /takes? \$2,000 off/i]],
  'on428-a': [['children', /child/i]],
};

describe.each(Object.keys(FACTS))('the %s page copy', (id) => {
  it.each(FACTS[id] ?? [])('%s', (_what, pattern, sectionId) => {
    const text = sectionId ? sectionOf(id, sectionId) : bodyOf(id);
    expect(text).toMatch(pattern);
  });

  it.each(NEVER[id] ?? [])('does not say %s', (_what, pattern) => {
    expect(bodyOf(id)).not.toMatch(pattern);
    expect(introOf(id)).not.toMatch(pattern);
  });
});

describe('the t2204 intro', () => {
  it('says a refund needs an overpayment of more than $1', () => {
    expect(introOf('t2204')).toMatch(/more than \$1\b/);
  });
});
