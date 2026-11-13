import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixture70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { generateSalaryPages } from './generate';
import { provinces, type Province } from './provinces';
import { renderSalaryApp } from './prerender';
import { rewriteSitemap } from './sitemap';

const compute70000 = fixture70000 as ComputeTakeHomeCalculationResponse;
const baseUrl = 'https://api.test/api/v1';
const site = 'https://aftertaxlens.com';
const template = readFileSync('index.html', 'utf8');

const fakeFetch: typeof fetch = (input) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return Promise.resolve(
    url.endsWith('/jurisdictions')
      ? Response.json(jurisdictions)
      : Response.json(compute70000),
  );
};

const made: string[] = [];
afterEach(() => {
  for (const dir of made.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

const xland: Province = {
  code: 'CA-XX',
  slug: 'ca-xx',
  year: 2026,
  from: 10000,
  to: 20000,
  step: 5000,
};
const withXland = {
  jurisdictions: [
    ...jurisdictions.jurisdictions,
    {
      code: 'CA-XX',
      name: 'Xland',
      years: [{ year: 2026, provisional: false }],
    },
  ],
};

/** A built output folder: the calculator's index.html (the template) and the salary pages. */
async function build(withSecond = false) {
  const dir = mkdtempSync(join(tmpdir(), 'salary-crawl-'));
  made.push(dir);
  writeFileSync(join(dir, 'index.html'), template);
  const fetchList: typeof fetch = withSecond
    ? (input, init) => {
        const url = typeof input === 'string' ? input : '';
        return url.endsWith('/jurisdictions')
          ? Promise.resolve(Response.json(withXland))
          : fakeFetch(input, init);
      }
    : fakeFetch;
  const { written } = await generateSalaryPages({
    fetch: fetchList,
    baseUrl,
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

describe('crawl of a generated output folder', () => {
  it('resolves every internal link on every page to a written file', async () => {
    const { dir, written } = await build();
    let internal = 0;
    for (const file of written) {
      for (const a of parse(dir, file).querySelectorAll('a[href]')) {
        const target = fileFor(a.getAttribute('href') ?? '');
        if (target === null) continue;
        internal += 1;
        expect(existsSync(join(dir, target)), `${file} -> ${target}`).toBe(
          true,
        );
      }
    }
    expect(internal).toBeGreaterThan(written.length * 3);
  });

  it('has the calculator link and a neighbour link on every page, one neighbour on the ends', async () => {
    const { dir, written } = await build();
    for (const file of written) {
      const hrefs = [...parse(dir, file).querySelectorAll('nav a[href]')].map(
        (a) => a.getAttribute('href'),
      );
      expect(hrefs, file).toContain('/');
      const salary = file.split('/')[1] ?? '';
      const first = salary === '30000';
      const last = salary === '150000';
      // Neighbour addresses are read from the page's own data, not computed here.
      const data = JSON.parse(
        parse(dir, file).getElementById('salary-page-data')?.textContent ?? '',
      ) as {
        links: {
          previous: { href: string } | null;
          next: { href: string } | null;
        };
      };
      expect(data.links.previous === null).toBe(first);
      expect(data.links.next === null).toBe(last);
      if (data.links.previous)
        expect(hrefs).toContain(data.links.previous.href);
      if (data.links.next) expect(hrefs).toContain(data.links.next.href);
    }
  });

  it('links to the same pages in the static HTML as in the data block', async () => {
    const { dir } = await build();
    const page = parse(dir, 'ca-on/70000/index.html');
    const data = JSON.parse(
      page.getElementById('salary-page-data')?.textContent ?? '',
    ) as { links: { previous: { href: string }; next: { href: string } } };
    const hrefs = [...page.querySelectorAll('nav a[href]')].map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toContain(data.links.previous.href);
    expect(hrefs).toContain(data.links.next.href);
  });

  it('lists in the sitemap exactly the calculator and the pages on disk', async () => {
    const { dir, written } = await build();
    expect(sitemapLocs(dir).sort()).toEqual(
      [
        `${site}/`,
        ...written.map((f) => `${site}/${f.replace('index.html', '')}`),
      ].sort(),
    );
    for (const loc of sitemapLocs(dir)) {
      const target = fileFor(loc);
      expect(existsSync(join(dir, target ?? 'missing'))).toBe(true);
    }
  });

  it('has every page canonical equal to its sitemap entry', async () => {
    const { dir, written } = await build();
    const locs = sitemapLocs(dir);
    for (const file of written) {
      const canonical = parse(dir, file)
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href');
      expect(locs).toContain(canonical);
      expect(canonical).toBe(`${site}/${file.replace('index.html', '')}`);
    }
  });

  it('adds a made-up second province to links and sitemap with no other change', async () => {
    const { dir, written } = await build(true);
    expect(written).toHaveLength(28);
    expect(sitemapLocs(dir)).toHaveLength(29);
    expect(sitemapLocs(dir)).toContain(`${site}/ca-xx/15000/`);
    for (const file of written) {
      for (const a of parse(dir, file).querySelectorAll('a[href]')) {
        const target = fileFor(a.getAttribute('href') ?? '');
        if (target === null) continue;
        expect(existsSync(join(dir, target)), `${file} -> ${target}`).toBe(
          true,
        );
      }
    }
  });
});
