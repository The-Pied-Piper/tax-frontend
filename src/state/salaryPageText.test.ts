import { COMING_SOON } from '../adapters/coming-soon';
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
      expect(text).toContain('70,000');
    }
  });

  it('trims stray spaces from the place name', () => {
    const clean = salaryPageText(compute70000, 'Ontario', 2026);
    expect(salaryPageText(compute70000, '  Ontario ', 2026)).toEqual(clean);
  });

  it('puts the take-home in the description, as an estimate', () => {
    const { description } = salaryPageText(compute70000, 'Ontario', 2026);
    expect(description).toContain('53,786.25');
    expect(description.toLowerCase()).toContain('estimate');
  });

  it("states the page's own figures in the paragraph, as the API printed them", () => {
    const { paragraph } = salaryPageText(compute70000, 'Ontario', 2026);
    expect(paragraph).toContain('CA$53,786.25');
    expect(paragraph).toContain('CA$16,213.75');
    expect(paragraph).toContain('15.91%');
    expect(paragraph).toContain('29.65%');
    expect(paragraph.toLowerCase()).toContain('estimate');
  });

  it.each([
    [compute30000, 'CA$27,550.43'],
    [compute150000, 'CA$104,319.88'],
  ])('uses the real take-home on the edge pages (%#)', (response, takeHome) => {
    const text = salaryPageText(response, 'Ontario', 2026);
    expect(text.paragraph).toContain(takeHome);
    expect(text.description).toContain(takeHome.replace('CA$', ''));
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

describe('salaryPageText length limits hold for every province name', () => {
  const names = ['Ontario', ...COMING_SOON.map((p) => p.name)];
  const answers = [
    ['$30,000', compute30000],
    ['$150,000', compute150000],
  ] as const;

  it.each(names.flatMap((n) => answers.map(([s, r]) => [n, s, r] as const)))(
    '%s at %s: title under 60 and description under 160 characters',
    (name, _salary, response) => {
      const { title, description } = salaryPageText(response, name, 2026);
      expect(title.length).toBeLessThan(60);
      expect(description.length).toBeLessThan(160);
    },
  );

  it('does not cut a long name: the whole name appears and the limit is passed', () => {
    const long = 'The Very Long Named Province of Somewhere Far Away';
    const { title } = salaryPageText(compute150000, long, 2026);
    expect(title).toContain(long);
    expect(title.length).toBeGreaterThanOrEqual(60);
  });
});
