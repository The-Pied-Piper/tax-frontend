import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  apiBaseUrl,
  fakeFetch,
  siteUrl as site,
  template,
  tmpDirs,
  withXland,
  xland,
} from '../../src/test/generatedSite';
import { generateSalaryPages } from './generate';
import { provinces } from './provinces';
import { renderSalaryApp } from './prerender';
import { rewriteSitemap } from './sitemap';

// One integration home for the written output folder: every link resolves,
// every canonical is its sitemap entry, and a second province needs no change.
const outDir = tmpDirs('salary-crawl');

/** A built output folder: the calculator's index.html (the template) and the salary pages. */
async function build(withSecond = false) {
  const dir = outDir();
  writeFileSync(join(dir, 'index.html'), template);
  const { written } = await generateSalaryPages({
    fetch: fakeFetch(withSecond ? withXland : undefined),
    baseUrl: apiBaseUrl,
    provinces: withSecond ? [...provinces, xland] : provinces,
    outDir: dir,
    template,
    render: renderSalaryApp,
    siteUrl: site,
  });
  await rewriteSitemap(dir, site, written);
  return { dir, written };
}

function parse(dir: string, file: string): Document {
  return new DOMParser().parseFromString(
    readFileSync(join(dir, file), 'utf8'),
    'text/html',
  );
}

/** The file a site-internal address is served from, or null for an outside address. */
function fileFor(href: string): string | null {
  const url = new URL(href, `${site}/ca-on/70000/`);
  if (url.origin !== site) return null;
  return url.pathname.endsWith('/')
    ? `${url.pathname.slice(1)}index.html`
    : url.pathname.slice(1);
}

function sitemapLocs(dir: string): string[] {
  const xml = readFileSync(join(dir, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1] ?? '');
}

function navHrefs(dir: string, file: string): (string | null)[] {
  return [...parse(dir, file).querySelectorAll('nav a[href]')].map((a) =>
    a.getAttribute('href'),
  );
}

/** Every internal link on every written page, as [page, target file]. */
function internalLinks(dir: string, written: string[]) {
  return written.flatMap((file) =>
    [...parse(dir, file).querySelectorAll('a[href]')].flatMap((a) => {
      const target = fileFor(a.getAttribute('href') ?? '');
      return target === null ? [] : [{ file, target }];
    }),
  );
}

describe('crawl of a generated output folder', () => {
  it('resolves every internal link on every page to a written file', async () => {
    const { dir, written } = await build();
    const links = internalLinks(dir, written);
    expect(links.length).toBeGreaterThan(written.length * 3);
    for (const { file, target } of links) {
      expect(existsSync(join(dir, target)), `${file} -> ${target}`).toBe(true);
    }
  });

  it('has the calculator link and the neighbours of the data block on every page', async () => {
    const { dir, written } = await build();
    for (const file of written) {
      const hrefs = navHrefs(dir, file);
      expect(hrefs, file).toContain('/');
      const data = JSON.parse(
        parse(dir, file).getElementById('salary-page-data')?.textContent ?? '',
      ) as {
        links: {
          previous: { href: string } | null;
          next: { href: string } | null;
        };
      };
      if (data.links.previous)
        expect(hrefs).toContain(data.links.previous.href);
      if (data.links.next) expect(hrefs).toContain(data.links.next.href);
    }
  });

  it('lists in the sitemap exactly the calculator and the pages on disk', async () => {
    const { dir, written } = await build();
    expect([...sitemapLocs(dir)].sort()).toEqual(
      [
        `${site}/`,
        ...written.map((f) => `${site}/${f.replace('index.html', '')}`),
      ].sort(),
    );
    for (const loc of sitemapLocs(dir)) {
      expect(existsSync(join(dir, fileFor(loc) ?? 'missing'))).toBe(true);
    }
  });

  it('has every page canonical and og:url equal to its sitemap entry', async () => {
    const { dir, written } = await build();
    const locs = sitemapLocs(dir);
    for (const file of written) {
      const page = parse(dir, file);
      const canonical = page
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href');
      expect(locs).toContain(canonical);
      expect(canonical).toBe(`${site}/${file.replace('index.html', '')}`);
      expect(
        page.querySelector('meta[property="og:url"]')?.getAttribute('content'),
      ).toBe(canonical);
    }
  });

  it('adds a made-up second province to links and sitemap with no other change', async () => {
    const alone = await build();
    const both = await build(true);
    expect(both.written).toHaveLength(28);
    expect(sitemapLocs(both.dir)).toHaveLength(29);
    expect(sitemapLocs(both.dir)).toContain(`${site}/ca-xx/15000/`);
    for (const { file, target } of internalLinks(both.dir, both.written)) {
      expect(existsSync(join(both.dir, target)), `${file} -> ${target}`).toBe(
        true,
      );
    }
    expect(navHrefs(both.dir, 'ca-on/70000/index.html')).toEqual(
      navHrefs(alone.dir, 'ca-on/70000/index.html'),
    );
    expect(
      parse(both.dir, 'ca-xx/15000/index.html')
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
    ).toBe(`${site}/ca-xx/15000/`);
    expect(navHrefs(both.dir, 'ca-xx/15000/index.html')).toEqual(
      expect.arrayContaining(['/', '/ca-xx/10000/', '/ca-xx/20000/']),
    );
  });
});
