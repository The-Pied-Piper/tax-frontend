import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contentPages } from '../src/state/contentPages';
import { METHODOLOGY_SLUG } from '../src/state/siteLinks';
import { notFoundPage } from '../src/state/notFoundPage';
import { publishedSlugs } from '../src/test/pageLinks';
import {
  apiBaseUrl,
  fakeFetch,
  siteUrl as site,
  contentTemplate,
  template,
} from '../src/test/generatedSite';
import { withSalaryLinks } from './contentPages/forms';
import { generateContentPages } from './contentPages/generate';
import { hubPages } from './contentPages/hubs';
import { generateNotFoundPage } from './contentPages/notFound';
import { generateSalaryPages } from './salaryPages/generate';
import { rewriteHome } from './salaryPages/home';
import {
  renderContentPage,
  renderSalaryApp,
  renderSiteFooter,
} from './salaryPages/prerender';
import { provinces } from './salaryPages/provinces';

// The built pages, read back: the structured data in each head equals the
// breadcrumb a visitor sees on the same page.
const SLOW_TEST_MS = 60_000;

type Item = {
  '@type': string;
  position: number;
  name: string;
  item: string;
};
type Written = { with: string; without: string };

const ON_SALARY = 'ca-on/70000/index.html';
const ON_HUB = 'ca-on/index.html';
const METHODOLOGY = `${METHODOLOGY_SLUG}/index.html`;
const FORM = (() => {
  const slug = contentPages.find((p) => p.slug.startsWith('forms/'))?.slug;
  if (!slug) throw new Error('no form page in the content pages');
  return `${slug}/index.html`;
})();

const dirs: Written = { with: '', without: '' };

/** The whole site written to a folder: salary pages, content pages and hubs, 404 and home. */
async function build(siteUrl: string | null): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), 'breadcrumb-ld-'));
  writeFileSync(join(dir, 'index.html'), template);
  const { built } = await generateSalaryPages({
    published: publishedSlugs,
    fetch: fakeFetch(),
    baseUrl: apiBaseUrl,
    provinces,
    outDir: dir,
    template,
    render: renderSalaryApp,
    siteUrl,
  });
  const base = new Set(contentPages.map((page) => page.slug));
  await generateContentPages({
    outDir: dir,
    template: contentTemplate,
    pages: [
      ...withSalaryLinks(contentPages, built),
      ...hubPages(built, provinces, base),
    ],
    render: renderContentPage,
    siteUrl,
  });
  await generateNotFoundPage({
    outDir: dir,
    template: contentTemplate,
    render: renderContentPage,
    spec: notFoundPage,
  });
  await rewriteHome(dir, renderSiteFooter);
  return dir;
}

beforeAll(async () => {
  dirs.with = await build(site);
  dirs.without = await build(null);
}, SLOW_TEST_MS);

afterAll(() => {
  for (const dir of Object.values(dirs)) {
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function page(dir: string, file: string): Document {
  return new DOMParser().parseFromString(
    readFileSync(join(dir, file), 'utf8'),
    'text/html',
  );
}

const blocks = (doc: Document) =>
  [...doc.querySelectorAll('script[type="application/ld+json"]')].map(
    (s) => s.textContent,
  );

/** The one block of a page, parsed. */
function list(doc: Document) {
  const found = blocks(doc);
  expect(found).toHaveLength(1);
  return JSON.parse(found[0] ?? '') as {
    '@context': string;
    '@type': string;
    itemListElement: Item[];
  };
}

/** The visible breadcrumb: its links made absolute, and the plain last step. */
function visible(doc: Document) {
  const current = doc.querySelector('nav ol li[aria-current="page"]');
  const ol = current?.parentElement;
  if (!ol) throw new Error('no visible breadcrumb');
  const steps = [...ol.querySelectorAll('li a')].map((a) => ({
    name: a.textContent,
    item: new URL(a.getAttribute('href') ?? '', site).href,
  }));
  const own = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  return [...steps, { name: current.textContent, item: own }].map((s, at) => ({
    '@type': 'ListItem',
    position: at + 1,
    ...s,
  }));
}

describe.each([
  ['a salary page', ON_SALARY, 3],
  ['a province hub', ON_HUB, 2],
  ['a form page', FORM, 2],
  ['the methodology page', METHODOLOGY, 2],
])('the built %s', (_kind, file, count) => {
  it('has one BreadcrumbList block whose items equal the visible breadcrumb', () => {
    const doc = page(dirs.with, file);
    const data = list(doc);
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('BreadcrumbList');
    expect(data.itemListElement).toHaveLength(count);
    expect(data.itemListElement).toEqual(visible(doc));
  });

  it('gives every item an absolute address that starts with the site address', () => {
    const { itemListElement } = list(page(dirs.with, file));
    for (const { item } of itemListElement) {
      expect(item.startsWith(`${site}/`)).toBe(true);
      expect(new URL(item).href).toBe(item);
    }
  });

  it('ends with the page itself at its own canonical address', () => {
    const doc = page(dirs.with, file);
    const last = list(doc).itemListElement.at(-1);
    expect(last?.item).toBe(
      doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    );
  });

  it('is written with no block when the site address is not set', () => {
    expect(blocks(page(dirs.without, file))).toEqual([]);
  });

  it('keeps the page text out of the script: no raw < inside the block', () => {
    const found = blocks(page(dirs.with, file));
    expect(found).toHaveLength(1);
    expect(found[0]).not.toContain('<');
  });
});

describe('pages that get no block', () => {
  it('the 404 page has none', () => {
    expect(blocks(page(dirs.with, '404.html'))).toEqual([]);
    expect(blocks(page(dirs.without, '404.html'))).toEqual([]);
  });

  it('the calculator home page has none', () => {
    expect(blocks(page(dirs.with, 'index.html'))).toEqual([]);
    expect(blocks(page(dirs.without, 'index.html'))).toEqual([]);
  });

  it('the calculator template, index.html, has none', () => {
    expect(
      blocks(new DOMParser().parseFromString(template, 'text/html')),
    ).toEqual([]);
  });
});
