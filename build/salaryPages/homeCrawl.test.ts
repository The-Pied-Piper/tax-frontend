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
import { contentPages } from '../../src/state/contentPages';
import { provinceHubs } from '../../src/state/provinceHubs';
import { generateContentPages } from '../contentPages/generate';
import { hubPages } from '../contentPages/hubs';
import { generateSalaryPages } from './generate';
import { rewriteHomeFooter } from './home';
import {
  renderContentPage,
  renderSalaryApp,
  renderSiteFooter,
} from './prerender';
import { provinces } from './provinces';
import { rewriteSitemap } from './sitemap';

// Each page carries the advanced lines, so building and parsing many pages
// outlasts the 5 s default when the whole suite runs in parallel.
const SLOW_TEST_MS = 20_000;

// The crawl from the built home page, in the order of the build plugin: every
// page is reachable by following <a href> links from index.html, and the salary
// pages are reached through the province pages, not listed on the home page.
const outDir = tmpDirs('salary-home-crawl');

async function build(options: { list?: 'xland' | 'alberta' } = {}) {
  const dir = outDir();
  writeFileSync(join(dir, 'index.html'), template);
  const built = options.list === 'xland' ? [...provinces, xland] : provinces;
  const { written, index } = await generateSalaryPages({
    fetch: fakeFetch(
      options.list === 'xland'
        ? withXland
        : options.list === 'alberta'
          ? withAlberta
          : undefined,
    ),
    baseUrl: apiBaseUrl,
    provinces: built,
    outDir: dir,
    template,
    render: renderSalaryApp,
    siteUrl: site,
  });
  await rewriteHomeFooter(dir, renderSiteFooter());
  const content = await generateContentPages({
    outDir: dir,
    template,
    pages: [
      ...contentPages,
      ...hubPages({
        provinces: built,
        hubs:
          options.list === 'xland'
            ? [...provinceHubs, { slug: 'ca-xx', forms: [] }]
            : provinceHubs,
        index,
        published: contentPages.map((page) => page.slug),
        names: {
          'ca-on': 'Ontario',
          'ca-ab': 'Alberta',
          'ca-bc': 'British Columbia',
          'ca-xx': 'Xland',
        },
      }),
    ],
    render: renderContentPage,
    siteUrl: site,
  });
  await rewriteSitemap(dir, site, [...written, ...content.written]);
  return { dir, written, content: content.written };
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

/** The pages that no chain of links from the home page reaches. */
function orphans(dir: string, files: string[]): string[] {
  const seen = reachable(dir);
  return files.filter((file) => !seen.has(file));
}

/** The files a page links to directly. */
function linksFrom(dir: string, file: string): Set<string> {
  return new Set(internalLinks(dir, [file]).map(({ target }) => target));
}

describe('crawl from the built home page', () => {
  it(
    'has no CA$ anywhere in the home page or any written page',
    async () => {
      const { dir, written, content } = await build({ list: 'alberta' });
      for (const file of ['index.html', ...written, ...content]) {
        expect(readFileSync(join(dir, file), 'utf8'), file).not.toContain(
          'CA$',
        );
      }
    },
    SLOW_TEST_MS,
  );

  it(
    'reaches all 25 Ontario pages, and every content page, by following links',
    async () => {
      const { dir, written, content } = await build();
      expect(written).toHaveLength(25);
      expect(orphans(dir, [...written, ...content])).toEqual([]);
    },
    SLOW_TEST_MS,
  );

  it(
    'reaches all 50 Ontario and Alberta pages',
    async () => {
      const { dir, written } = await build({ list: 'alberta' });
      expect(written).toHaveLength(50);
      expect(orphans(dir, written)).toEqual([]);
    },
    SLOW_TEST_MS,
  );

  it(
    'does not list any salary page on the home page; it links to the hubs and the methodology page',
    async () => {
      const { dir, written } = await build();
      const direct = linksFrom(dir, 'index.html');
      for (const file of written) {
        expect(direct.has(file), `index.html -> ${file}`).toBe(false);
      }
      for (const file of [
        'methodology/index.html',
        'ca-on/index.html',
        'ca-ab/index.html',
        'ca-bc/index.html',
      ]) {
        expect(direct.has(file), `index.html -> ${file}`).toBe(true);
      }
      expect(readFileSync(join(dir, 'index.html'), 'utf8')).not.toContain(
        'Popular salaries',
      );
    },
    SLOW_TEST_MS,
  );

  it(
    'links each hub to every salary page of its province and to no other province',
    async () => {
      const { dir, written } = await build({ list: 'alberta' });
      for (const slug of ['ca-on', 'ca-ab']) {
        const direct = linksFrom(dir, `${slug}/index.html`);
        const own = written.filter((f) => f.startsWith(`${slug}/`));
        expect(own).toHaveLength(25);
        for (const file of own) expect(direct.has(file), file).toBe(true);
        const others = written.filter((f) => !f.startsWith(`${slug}/`));
        for (const file of others) expect(direct.has(file), file).toBe(false);
      }
    },
    SLOW_TEST_MS,
  );

  it(
    'would fail on a page nothing points at: without the home footer nothing is reached',
    async () => {
      const { dir, written } = await build();
      writeFileSync(join(dir, 'index.html'), template);
      expect(orphans(dir, written)).toHaveLength(25);
    },
    SLOW_TEST_MS,
  );

  it(
    'has no broken link anywhere, the home page and the hubs included',
    async () => {
      const { dir, written, content } = await build();
      const links = internalLinks(dir, ['index.html', ...written, ...content]);
      expect(
        links.filter((l) => l.file === 'ca-on/index.html').length,
      ).toBeGreaterThanOrEqual(25);
      for (const { file, target } of links) {
        expect(existsSync(join(dir, target)), `${file} -> ${target}`).toBe(
          true,
        );
      }
    },
    SLOW_TEST_MS,
  );

  it(
    'reaches a made-up second province with no other change, from the other hubs',
    async () => {
      const { dir, written, content } = await build({ list: 'xland' });
      expect(written).toHaveLength(28);
      expect(content).toContain('ca-xx/index.html');
      expect(orphans(dir, [...written, ...content])).toEqual([]);
      const direct = linksFrom(dir, 'ca-xx/index.html');
      for (const file of written.filter((f) => f.startsWith('ca-xx/'))) {
        expect(direct.has(file), file).toBe(true);
      }
      expect(linksFrom(dir, 'ca-on/index.html').has('ca-xx/index.html')).toBe(
        true,
      );
    },
    SLOW_TEST_MS,
  );

  it('writes a hub with no salary links when the API does not return the province', async () => {
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
    const content = await generateContentPages({
      outDir: dir,
      template,
      pages: hubPages({
        provinces,
        hubs: provinceHubs,
        index,
        published: [],
      }),
      render: renderContentPage,
      siteUrl: site,
    });
    expect(written).toEqual([]);
    expect(content.written).toEqual([
      'ca-on/index.html',
      'ca-ab/index.html',
      'ca-bc/index.html',
    ]);
    const direct = linksFrom(dir, 'ca-on/index.html');
    expect([...direct].filter((file) => /\/\d+\//.test(file))).toEqual([]);
    expect(direct.has('ca-ab/index.html')).toBe(true);
    expect(
      parse(dir, 'ca-on/index.html').querySelector(
        'nav[aria-label^="Salary pages"]',
      ),
    ).toBeNull();
  });
});
