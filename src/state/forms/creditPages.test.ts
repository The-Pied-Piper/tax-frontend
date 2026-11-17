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

/** A page's paragraphs and examples, each `{name}` shown as its figure. */
function bodyOf(id: string): string {
  const form = formPages.find((entry) => entry.id === id);
  if (!form) throw new Error(`No form page with id ${id}`);
  return form.sections
    .flatMap((section) =>
      [section.paragraph, section.example].map((text) =>
        text.replace(
          /\{([a-z][a-zA-Z0-9]*)\}/g,
          (whole, name: string) => section.figures[name]?.shown ?? whole,
        ),
      ),
    )
    .join(' ');
}

/** One section's paragraph and example, each `{name}` shown as its figure. */
function sectionOf(id: string, sectionId: string): string {
  const form = formPages.find((entry) => entry.id === id);
  const section = form?.sections.find((entry) => entry.id === sectionId);
  if (!section) throw new Error(`No section ${sectionId} on ${id}`);
  return [section.paragraph, section.example]
    .map((text) =>
      text.replace(
        /\{([a-z][a-zA-Z0-9]*)\}/g,
        (whole, name: string) => section.figures[name]?.shown ?? whole,
      ),
    )
    .join(' ');
}

function introOf(id: string): string {
  const form = formPages.find((entry) => entry.id === id);
  if (!form) throw new Error(`No form page with id ${id}`);
  return form.intro;
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

describe('the credit page copy fixes', () => {
  it('bc479 says it counts only the sales tax credit', () => {
    expect(bodyOf('bc479')).toMatch(
      /(count|use|include|add)\w*[^.]*\b(only|just)\b[^.]*sales tax credit|\b(only|just) the sales tax credit/i,
    );
  });

  it.each([
    ["renter's", /renter/i],
    ['home renovation', /home renovation/i],
    ['venture capital', /venture capital/i],
  ])('bc479 names the %s credit as left out', (_name, pattern) => {
    expect(bodyOf('bc479')).toMatch(pattern);
  });

  it('bc479 no longer calls the sales tax credit the main one', () => {
    expect(introOf('bc479')).not.toMatch(/main one/i);
    expect(bodyOf('bc479')).not.toMatch(/the main one/i);
  });

  it('bc479 says the total goes to line 47900', () => {
    expect(bodyOf('bc479')).toMatch(/47900/);
  });

  it('t2204 intro says a refund needs an overpayment of more than $1', () => {
    expect(introOf('t2204')).toMatch(/more than \$1\b/);
  });

  it("t2204's refund section says a refund needs more than $1", () => {
    expect(sectionOf('t2204', 'refund')).toMatch(/more than \$1\b/);
  });

  it("t2204's earnings section does not say $2,000 is taken off", () => {
    expect(sectionOf('t2204', 'earnings')).not.toMatch(/takes? \$2,000 off/i);
  });

  it('t2204 says pay under $2,000 is counted as zero', () => {
    expect(sectionOf('t2204', 'earnings')).toMatch(
      /under[^.]*(zero|\$0)|(zero|\$0)[^.]*under/i,
    );
  });

  it('t2204 says the $2,000 is used for the refund and the EI credit', () => {
    const text = sectionOf('t2204', 'earnings');
    expect(text).toMatch(/\$2,000/);
    expect(text).toMatch(/refund/i);
    expect(text).toMatch(/credit/i);
  });

  it('t2204 points from line 16 to the EI credit on the return and provincial form', () => {
    const text = bodyOf('t2204');
    expect(text).toMatch(/line 16/i);
    expect(text).toMatch(/31200/);
    expect(text).toMatch(/provincial/i);
  });

  it('schedule-6 says the amounts are for a single person', () => {
    expect(bodyOf('schedule-6')).toMatch(/single person/i);
  });

  it('schedule-6 says full-time students cannot claim', () => {
    expect(bodyOf('schedule-6')).toMatch(/full-time student/i);
  });

  it('schedule-6 says the benefit goes to line 45300, even with no tax owed', () => {
    const text = bodyOf('schedule-6');
    expect(text).toMatch(/45300/);
    expect(text).toMatch(/even if you owe no (income )?tax/i);
  });

  it('on428-a says the amounts are for a single person', () => {
    expect(bodyOf('on428-a')).toMatch(/single person/i);
  });

  it('on428-a says the result goes to line 85 of the ON428', () => {
    const text = bodyOf('on428-a');
    expect(text).toMatch(/ON428/);
    expect(text).toMatch(/line 85/i);
  });
});
