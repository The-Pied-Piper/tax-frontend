import { mkdtempSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rewriteSitemap } from './sitemap';

const made: string[] = [];
function outDir() {
  const dir = mkdtempSync(join(tmpdir(), 'sitemap-'));
  made.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of made.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

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
});
