// Test data only: nothing in the build imports this file. Readers of a written
// output folder, shared by the crawl tests.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { siteUrl as site } from './generatedSite';
import {
  contentFile,
  FOOTER_PROVINCES,
  METHODOLOGY_SLUG,
} from '../state/siteLinks';

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

/**
 * The pages the footer links to. The hubs and the methodology page come from
 * later tickets, so a built folder without them is allowed to lack these files.
 */
export const FOOTER_TARGETS: string[] = [
  contentFile(METHODOLOGY_SLUG),
  ...FOOTER_PROVINCES.map((p) => contentFile(p.slug)),
];

/** Every internal link on every written page, as [page, target file]; the footer links are included. */
export function internalLinks(dir: string, written: string[]) {
  return written.flatMap((file) =>
    [...parse(dir, file).querySelectorAll('a[href]')].flatMap((a) => {
      const target = fileFor(a.getAttribute('href') ?? '');
      return target === null ? [] : [{ file, target }];
    }),
  );
}

/** The internal links that must resolve to a written file: every link except the footer's. */
export function linksToWrittenFiles(dir: string, written: string[]) {
  return internalLinks(dir, written).filter(
    ({ target }) => !FOOTER_TARGETS.includes(target),
  );
}
