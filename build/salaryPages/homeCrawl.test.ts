import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  apiBaseUrl,
  fakeFetch,
  siteUrl as site,
  template,
  tmpDirs,
  withAlberta,
  withXland,
  xland,
} from '../../src/test/generatedSite';
import { fileFor, internalLinks, parse } from '../../src/test/crawlSite';
import { generateSalaryPages } from './generate';
import { rewriteHome } from './home';
import { renderSalaryApp, renderSalaryIndexNav } from './prerender';
import { provinces } from './provinces';
import { rewriteSitemap } from './sitemap';

// The crawl from the built home page (the order of the build plugin): every page
// of the province list is reachable by following <a href> links from index.html.
// Sits beside crawl.test.ts, which keeps the checks on the pages themselves.
const outDir = tmpDirs('salary-home-crawl');

async function build(withSecond = false, alberta = false) {
  const dir = outDir();
  writeFileSync(join(dir, 'index.html'), template);
  const { written, index } = await generateSalaryPages({
    fetch: fakeFetch(
      withSecond ? withXland : alberta ? withAlberta : undefined,
    ),
    baseUrl: apiBaseUrl,
    provinces: withSecond ? [...provinces, xland] : provinces,
    outDir: dir,
    template,
    render: renderSalaryApp,
    siteUrl: site,
  });
  await rewriteSitemap(dir, site, written);
  await rewriteHome(dir, index, renderSalaryIndexNav);
  return { dir, written };
}

/** The files reachable from index.html by following only <a href> links. */
function reachable(dir: string): Set<string> {
  const seen = new Set<string>(['index.html']);
  const queue = ['index.html'];
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    if (!existsSync(join(dir, file))) continue;
    for (const a of parse(dir, file).querySelectorAll('a[href]')) {
      const target = fileFor(a.getAttribute('href') ?? '');
      if (target !== null && !seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }
  return seen;
}

/** The pages of the list that no chain of links from the home page reaches. */
function orphans(dir: string, written: string[]): string[] {
  const seen = reachable(dir);
  return written.filter((file) => !seen.has(file));
}

/** The files a page links to directly. */
function linksFrom(dir: string, file: string): Set<string> {
  return new Set(internalLinks(dir, [file]).map(({ target }) => target));
}

describe('crawl from the built home page', () => {
  it('reaches all 25 Ontario pages by following links', async () => {
    const { dir, written } = await build();
    expect(written).toHaveLength(25);
    expect(orphans(dir, written)).toEqual([]);
  });

  it('lists Ontario then Alberta on the home page, 25 links each, and reaches all 50 pages', async () => {
    const { dir, written } = await build(false, true);
    expect(written).toHaveLength(50);
    expect(orphans(dir, written)).toEqual([]);
    const home = parse(dir, 'index.html');
    const hrefs = [...home.querySelectorAll('details a')].map((a) =>
      a.getAttribute('href'),
    );
    const steps = Array.from({ length: 25 }, (_, i) => 30000 + i * 5000);
    expect(hrefs).toEqual([
      ...steps.map((s) => `/ca-on/${s.toString()}/`),
      ...steps.map((s) => `/ca-ab/${s.toString()}/`),
    ]);
    expect(home.querySelector('details')?.textContent).toContain('Alberta');
  });

  it('would fail on a page nothing points at: without the home links nothing is reached', async () => {
    const { dir, written } = await build();
    writeFileSync(join(dir, 'index.html'), template);
    expect(orphans(dir, written)).toHaveLength(25);
  });

  it('links to every page directly from the home page', async () => {
    const { dir, written } = await build();
    const direct = linksFrom(dir, 'index.html');
    for (const file of written) {
      expect(direct.has(file), `index.html -> ${file}`).toBe(true);
    }
  });

  it('links every page from both neighbours (the ends from one)', async () => {
    const { dir, written } = await build();
    // Written in ascending order, so the list order is the neighbour order.
    const files = written;
    files.forEach((file, i) => {
      for (const neighbour of [files[i - 1], files[i + 1]]) {
        if (neighbour === undefined) continue;
        expect(
          linksFrom(dir, neighbour).has(file),
          `${neighbour} -> ${file}`,
        ).toBe(true);
      }
    });
    expect(files).toHaveLength(25);
  });

  it('has no broken link anywhere, the home page included', async () => {
    const { dir, written } = await build();
    const links = internalLinks(dir, ['index.html', ...written]);
    expect(
      links.filter((l) => l.file === 'index.html').length,
    ).toBeGreaterThanOrEqual(25);
    for (const { file, target } of links) {
      expect(existsSync(join(dir, target)), `${file} -> ${target}`).toBe(true);
    }
  });

  it('reaches a made-up second province with no other change, and the home page lists it', async () => {
    const { dir, written } = await build(true);
    expect(written).toHaveLength(28);
    expect(orphans(dir, written)).toEqual([]);
    const direct = linksFrom(dir, 'index.html');
    for (const file of written.filter((f) => f.startsWith('ca-xx/'))) {
      expect(direct.has(file), file).toBe(true);
    }
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('Xland');
  });

  it('leaves the home page without links when the province is not returned', async () => {
    const dir = outDir();
    writeFileSync(join(dir, 'index.html'), template);
    const { written, index } = await generateSalaryPages({
      fetch: fakeFetch({ jurisdictions: [] }),
      baseUrl: apiBaseUrl,
      provinces,
      outDir: dir,
      template,
      render: renderSalaryApp,
      siteUrl: site,
    });
    await rewriteHome(dir, index, renderSalaryIndexNav);
    expect(written).toEqual([]);
    expect(linksFrom(dir, 'index.html').size).toBe(0);
  });
});
