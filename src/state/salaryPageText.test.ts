import { COMING_SOON } from '../adapters/coming-soon';
import { strings } from '../strings';
import {
  compute150000,
  compute30000,
  compute70000,
  duplicates,
  syntheticResponse,
} from '../test/syntheticPages';
import { salaryPageText } from './salaryPageText';

const real = [compute30000, compute70000, compute150000];

describe('salaryPageText: the text of a page from its own answer', () => {
  it('names the place, year and salary in the title and heading', () => {
    const { title, heading } = salaryPageText(compute70000, 'Ontario', 2026);
    for (const text of [title, heading]) {
      expect(text).toContain('Ontario');
      expect(text).toContain('2026');
      expect(text).toContain('$70,000 ');
      expect(text).not.toContain('70,000.00');
    }
  });

  it('shows whole-dollar salaries without cents and never says CA$', () => {
    const text = salaryPageText(compute70000, 'Ontario', 2026);
    for (const value of Object.values(text)) {
      expect(value).not.toContain('CA$');
    }
    expect(text.title).toContain('$70,000');
    expect(text.description).toContain('$70,000');
    expect(text.paragraph).toContain('$70,000 ');
  });

  it('keeps cents on the take-home and deductions', () => {
    const { description, paragraph } = salaryPageText(
      compute70000,
      'Ontario',
      2026,
    );
    expect(description).toContain('$53,786.25');
    expect(paragraph).toContain('$16,213.75');
  });

  it('trims stray spaces from the place name', () => {
    const clean = salaryPageText(compute70000, 'Ontario', 2026);
    expect(salaryPageText(compute70000, '  Ontario ', 2026)).toEqual(clean);
  });

  it('gives a description that says more than the title, not a repeat of it', () => {
    const { title, description } = salaryPageText(
      compute70000,
      'Ontario',
      2026,
    );
    expect(description).not.toContain(title);
    expect(description).not.toContain('After Tax in');
    expect(description).not.toContain('Take-Home Pay');
    expect(description).toContain(
      'income tax, pension plan and Employment Insurance',
    );
  });

  it('puts the take-home in the description, as an estimate', () => {
    const { description } = salaryPageText(compute70000, 'Ontario', 2026);
    expect(description).toContain('an estimated $53,786.25');
  });

  it("states the page's own figures in the paragraph, as the API printed them", () => {
    const { paragraph } = salaryPageText(compute70000, 'Ontario', 2026);
    expect(paragraph).toContain('$53,786.25');
    expect(paragraph).toContain('$16,213.75');
    expect(paragraph).toContain('15.91%');
    expect(paragraph).toContain('29.65%');
    expect(paragraph.toLowerCase()).toContain('estimate');
  });

  it.each([
    [compute30000, '$27,550.43'],
    [compute150000, '$104,319.88'],
  ])('uses the real take-home on the edge pages (%#)', (response, takeHome) => {
    const text = salaryPageText(response, 'Ontario', 2026);
    expect(text.paragraph).toContain(takeHome);
    expect(text.description).toContain(takeHome.replace('$', ''));
  });

  it('takes the place and year from its arguments, never from the code', () => {
    const text = salaryPageText(compute70000, 'Quebec', 2031);
    for (const value of Object.values(text)) {
      expect(value).not.toContain('Ontario');
      expect(value).not.toContain('2026');
    }
    expect(text.title).toContain('Quebec');
    expect(text.title).toContain('2031');
    expect(text.description).toContain('Quebec');
    expect(text.heading).toContain('Quebec');
    expect(text.paragraph).toContain('Quebec');
  });

  it('is pure: the same answer gives the same text', () => {
    expect(salaryPageText(compute70000, 'Ontario', 2026)).toEqual(
      salaryPageText(compute70000, 'Ontario', 2026),
    );
  });

  it.each(['title', 'description', 'heading', 'paragraph'] as const)(
    'differs between pages: no duplicate %s over the three real answers',
    (field) => {
      expect(
        duplicates(real.map((r) => salaryPageText(r, 'Ontario', 2026)[field])),
      ).toEqual([]);
    },
  );

  it('does not carry one page figures into another', () => {
    const a = salaryPageText(compute30000, 'Ontario', 2026).paragraph;
    const b = salaryPageText(compute150000, 'Ontario', 2026).paragraph;
    expect(a).not.toContain('104,319.88');
    expect(b).not.toContain('27,550.43');
  });

  it('never claims a CRA check or gives tax advice', () => {
    const all = [...real, syntheticResponse(95000)].flatMap((r) =>
      Object.values(salaryPageText(r, 'Ontario', 2026)),
    );
    for (const text of all) {
      const lower = text.toLowerCase();
      expect(lower).not.toContain('checked against cra');
      expect(lower).not.toContain('verified');
      expect(lower.replace(/not tax advice/g, '')).not.toContain('tax advice');
    }
  });
});

describe('salaryPageText length limits', () => {
  // The search phrase is longer than the old wording: at $150,000 a title fits
  // under 60 characters for the provinces built today, but not for Newfoundland
  // and Labrador, Prince Edward Island or the Northwest Territories. The build
  // refuses such a page by name (generate.test.ts), so adding one of them is a
  // choice then, not a silent cut.
  const built = ['Ontario', 'Alberta'];
  const answers = [
    ['$30,000', compute30000],
    ['$150,000', compute150000],
  ] as const;

  it.each(built.flatMap((n) => answers.map(([s, r]) => [n, s, r] as const)))(
    '%s at %s: title under 60 and description under 160 characters',
    (name, _salary, response) => {
      const { title, description } = salaryPageText(response, name, 2026);
      expect(title.length).toBeLessThan(60);
      expect(description.length).toBeLessThan(160);
    },
  );

  it.each(COMING_SOON.map((p) => p.name))(
    'description under 160 characters for %s, whatever the title',
    (name) => {
      const text = strings.pageText.description(
        '$150,000',
        name,
        2026,
        '$104,319.88',
      );
      expect(text.length).toBeLessThan(160);
    },
  );

  it('does not cut a long name: the whole name appears and the limit is passed', () => {
    const long = 'The Very Long Named Province of Somewhere Far Away';
    const { title } = salaryPageText(compute150000, long, 2026);
    expect(title).toContain(long);
    expect(title.length).toBeGreaterThanOrEqual(60);
  });
});

// Explicit amounts such as "$75,000" keep these tests valid whatever symbol and
// decimals the money display later uses; the amount text is handed in as given.
describe('natural-search wording of the page text', () => {
  const phrase = (place: string, year: number) =>
    `$75,000 After Tax in ${place} (${String(year)} Take-Home Pay)`;

  it.each([
    ['Ontario', 2026],
    ['Alberta', 2026],
  ])(
    'words the title and heading as the search phrase for %s',
    (place, year) => {
      expect(strings.pageText.title('$75,000', place, year)).toBe(
        phrase(place, year),
      );
      expect(strings.pageText.heading('$75,000', place, year)).toBe(
        phrase(place, year),
      );
    },
  );

  it.each(['Ontario', 'Alberta'])(
    'words the description as salary, place, year, take-home and what is taken off (%s)',
    (place) => {
      const description = strings.pageText.description(
        '$75,000',
        place,
        2026,
        '$58,786',
      );
      expect(description).toBe(
        `On a $75,000 salary in ${place} in 2026, you take home an estimated $58,786 a year after income tax, pension plan and Employment Insurance.`,
      );
      expect(description).toContain('an estimated $58,786');
    },
  );

  it.each(['Ontario', 'Alberta'])(
    'gives the assembled title, heading and description for a 75,000 page in %s',
    (place) => {
      const text = salaryPageText(syntheticResponse(75000), place, 2026);
      const tail = ` After Tax in ${place} (2026 Take-Home Pay)`;
      expect(text.title).toMatch(/^\D*75,000(\.00)?/);
      expect(text.title.endsWith(tail)).toBe(true);
      expect(text.heading).toBe(text.title);
      expect(text.description).not.toContain(text.title);
      expect(text.description).toContain('58,786.25');
    },
  );

  it('takes the year in the title and heading from the data: change the year, the text changes', () => {
    const response = syntheticResponse(75000);
    const y2026 = salaryPageText(response, 'Ontario', 2026);
    const y2027 = salaryPageText(response, 'Ontario', 2027);
    for (const field of ['title', 'heading'] as const) {
      expect(y2026[field]).toContain('(2026 Take-Home Pay)');
      expect(y2027[field]).toContain('(2027 Take-Home Pay)');
      expect(y2027[field]).not.toContain('2026');
    }
    expect(y2026.description).toContain(' in 2026, ');
    expect(y2027.description).toContain(' in 2027, ');
    expect(y2027.description).not.toContain('2026');
  });
});
