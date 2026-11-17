import { existsSync } from 'node:fs';
import { join } from 'node:path';
import compute70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import { readUnit } from '../../src/adapters/fallback';
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

// What the generator reports for the hub pages: the result's `built`, one
// entry per province that was written, and no list data inside the pages.
const outDir = tmpDirs('salary-built');

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

describe('generateSalaryPages: built', () => {
  it('has one entry for Ontario: its province, unit and 25 salaries, lowest first', async () => {
    const { built } = await run(outDir());
    expect(built).toHaveLength(1);
    const [ontario] = built;
    expect(ontario?.province.code).toBe('CA-ON');
    expect(ontario?.unit).toEqual(readUnit(compute70000.unit));
    expect(ontario?.salaries).toEqual(
      Array.from({ length: 25 }, (_, i) => (30000 + i * 5000).toString()),
    );
  });

  it('lists exactly the pages it wrote, never one it did not', async () => {
    const dir = outDir();
    const { built, written } = await run(dir, { all: true });
    const files = built.flatMap(({ province, salaries }) =>
      salaries.map((salary) => `${province.slug}/${salary}/index.html`),
    );
    expect(files.sort()).toEqual([...written].sort());
    for (const file of files) expect(existsSync(join(dir, file))).toBe(true);
  });

  it('adds an entry for a made-up second province, in the province-list order', async () => {
    const { built } = await run(outDir(), { all: true });
    expect(built.map((b) => b.province.code)).toEqual(['CA-ON', 'CA-XX']);
    expect(built[1]?.salaries).toEqual(['10000', '15000', '20000']);
  });

  it('has an Ontario entry then an Alberta entry, 25 salaries each, when the API lists Alberta', async () => {
    const { built, written } = await run(outDir(), { list: withAlberta });
    expect(built.map((b) => b.province.code)).toEqual(['CA-ON', 'CA-AB']);
    expect(built.map((b) => b.salaries.length)).toEqual([25, 25]);
    expect(written).toHaveLength(50);
  });

  it('has no entry for a listed province the API does not return', async () => {
    const result = await generateSalaryPages({
      fetch: fakeFetch(),
      baseUrl: apiBaseUrl,
      provinces: [...provinces.filter((p) => p.code === 'CA-ON'), xland],
      outDir: outDir(),
      template,
      render: renderSalaryApp,
      siteUrl: null,
    });
    expect(result.skipped).toEqual(['CA-XX']);
    expect(result.built.map((b) => b.province.code)).toEqual(['CA-ON']);
  });

  it('has no entries when no listed province is returned', async () => {
    const result = await generateSalaryPages({
      fetch: fakeFetch({ jurisdictions: [] }),
      baseUrl: apiBaseUrl,
      provinces,
      outDir: outDir(),
      template,
      render: renderSalaryApp,
      siteUrl: null,
    });
    expect(result.built).toEqual([]);
  });
});
