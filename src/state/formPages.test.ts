import { formPages } from './formPages';
import { formContentPage, splitFigures, type FormPageSpec } from './formPage';
import { contentPages } from './contentPages';
import { provinceHubs } from './provinceHubs';
import { displayWholeMoney, type MoneyUnit } from '../money/format';
import { strings } from '../strings';
import { formSlug, isContentSlug } from './siteLinks';

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
      expect(section.lines, section.id).toMatch(/^(Lines?|Boxes|Box) \d/);
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

/** The three form pages ticket 146 adds, with the province and year each quotes. */
const NEW_FORMS = [
  { id: 't4', province: 'ca-on', year: 2025 },
  { id: 'ab428', province: 'ca-ab', year: 2025 },
  { id: 'bc428', province: 'ca-bc', year: 2025 },
] as const;

/** The sections each new page has, in the order they are shown. */
const SECTION_IDS: Record<(typeof NEW_FORMS)[number]['id'], string[]> = {
  t4: ['pay', 'pension', 'ei', 'tax-deducted'],
  ab428: [
    'income',
    'brackets',
    'credits',
    'after-credits',
    'supplement',
    'total',
  ],
  bc428: [
    'income',
    'brackets',
    'credits',
    'after-credits',
    'reduction',
    'total',
  ],
};

function pageOf(id: string): FormPageSpec {
  const form = formPages.find((page) => page.id === id);
  if (!form) throw new Error(`No form page ${id}`);
  return form;
}

describe('the new form pages', () => {
  it.each(NEW_FORMS)(
    'is published as $id for $province in $year',
    ({ id, province, year }) => {
      const form = pageOf(id);
      expect(form.province).toBe(province);
      expect(form.year).toBe(year);
    },
  );

  it('lists in its hub every form the hub names that is among the new pages', () => {
    const newIds = NEW_FORMS.map((form) => form.id);
    const listed = provinceHubs
      .flatMap((hub) => hub.own.map((form) => form.id))
      .filter((id) => (newIds as readonly string[]).includes(id));
    expect(listed.length).toBeGreaterThan(0);
    const published = formPages.map((form) => form.id);
    for (const id of listed) {
      expect(published, id).toContain(id);
    }
  });

  it.each(NEW_FORMS)('has the sections $id needs', ({ id }) => {
    const ids = pageOf(id).sections.map((section) => section.id);
    expect(ids).toEqual(SECTION_IDS[id]);
  });

  it.each(NEW_FORMS)(
    'has no link or web address in its words: $id',
    ({ id }) => {
      const form = pageOf(id);
      const words = [
        form.name,
        form.title,
        form.description,
        form.intro,
        ...form.sections.flatMap((section) => [
          section.heading,
          section.paragraph,
          section.example,
        ]),
      ];
      for (const text of words) {
        expect(text, form.id).not.toContain('http');
        expect(text, form.id).not.toContain('](');
      }
    },
  );
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
