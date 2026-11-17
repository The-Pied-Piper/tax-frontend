import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  apiBaseUrl,
  fakeFetch,
  siteUrl as site,
  template,
  tmpDirs,
  withAlberta,
} from '../../src/test/generatedSite';
import {
  fileFor,
  internalLinks,
  parse,
  sitemapLocs,
} from '../../src/test/crawlSite';
import { contentPages } from '../../src/state/contentPages';
import { contentPath, FOOTER_PROVINCE_SLUGS } from '../../src/state/siteLinks';
import { generateContentPages } from '../contentPages/generate';
import { hubPages } from '../contentPages/hubs';
import { generateSalaryPages } from './generate';
import { rewriteHome } from './home';
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

// The crawl from the built home page (the order of the build plugin): salary
// pages, content pages and hubs, then the home page. Every salary page is
// reachable by following <a href> links from index.html: home, then a hub,
// then the salary page. Sits beside crawl.test.ts, which keeps the checks on
// the pages themselves.
const outDir = tmpDirs('salary-home-crawl');

async function build(
  options: { list?: 'alberta' | 'none'; withHubs?: boolean } = {},
) {
  const dir = outDir();
  writeFileSync(join(dir, 'index.html'), template);
  const { written: salaryFiles, built } = await generateSalaryPages({
    fetch: fakeFetch(
      options.list === 'alberta'
        ? withAlberta
        : options.list === 'none'
          ? { jurisdictions: [] }
          : undefined,
    ),
    baseUrl: apiBaseUrl,
    provinces,
    outDir: dir,
    template,
    render: renderSalaryApp,
    siteUrl: site,
  });
  const base = new Set(contentPages.map((page) => page.slug));
  const hubs =
    options.withHubs === false ? [] : hubPages(built, provinces, base);
  const { written: pageFiles } = await generateContentPages({
    outDir: dir,
    template,
    pages: [...contentPages, ...hubs],
    render: renderContentPage,
    siteUrl: site,
  });
  const written = [...salaryFiles, ...pageFiles];
  await rewriteSitemap(dir, site, written);
  await rewriteHome(dir, renderSiteFooter);
  return { dir, salaryFiles, pageFiles, written };
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
function orphans(dir: string, written: string[]) {
  const seen = reachable(dir);
  return written.filter((file) => !seen.has(file));
}

/** The files a page links to directly. */
function linksFrom(dir: string, file: string): Set<string> {
  return new Set(internalLinks(dir, [file]).map(({ target }) => target));
}

describe('crawl from the built home page', () => {
  it(
    'has no CA$ anywhere in the home page or any written page',
    async () => {
      const { dir, written } = await build({ list: 'alberta' });
      expect(written.length).toBeGreaterThan(0);
      for (const file of ['index.html', ...written]) {
        expect(readFileSync(join(dir, file), 'utf8'), file).not.toContain(
          'CA$',
        );
      }
    },
    SLOW_TEST_MS,
  );

  it(
    'reaches all 25 Ontario pages, the methodology page and every hub by following links',
    async () => {
      const { dir, salaryFiles, pageFiles, written } = await build();
      expect(salaryFiles).toHaveLength(25);
      expect(pageFiles).toEqual(
        expect.arrayContaining([
          'methodology/index.html',
          ...FOOTER_PROVINCE_SLUGS.map((slug) => `${slug}/index.html`),
        ]),
      );
      expect(orphans(dir, written)).toEqual([]);
    },
    SLOW_TEST_MS,
  );

  it(
    'reaches all 50 pages of two provinces through their hubs',
    async () => {
      const { dir, salaryFiles, written } = await build({ list: 'alberta' });
      expect(salaryFiles).toHaveLength(50);
      expect(orphans(dir, written)).toEqual([]);
    },
    SLOW_TEST_MS,
  );

  it(
    'goes home, then a hub, then a salary page: the home page links to the hubs, not to every salary',
    async () => {
      const { dir, salaryFiles } = await build();
      const direct = linksFrom(dir, 'index.html');
      expect(direct).toEqual(
        new Set([
          'methodology/index.html',
          ...FOOTER_PROVINCE_SLUGS.map((slug) => `${slug}/index.html`),
        ]),
      );
      const fromHub = linksFrom(dir, 'ca-on/index.html');
      for (const file of salaryFiles) {
        expect(fromHub.has(file), `ca-on hub -> ${file}`).toBe(true);
      }
    },
    SLOW_TEST_MS,
  );

  it(
    'would fail on a page nothing points at: without the hubs no salary page is reached',
    async () => {
      const { dir, salaryFiles } = await build({ withHubs: false });
      expect(orphans(dir, salaryFiles).length).toBeGreaterThan(0);
      // Neighbour links keep a chain only once a first page is reached.
      expect(reachable(dir).has(salaryFiles[0] ?? '')).toBe(false);
    },
    SLOW_TEST_MS,
  );

  it(
    'links every page from both neighbours (the ends from one)',
    async () => {
      const { dir, salaryFiles } = await build();
      salaryFiles.forEach((file, i) => {
        for (const neighbour of [salaryFiles[i - 1], salaryFiles[i + 1]]) {
          if (neighbour === undefined) continue;
          expect(
            linksFrom(dir, neighbour).has(file),
            `${neighbour} -> ${file}`,
          ).toBe(true);
        }
      });
    },
    SLOW_TEST_MS,
  );

  it(
    'has no broken link on any written page, the home page and the footers included',
    async () => {
      const { dir, written } = await build({ list: 'alberta' });
      const links = internalLinks(dir, ['index.html', ...written]);
      expect(links.filter((l) => l.file === 'index.html')).toHaveLength(4);
      for (const { file, target } of links) {
        expect(existsSync(join(dir, target)), `${file} -> ${target}`).toBe(
          true,
        );
      }
    },
    SLOW_TEST_MS,
  );

  it(
    'lists every written page, the hubs included, in the sitemap',
    async () => {
      const { dir } = await build();
      const locs = sitemapLocs(dir);
      for (const slug of ['methodology', ...FOOTER_PROVINCE_SLUGS]) {
        expect(locs).toContain(`${site}${contentPath(slug)}`);
      }
      expect(locs).toContain(`${site}/ca-on/70000/`);
    },
    SLOW_TEST_MS,
  );

  it('still writes every hub, with no salary links, when the province is not returned', async () => {
    const { dir, salaryFiles, pageFiles } = await build({ list: 'none' });
    expect(salaryFiles).toEqual([]);
    for (const slug of FOOTER_PROVINCE_SLUGS) {
      expect(pageFiles).toContain(`${slug}/index.html`);
      // Only salary pages (`/<slug>/<salary>/`); the footer's own link is the hub.
      expect(
        parse(dir, `${slug}/index.html`).querySelectorAll(
          `a[href^="/${slug}/"]:not([href="/${slug}/"])`,
        ),
      ).toHaveLength(0);
    }
    expect(orphans(dir, pageFiles)).toEqual([]);
  });
});
