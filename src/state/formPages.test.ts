import { formPages } from './formPages';
import { FORM_SLUG_PREFIX, formContentPage, splitFigures } from './formPage';
import { contentPages } from './contentPages';
import { groupThousands, type MoneyUnit } from '../money/format';
import { isContentSlug } from './siteLinks';

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

function answerFor(province: string, year: number, salary: number): Answer {
  const key = `../api/fixtures/compute-${province.replace('ca-', '')}-${year.toString()}-${salary.toString()}.json`;
  const answer = saved[key];
  if (!answer) throw new Error(`No saved answer ${key}`);
  return answer;
}

/** The money as the pages write it: no cents when they are .00. */
function shownMoney(amount: string): string {
  return `$${groupThousands(amount).replace(/\.00$/, '')}`;
}

describe.each(formPages)('the $name page', (form) => {
  const answer = answerFor(form.province, form.year, form.exampleSalary);
  const stepsOf = (formName: string) =>
    answer.trace.filter((step) => step.form === formName);

  it('is served at /forms/<id>/ and listed with the content pages', () => {
    const entry = formContentPage(form);
    expect(entry.slug).toBe(`${FORM_SLUG_PREFIX}/${form.id}`);
    expect(isContentSlug(entry.slug)).toBe(true);
    expect(contentPages.map((page) => page.slug)).toContain(entry.slug);
  });

  it('has readable section ids, none used twice', () => {
    const ids = form.sections.map((section) => section.id);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    expect(new Set(ids).size).toBe(ids.length);
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
              expect(line.text, at).toContain(figure.shown);
            } else {
              expect(figure.shown, at).toBe(shownMoney(line.amount));
            }
          }
        } else {
          const words = stepsOf(figure.printed.form)
            .flatMap((step) => step.lines)
            .map((line) => line.text);
          expect(
            words.some((text) => text.includes(figure.printed.text)),
            at,
          ).toBe(true);
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
