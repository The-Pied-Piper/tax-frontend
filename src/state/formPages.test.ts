import { formPages } from './formPages';
import { formContentPage, splitFigures } from './formPage';
import { contentPages } from './contentPages';
import { displayWholeMoney, type MoneyUnit } from '../money/format';
import { strings } from '../strings';
import { formSlug, isContentSlug } from './siteLinks';
import { DESCRIPTION_LIMIT, TITLE_LIMIT } from '../../build/salaryPages/limits';
import { copyRules, everyString } from '../test/copyRules';

type Line = {
  label: string;
  amount: string;
  text: string;
  unit: MoneyUnit | null;
};
type Answer = { trace: { form: string; lines: Line[] }[] };

// The saved answers the calculator's own tests use, by file name.
const saved = import.meta.glob<Answer>('../api/fixtures/compute-*.json', {
  eager: true,
  import: 'default',
});

function answerFor(province: string, year: number, salary: string): Answer {
  const key = `../api/fixtures/compute-${province.replace('ca-', '')}-${year.toString()}-${salary}.json`;
  const answer = saved[key];
  if (!answer) throw new Error(`No saved answer ${key}`);
  return answer;
}

/** The money as the pages write it: no cents when they are .00. */
function shownMoney(amount: string): string {
  return displayWholeMoney(amount, 'annually', strings.fallbackUnit);
}

describe.each(formPages)('the $name page', (form) => {
  const answer = answerFor(form.province, form.year, form.exampleSalary);
  const stepsOf = (formName: string) =>
    answer.trace.filter((step) => step.form === formName);

  it('is served at /forms/<id>/ and listed with the content pages', () => {
    const entry = formContentPage(form);
    expect(entry.slug).toBe(formSlug(form.id));
    expect(isContentSlug(entry.slug)).toBe(true);
    expect(contentPages.map((page) => page.slug)).toContain(entry.slug);
  });

  it('has readable section ids, none used twice', () => {
    const ids = form.sections.map((section) => section.id);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps each id apart from the contents and from every heading id', () => {
    const ids = form.sections.map((section) => section.id);
    expect(ids).not.toContain('form-contents');
    for (const id of ids) expect(ids).not.toContain(`${id}-heading`);
  });

  it('names no year in its words but the one it quotes', () => {
    for (const section of form.sections) {
      const years = `${section.paragraph} ${section.example}`.match(
        /\b20\d\d\b/g,
      );
      for (const year of years ?? []) {
        expect(year, section.id).toBe(form.year.toString());
      }
    }
  });

  it('has a heading, line numbers, one paragraph and an example in each section', () => {
    for (const section of form.sections) {
      expect(section.heading, section.id).not.toBe('');
      expect(section.lines, section.id).toMatch(/^Lines? \d/);
      expect(section.paragraph, section.id).not.toContain('\n');
      expect(section.example, section.id).not.toBe('');
    }
  });

  it('uses every figure it declares and declares every figure it uses', () => {
    for (const section of form.sections) {
      const used = new Set(
        [section.paragraph, section.example]
          .flatMap(splitFigures)
          .filter((part) => part.kind === 'figure')
          .map((part) => part.value),
      );
      expect([...used].sort(), section.id).toEqual(
        Object.keys(section.figures).sort(),
      );
    }
  });

  it('quotes only figures that match the saved answer', () => {
    for (const section of form.sections) {
      for (const [name, figure] of Object.entries(section.figures)) {
        const at = `${section.id}.${name}`;
        if ('trace' in figure) {
          const lines = stepsOf(figure.trace.form)
            .flatMap((step) => step.lines)
            .filter((line) => line.label === figure.trace.label);
          expect(lines.length, at).toBeGreaterThan(0);
          for (const line of lines) {
            // A rate has no unit in the answer: its own words carry it.
            if (figure.shown.endsWith('%')) {
              expect(line.text, at).toMatch(
                new RegExp(`(^|[^\\d.])${figure.shown.replace('.', '\\.')}`),
              );
            } else {
              expect(figure.shown, at).toBe(shownMoney(line.amount));
            }
          }
        } else {
          const words = stepsOf(figure.printed.form)
            .flatMap((step) => step.lines)
            .map((line) => line.text);
          const hit = words.filter((text) =>
            text.includes(figure.printed.text),
          );
          expect(hit.length, at).toBeGreaterThan(0);
          // The words must carry the very number that is shown.
          const digits = figure.shown.replace(/[$,]/g, '').replace('%', '');
          const number = new RegExp(
            `(^|[^\\d.])${digits.replace('.', '\\.')}(\\.0+)?(?!\\d)`,
          );
          expect(figure.printed.text, at).toMatch(number);
        }
      }
    }
  });
});

describe('splitFigures', () => {
  it('cuts words around each figure name', () => {
    expect(splitFigures('Tax is {tax}, not {other}.')).toEqual([
      { kind: 'text', value: 'Tax is ' },
      { kind: 'figure', value: 'tax' },
      { kind: 'text', value: ', not ' },
      { kind: 'figure', value: 'other' },
      { kind: 'text', value: '.' },
    ]);
  });

  it('leaves plain words whole', () => {
    expect(splitFigures('No figures.')).toEqual([
      { kind: 'text', value: 'No figures.' },
    ]);
  });
});

describe.each(formPages)('the words of the $name page', (form) => {
  const copy = {
    title: form.title,
    description: form.description,
    intro: form.intro,
    sections: form.sections.map((section) => ({
      heading: section.heading,
      paragraph: section.paragraph,
      example: section.example,
    })),
  };

  it('has a title and description within the limits', () => {
    expect(form.title.length).toBeLessThan(TITLE_LIMIT);
    expect(form.description.length).toBeLessThan(DESCRIPTION_LIMIT);
  });

  it.each(copyRules)('holds no %s', (_name, pattern) => {
    for (const words of everyString(copy)) {
      expect(words, words).not.toMatch(pattern);
    }
  });
});

describe('the one fact each credit and refund page states plainly', () => {
  const bodyOf = (id: string) => {
    const form = formPages.find((page) => page.id === id);
    if (!form) throw new Error(`no form page "${id}" in formPages`);
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
  };

  it.each([
    ['t2204', /\$2,000/],
    ['bc479', /refundable|paid to you/i],
    ['schedule-6', /Canada Workers Benefit/],
    ['on428-a', /LIFT/],
  ] as const)('%s says %s', (id, fact) => {
    expect(bodyOf(id)).toMatch(fact);
  });
});
