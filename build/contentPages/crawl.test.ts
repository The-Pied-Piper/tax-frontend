import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderContentPage } from '../salaryPages/prerender';
import {
  siteUrl as site,
  template,
  tmpDirs,
} from '../../src/test/generatedSite';
import {
  fileFor,
  internalLinks,
  parse,
  sitemapLocs,
} from '../../src/test/crawlSite';
import { plainSpec } from '../../src/test/contentPageData';
import {
  contentFile,
  contentPath,
  FOOTER_PROVINCES,
  METHODOLOGY_SLUG,
} from '../../src/state/siteLinks';
import { rewriteSitemap } from '../salaryPages/sitemap';
import { generateContentPages } from './generate';

const outDir = tmpDirs('content-crawl');

/**
 * The footer links to pages that later tickets add. They are the one allowed
 * exception to "every link goes to a file that exists".
 */
const FOOTER_TARGETS = [
  'methodology/index.html',
  'ca-on/index.html',
  'ca-ab/index.html',
  'ca-bc/index.html',
];

async function build() {
  const dir = outDir();
  writeFileSync(join(dir, 'index.html'), template);
  const { written } = await generateContentPages({
    outDir: dir,
    template,
    pages: [plainSpec],
    render: renderContentPage,
    siteUrl: site,
  });
  await rewriteSitemap(dir, site, written);
  return { dir, written };
}

describe('crawl of a built one-entry content page folder', () => {
  it('names the footer targets from the one place that knows them', () => {
    expect(FOOTER_TARGETS).toEqual([
      contentFile(METHODOLOGY_SLUG),
      ...FOOTER_PROVINCES.map((p) => contentFile(p.slug)),
    ]);
  });

  it('links only to files that exist, except the footer targets', async () => {
    const { dir, written } = await build();
    const links = internalLinks(dir, written);
    expect(links.length).toBeGreaterThan(0);
    for (const { file, target } of links) {
      if (FOOTER_TARGETS.includes(target)) continue;
      expect(existsSync(join(dir, target)), `${file} -> ${target}`).toBe(true);
    }
  });

  it('links to every footer target from the page', async () => {
    const { dir, written } = await build();
    const targets = internalLinks(dir, written).map((l) => l.target);
    for (const target of FOOTER_TARGETS) expect(targets).toContain(target);
  });

  it('lists the page in the sitemap, and its canonical is that entry', async () => {
    const { dir, written } = await build();
    expect(sitemapLocs(dir)).toEqual([
      `${site}/`,
      `${site}${contentPath(plainSpec.slug)}`,
    ]);
    const canonical = parse(dir, written[0] ?? '')
      .querySelector('link[rel="canonical"]')
      ?.getAttribute('href');
    expect(sitemapLocs(dir)).toContain(canonical);
    expect(fileFor(canonical ?? '')).toBe(written[0]);
  });
});
