import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import compute70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import { parseSalaryIndex } from '../../src/state/salaryIndex';
import {
  apiBaseUrl,
  fakeFetch,
  template,
  tmpDirs,
  withAlberta,
  withXland,
  xland,
} from '../../src/test/generatedSite';
import { generateSalaryPages } from './generate';
import { provinces } from './provinces';
import { renderSalaryApp } from './prerender';

// What the generator adds for the link index: the result's `index`, and the
// same data block in every page it writes.
const outDir = tmpDirs('salary-index');

function run(dir: string, options: { all?: boolean; list?: unknown } = {}) {
  return generateSalaryPages({
    fetch: fakeFetch(options.list ?? (options.all ? withXland : undefined)),
    baseUrl: apiBaseUrl,
    provinces: options.all ? [...provinces, xland] : provinces,
    outDir: dir,
    template,
    render: renderSalaryApp,
    siteUrl: null,
  });
}

function blocks(dir: string, file: string): Element[] {
  return [
    ...new DOMParser()
      .parseFromString(readFileSync(join(dir, file), 'utf8'), 'text/html')
      .querySelectorAll('script#salary-pages-index'),
  ];
}

describe('generateSalaryPages: the salary-pages-index', () => {
  it('has one group for Ontario: code, name, unit and 25 pages, lowest first', async () => {
    const { index } = await run(outDir());
    expect(index.groups).toHaveLength(1);
    const [group] = index.groups;
    expect(group?.code).toBe('CA-ON');
    expect(group?.name).toBe('Ontario');
    expect(group?.unit).toEqual(compute70000.unit);
    expect(group?.pages).toHaveLength(25);
    expect(group?.pages[0]).toEqual({ salary: '30000', href: '/ca-on/30000/' });
    expect(group?.pages[24]).toEqual({
      salary: '150000',
      href: '/ca-on/150000/',
    });
    expect(group?.pages.map((p) => p.href)).toEqual(
      Array.from(
        { length: 25 },
        (_, i) => `/ca-on/${(30000 + i * 5000).toString()}/`,
      ),
    );
  });

  it('lists exactly the pages it wrote, never one it did not', async () => {
    const dir = outDir();
    const { index, written } = await run(dir, { all: true });
    const hrefs = index.groups.flatMap((g) => g.pages.map((p) => p.href));
    expect(hrefs.sort()).toEqual(
      written.map((f) => `/${f.replace('index.html', '')}`).sort(),
    );
    for (const href of hrefs) {
      expect(existsSync(join(dir, href.slice(1), 'index.html'))).toBe(true);
    }
  });

  it('adds a group for a made-up second province, in the province-list order', async () => {
    const { index } = await run(outDir(), { all: true });
    expect(index.groups.map((g) => [g.code, g.name])).toEqual([
      ['CA-ON', 'Ontario'],
      ['CA-XX', 'Xland'],
    ]);
    expect(index.groups[1]?.pages).toEqual([
      { salary: '10000', href: '/ca-xx/10000/' },
      { salary: '15000', href: '/ca-xx/15000/' },
      { salary: '20000', href: '/ca-xx/20000/' },
    ]);
  });

  it('has an Ontario group then an Alberta group, 25 pages each, when the API lists Alberta', async () => {
    const { index, written } = await run(outDir(), { list: withAlberta });
    expect(index.groups.map((g) => [g.code, g.name])).toEqual([
      ['CA-ON', 'Ontario'],
      ['CA-AB', 'Alberta'],
    ]);
    expect(index.groups.map((g) => g.pages.length)).toEqual([25, 25]);
    expect(index.groups[1]?.pages[0]).toEqual({
      salary: '30000',
      href: '/ca-ab/30000/',
    });
    expect(index.groups[1]?.pages[24]).toEqual({
      salary: '150000',
      href: '/ca-ab/150000/',
    });
    expect(written).toHaveLength(50);
  });

  it('has no group for a listed province the API does not return', async () => {
    const dir = outDir();
    const result = await generateSalaryPages({
      fetch: fakeFetch(),
      baseUrl: apiBaseUrl,
      provinces: [...provinces.filter((p) => p.code === 'CA-ON'), xland],
      outDir: dir,
      template,
      render: renderSalaryApp,
      siteUrl: null,
    });
    expect(result.skipped).toEqual(['CA-XX']);
    expect(result.index.groups.map((g) => g.code)).toEqual(['CA-ON']);
  });

  it('has no groups when no listed province is returned', async () => {
    const dir = outDir();
    const result = await generateSalaryPages({
      fetch: fakeFetch({ jurisdictions: [] }),
      baseUrl: apiBaseUrl,
      provinces,
      outDir: dir,
      template,
      render: renderSalaryApp,
      siteUrl: null,
    });
    expect(result.index).toEqual({ groups: [] });
  });

  it('writes the same block, once, into every page', async () => {
    const dir = outDir();
    const { index, written } = await run(dir, { all: true });
    expect(written).toHaveLength(28);
    for (const file of written) {
      const found = blocks(dir, file);
      expect(found, file).toHaveLength(1);
      expect(found[0]?.getAttribute('type')).toBe('application/json');
      expect(parseSalaryIndex(found[0]?.textContent ?? null), file).toEqual(
        index,
      );
    }
  });

  it('cannot be ended early by a province name that is markup', async () => {
    const dir = outDir();
    const hostile = '</script><b>';
    const list = {
      jurisdictions: jurisdictions.jurisdictions.map((j) =>
        j.code === 'CA-ON' ? { ...j, name: hostile } : j,
      ),
    };
    const { written } = await run(dir, { list });
    const file = written[0] ?? 'missing';
    const html = readFileSync(join(dir, file), 'utf8');
    const start = html.indexOf('id="salary-pages-index"');
    const block = html.slice(start, html.indexOf('</script>', start));
    expect(block).not.toContain('<');
    expect(blocks(dir, file)).toHaveLength(1);
    expect(
      parseSalaryIndex(blocks(dir, file)[0]?.textContent ?? null)?.groups[0]
        ?.name,
    ).toBe(hostile);
  });

  it('leaves the existing data block and its links as they were', async () => {
    const dir = outDir();
    const { written } = await run(dir);
    const html = readFileSync(join(dir, 'ca-on/70000/index.html'), 'utf8');
    expect(html.match(/id="salary-page-data"/g)).toHaveLength(1);
    expect(written).toHaveLength(25);
  });
});
