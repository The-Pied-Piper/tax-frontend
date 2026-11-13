// Test data only: nothing in the build imports this file. Readers of a written
// output folder, shared by the crawl tests.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteUrl as site } from './generatedSite';

export { site };

export function parse(dir: string, file: string): Document {
  return new DOMParser().parseFromString(
    readFileSync(join(dir, file), 'utf8'),
    'text/html',
  );
}

/** The file a site-internal address is served from, or null for an outside address. */
export function fileFor(href: string): string | null {
  const url = new URL(href, `${site}/ca-on/70000/`);
  if (url.origin !== site) return null;
  return url.pathname.endsWith('/')
    ? `${url.pathname.slice(1)}index.html`
    : url.pathname.slice(1);
}

export function sitemapLocs(dir: string): string[] {
  const xml = readFileSync(join(dir, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1] ?? '');
}

export function navHrefs(dir: string, file: string): (string | null)[] {
  return [...parse(dir, file).querySelectorAll('nav a[href]')].map((a) =>
    a.getAttribute('href'),
  );
}

/** Every internal link on every written page, as [page, target file]. */
export function internalLinks(dir: string, written: string[]) {
  return written.flatMap((file) =>
    [...parse(dir, file).querySelectorAll('a[href]')].flatMap((a) => {
      const target = fileFor(a.getAttribute('href') ?? '');
      return target === null ? [] : [{ file, target }];
    }),
  );
}
