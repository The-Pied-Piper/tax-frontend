import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixture30000 from '../../src/api/fixtures/compute-on-2026-30000.json';
import fixture150000 from '../../src/api/fixtures/compute-on-2026-150000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pageMeta } from './pageMeta';
import {
  compute70000,
  duplicates,
  pageData,
  syntheticOntarioPages,
} from './syntheticPages';

const compute30000 = fixture30000 as ComputeTakeHomeCalculationResponse;
const compute150000 = fixture150000 as ComputeTakeHomeCalculationResponse;

const page30000 = pageData(compute30000, '30000');
const page70000 = pageData(compute70000, '70000');
const page150000 = pageData(compute150000, '150000');
const real = [page30000, page70000, page150000];
const synthetic = syntheticOntarioPages();

/** Page data for a made-up place and year, to prove nothing is hard-coded. */
function elsewhere(name: string, year: number) {
  const base = pageData(compute70000, '70000');
  return {
    ...base,
    jurisdictionCode: 'CA-XX',
    year,
    jurisdictions: [{ code: 'CA-XX', name, years: [{ year }] }].map((j) => ({
      ...j,
      years: j.years.map((y) => ({ ...y, provisional: false })),
    })),
  };
}

describe('pageMeta: title, description, heading and paragraph of a page', () => {
  it('names the place, year and salary in the title, from that page', () => {
    const { title } = pageMeta(page70000);
    expect(title).toContain('Ontario');
    expect(title).toContain('2026');
    expect(title).toContain('70,000');
  });

  it('puts the take-home in the description, as an estimate', () => {
    const { description } = pageMeta(page70000);
    expect(description).toContain('53,786.25');
    expect(description.toLowerCase()).toContain('estimate');
  });

  it('has a heading naming the place, year and salary', () => {
    const { heading } = pageMeta(page70000);
    expect(heading).toContain('Ontario');
    expect(heading).toContain('2026');
    expect(heading).toContain('70,000');
  });

  it("states the page's own figures in the paragraph, as the API printed them", () => {
    const { paragraph } = pageMeta(page70000);
    expect(paragraph).toContain('CA$53,786.25');
    expect(paragraph).toContain('CA$16,213.75');
    expect(paragraph).toContain('15.91%');
    expect(paragraph).toContain('29.65%');
  });

  it.each([
    [page30000, 'CA$27,550.43'],
    [page150000, 'CA$104,319.88'],
  ])('uses the real take-home on the edge pages (%#)', (data, takeHome) => {
    const meta = pageMeta(data);
    expect(meta.paragraph).toContain(takeHome);
    expect(meta.description).toContain(takeHome.replace('CA$', ''));
  });

  it('takes the place and year from the data, never from the code', () => {
    const meta = pageMeta(elsewhere('Quebec', 2031));
    for (const text of Object.values(meta)) {
      expect(text).not.toContain('Ontario');
      expect(text).not.toContain('2026');
    }
    expect(meta.title).toContain('Quebec');
    expect(meta.title).toContain('2031');
    expect(meta.description).toContain('Quebec');
    expect(meta.heading).toContain('Quebec');
    expect(meta.paragraph).toContain('Quebec');
  });

  it('is pure: the same data gives the same text', () => {
    expect(pageMeta(page70000)).toEqual(pageMeta(page70000));
  });
});

describe('pageMeta limits, for every page', () => {
  const pages = [...real, ...synthetic];

  it.each(pages.map((p) => [p.salary, p] as const))(
    'title under 60 and description under 160 characters for $%s',
    (_salary, data) => {
      const { title, description } = pageMeta(data);
      expect(title.length).toBeLessThan(60);
      expect(title.length).toBeGreaterThan(0);
      expect(description.length).toBeLessThan(160);
      expect(description.length).toBeGreaterThan(0);
    },
  );

  it('does not cut a long province name: the limit fails instead', () => {
    const long = pageMeta(
      elsewhere('The Very Long Named Province of Somewhere Far Away', 2026),
    );
    // Not truncated: the whole name is there, and so the title is over the limit.
    expect(long.title).toContain(
      'The Very Long Named Province of Somewhere Far Away',
    );
    expect(long.title.length).toBeGreaterThanOrEqual(60);
  });
});

describe('pageMeta: unique per page', () => {
  it('has 25 Ontario pages (synthetic, see syntheticPages.ts)', () => {
    expect(synthetic).toHaveLength(25);
  });

  it.each(['title', 'description', 'heading', 'paragraph'] as const)(
    'the 25 pages have no duplicate %s',
    (field) => {
      expect(duplicates(synthetic.map((d) => pageMeta(d)[field]))).toEqual([]);
    },
  );

  it.each(['title', 'description', 'heading', 'paragraph'] as const)(
    'the three real pages have no duplicate %s',
    (field) => {
      expect(duplicates(real.map((d) => pageMeta(d)[field]))).toEqual([]);
    },
  );

  it('names a duplicate when two pages carry the same data', () => {
    const twice = [page70000, page70000];
    expect(duplicates(twice.map((d) => pageMeta(d).title))).toEqual([
      pageMeta(page70000).title,
    ]);
  });

  it('the paragraph is built from the page, not shared between pages', () => {
    const a = pageMeta(page30000).paragraph;
    const b = pageMeta(page150000).paragraph;
    expect(a).not.toBe(b);
    expect(a).not.toContain('104,319.88');
    expect(b).not.toContain('27,550.43');
  });
});

describe('estimate wording', () => {
  const all = [...real, ...synthetic].flatMap((d) =>
    Object.values(pageMeta(d)),
  );

  it('says "estimate" in the description and the paragraph', () => {
    const meta = pageMeta(page70000);
    expect(meta.description.toLowerCase()).toContain('estimate');
    expect(meta.paragraph.toLowerCase()).toContain('estimate');
  });

  it('never claims a CRA check or gives tax advice', () => {
    for (const text of all) {
      const lower = text.toLowerCase();
      expect(lower).not.toContain('checked against cra');
      expect(lower).not.toContain('verified');
      expect(lower.replace(/not tax advice/g, '')).not.toContain('tax advice');
    }
  });
});

describe('no hard-coded province or year outside the list and the strings', () => {
  const dir = 'build/salaryPages';
  const sources = readdirSync(dir).filter(
    (f) =>
      /\.tsx?$/.test(f) &&
      !/\.test\.tsx?$/.test(f) &&
      f !== 'provinces.ts' &&
      f !== 'syntheticPages.ts',
  );

  it('has the pageMeta module among the build sources', () => {
    expect(sources).toContain('pageMeta.ts');
  });

  it.each(sources)('%s names no province name or tax year', (file) => {
    const text = readFileSync(join(dir, file), 'utf8');
    const names = jurisdictions.jurisdictions.map((j) => j.name);
    for (const name of names) expect(text).not.toContain(name);
    expect(text).not.toMatch(/\b20[2-4]\d\b/);
  });
});
