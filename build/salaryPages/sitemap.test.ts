import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpDirs } from '../../src/test/generatedSite';
import { rewriteSitemap } from './sitemap';

const outDir = tmpDirs('sitemap');

function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1] ?? '');
}

const site = 'https://aftertaxlens.com';
// What the generator reports: paths relative to the output folder.
const written = [
  'ca-on/30000/index.html',
  'ca-on/70000/index.html',
  'ca-on/150000/index.html',
];

describe('rewriteSitemap(outDir, siteUrl, written)', () => {
  it('replaces dist/sitemap.xml with the calculator and exactly the written pages', async () => {
    const dir = outDir();
    writeFileSync(join(dir, 'sitemap.xml'), 'old');
    await rewriteSitemap(dir, site, written);
    expect(locs(readFileSync(join(dir, 'sitemap.xml'), 'utf8'))).toEqual([
      `${site}/`,
      `${site}/ca-on/30000/`,
      `${site}/ca-on/70000/`,
      `${site}/ca-on/150000/`,
    ]);
  });

  it('is a valid urlset', async () => {
    const dir = outDir();
    await rewriteSitemap(dir, site, written);
    const xml = readFileSync(join(dir, 'sitemap.xml'), 'utf8');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    expect(doc.documentElement.localName).toBe('urlset');
  });

  it('lists only the calculator when nothing was written', async () => {
    const dir = outDir();
    await rewriteSitemap(dir, site, []);
    expect(locs(readFileSync(join(dir, 'sitemap.xml'), 'utf8'))).toEqual([
      `${site}/`,
    ]);
  });

  it('writes no sitemap when the site address is not set', async () => {
    const dir = outDir();
    await rewriteSitemap(dir, null, written);
    expect(existsSync(join(dir, 'sitemap.xml'))).toBe(false);
  });

  describe('with lastmods', () => {
    const lastmods = {
      '/': '2026-01-02',
      '/ca-on/30000/': '2026-03-04',
      '/ca-on/70000/': '2026-11-16',
      '/ca-on/150000/': '2026-11-16',
    };

    it('gives every <url> a <lastmod> in YYYY-MM-DD after its <loc>', async () => {
      const dir = outDir();
      await rewriteSitemap(dir, site, written, lastmods);
      const xml = readFileSync(join(dir, 'sitemap.xml'), 'utf8');
      const urls = [...xml.matchAll(/<url>(.*?)<\/url>/gs)].map((m) => m[1]);
      expect(urls).toHaveLength(4);
      for (const url of urls) {
        expect(url).toMatch(
          /^\s*<loc>[^<]*<\/loc>\s*<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>\s*$/,
        );
      }
      expect(xml).toContain(`<loc>${site}/</loc><lastmod>2026-01-02</lastmod>`);
      expect(xml).toContain(
        `<loc>${site}/ca-on/30000/</loc><lastmod>2026-03-04</lastmod>`,
      );
    });

    it('still writes a valid urlset', async () => {
      const dir = outDir();
      await rewriteSitemap(dir, site, written, lastmods);
      const doc = new DOMParser().parseFromString(
        readFileSync(join(dir, 'sitemap.xml'), 'utf8'),
        'application/xml',
      );
      expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
      expect(doc.getElementsByTagName('lastmod')).toHaveLength(4);
    });

    it('writes no sitemap when the site address is not set, even with lastmods', async () => {
      const dir = outDir();
      await rewriteSitemap(dir, null, written, lastmods);
      expect(existsSync(join(dir, 'sitemap.xml'))).toBe(false);
    });
  });
});
