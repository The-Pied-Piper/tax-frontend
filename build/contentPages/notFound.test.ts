import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderContentPage } from '../salaryPages/prerender';
import { rewriteSitemap } from '../salaryPages/sitemap';
import { robotsTxt, sitemapXml } from '../seo';
import {
  siteUrl as site,
  contentTemplate as template,
  template as calculatorTemplate,
  tmpDirs,
} from '../../src/test/generatedSite';
import {
  FOOTER_TARGETS,
  fileFor,
  internalLinks,
  parse,
  sitemapLocs,
} from '../../src/test/crawlSite';
import { plainSpec } from '../../src/test/contentPageData';
import { notFoundPage } from '../../src/state/notFoundPage';
import {
  COMPARE_SLUG,
  FOOTER_PROVINCE_SLUGS,
  METHODOLOGY_SLUG,
  NOT_FOUND_FILE,
} from '../../src/state/siteLinks';
import type { ContentPageSpec } from '../../src/state/contentPages';
import { generateContentPages } from './generate';
import { generateNotFoundPage } from './notFound';

const outDir = tmpDirs('not-found');

function render(spec: ContentPageSpec): string {
  return `<main><h1>${spec.heading}</h1><p>rendered ${spec.slug}</p></main>`;
}

async function run(dir: string, fn: typeof render = render) {
  return Promise.resolve().then(() =>
    generateNotFoundPage({
      outDir: dir,
      template,
      render: fn,
      spec: notFoundPage,
    }),
  );
}

describe('generateNotFoundPage', () => {
  it('writes exactly 404.html at the top of the output folder and returns its name', async () => {
    const dir = outDir();
    const name = await run(dir);
    expect(name).toBe(NOT_FOUND_FILE);
    expect(readdirSync(dir, { recursive: true }).map(String)).toEqual([
      '404.html',
    ]);
  });

  it('asks search engines not to index it', async () => {
    const dir = outDir();
    await run(dir);
    const page = parse(dir, '404.html');
    expect(
      page.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('noindex');
  });

  it('has no canonical link and no og:url', async () => {
    const dir = outDir();
    await run(dir);
    const page = parse(dir, '404.html');
    expect(page.querySelector('link[rel="canonical"]')).toBeNull();
    expect(page.querySelector('meta[property="og:url"]')).toBeNull();
  });

  it('has its own title and description', async () => {
    const dir = outDir();
    await run(dir);
    const page = parse(dir, '404.html');
    expect(page.title).toBe(notFoundPage.title);
    expect(
      page.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe(notFoundPage.description);
  });

  it('contains the rendered page in #root', async () => {
    const dir = outDir();
    await run(dir);
    const page = parse(dir, '404.html');
    expect(page.querySelector('#root h1')?.textContent).toBe(
      notFoundPage.heading,
    );
    expect(page.getElementById('root')?.textContent).toContain(
      'rendered not-found',
    );
  });

  it('has no script beyond the template theme-init and content module: no data block, no beacon', async () => {
    const dir = outDir();
    await run(dir);
    const scripts = (doc: Document) =>
      [...doc.querySelectorAll('script')].map((s) => ({
        src: s.getAttribute('src'),
        type: s.getAttribute('type'),
        text: s.textContent,
      }));
    const own = scripts(parse(dir, '404.html'));
    const base = scripts(
      new DOMParser().parseFromString(template, 'text/html'),
    );
    expect(own).toEqual(base);
    expect(own.every((s) => s.src !== null && s.text === '')).toBe(true);
  });

  it('fails when the template has no </head>', async () => {
    const dir = outDir();
    await expect(
      Promise.resolve().then(() =>
        generateNotFoundPage({
          outDir: dir,
          template: '<html><body><div id="root"></div></body></html>',
          render,
          spec: notFoundPage,
        }),
      ),
    ).rejects.toThrow();
  });
});

describe('the 404 page and the sitemap', () => {
  async function build() {
    const dir = outDir();
    writeFileSync(join(dir, 'index.html'), calculatorTemplate);
    const { written } = await generateContentPages({
      outDir: dir,
      template,
      pages: [plainSpec],
      render: renderContentPage,
      siteUrl: site,
    });
    await generateNotFoundPage({
      outDir: dir,
      template,
      render: renderContentPage,
      spec: notFoundPage,
    });
    await rewriteSitemap(dir, site, written);
    return { dir, written };
  }

  it('is not in a sitemap built from the other pages', async () => {
    const { dir } = await build();
    expect(existsSync(join(dir, '404.html'))).toBe(true);
    const locs = sitemapLocs(dir);
    expect(locs).toEqual([`${site}/`, `${site}/plain-page/`]);
    for (const loc of locs) expect(loc).not.toMatch(/404|not-found/);
    expect(readFileSync(join(dir, 'sitemap.xml'), 'utf8')).not.toMatch(
      /404|not-found/,
    );
  });

  it('is not in the sitemap text built from the same addresses', () => {
    const xml = sitemapXml(site, ['/plain-page/']);
    expect(xml).not.toMatch(/404|not-found/);
  });

  it('leaves robots.txt unchanged, with no mention of 404', () => {
    expect(robotsTxt(site)).toBe(
      `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`,
    );
    expect(robotsTxt(null)).toBe('User-agent: *\nAllow: /\n');
    expect(robotsTxt(site)).not.toMatch(/404|not-found/);
  });
});

describe('crawl of the 404 page', () => {
  it('links only to files the build writes', async () => {
    const dir = outDir();
    writeFileSync(join(dir, 'index.html'), calculatorTemplate);
    const slugs = [METHODOLOGY_SLUG, COMPARE_SLUG, ...FOOTER_PROVINCE_SLUGS];
    await generateContentPages({
      outDir: dir,
      template,
      pages: slugs.map((slug) => ({ ...plainSpec, slug })),
      render: renderContentPage,
      siteUrl: site,
    });
    const name = await generateNotFoundPage({
      outDir: dir,
      template,
      render: renderContentPage,
      spec: notFoundPage,
    });
    const links = internalLinks(dir, [name]);
    expect(links.map((l) => l.target)).toEqual(
      expect.arrayContaining(['index.html', ...FOOTER_TARGETS]),
    );
    for (const { target } of links) {
      expect(existsSync(join(dir, target)), target).toBe(true);
    }
  });

  it('uses absolute paths or fragments only, none relative', async () => {
    const dir = outDir();
    const name = await generateNotFoundPage({
      outDir: dir,
      template,
      render: renderContentPage,
      spec: notFoundPage,
    });
    const hrefs = [...parse(dir, name).querySelectorAll('a[href]')].map(
      (a) => a.getAttribute('href') ?? '',
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href, href).toMatch(/^(\/(?!\/)|#|https:\/\/)/);
      expect(fileFor(href) === null || href.startsWith('/')).toBe(true);
    }
  });
});
