import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { COMING_SOON } from '../../src/adapters/coming-soon';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pageMeta } from './pageMeta';
import { salaryPageText } from '../../src/state/salaryPageText';
import {
  compute150000,
  compute30000,
  compute70000,
  duplicates,
  pageData,
  syntheticOntarioPages,
} from '../../src/test/syntheticPages';

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

describe('pageMeta: the wrapper around salaryPageText', () => {
  it('takes the place name from the province list by code, and the year from the data', () => {
    const meta = pageMeta(elsewhere('Quebec', 2031));
    expect(meta.title).toContain('Quebec');
    expect(meta.title).toContain('2031');
    expect(meta.title).not.toContain('Ontario');
  });

  it('gives the text salaryPageText gives for that answer, place and year', () => {
    expect(pageMeta(page70000)).toEqual(
      salaryPageText(compute70000, 'Ontario', 2026),
    );
  });

  it('picks the place by code when the list has several', () => {
    const data = {
      ...page70000,
      jurisdictions: [
        { code: 'CA-XX', name: 'Xland', years: [] },
        ...page70000.jurisdictions,
      ],
    };
    expect(pageMeta(data).title).toContain('Ontario');
    expect(pageMeta(data).title).not.toContain('Xland');
  });

  it('falls back to the code when the name is blank', () => {
    const data = elsewhere('   ', 2026);
    expect(pageMeta(data).title).toContain('CA-XX');
  });

  it('has a place name for every coming-soon province too (through placeOptions)', () => {
    for (const p of COMING_SOON) {
      const data = {
        ...page70000,
        jurisdictionCode: p.code,
        jurisdictions: [{ code: p.code, name: p.name, years: [] }],
      };
      expect(pageMeta(data).title).toContain(p.name);
    }
  });
});

describe('pageMeta limits, for every page', () => {
  it.each([...real, ...synthetic].map((p) => [p.salary, p] as const))(
    'title under 60 and description under 160 characters for $%s',
    (_salary, data) => {
      const { title, description } = pageMeta(data);
      expect(title.length).toBeLessThan(60);
      expect(description.length).toBeLessThan(160);
    },
  );
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
