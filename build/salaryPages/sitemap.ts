import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sitemapXml } from '../seo';
import { addressOf } from './address';

/**
 * Replaces dist/sitemap.xml with the calculator and exactly the pages that were
 * written, each with its last-modified date when it has one. With no site
 * address there is no sitemap, so nothing is written.
 */
export async function rewriteSitemap(
  outDir: string,
  siteUrl: string | null,
  written: string[],
  lastmods: Record<string, string> = {},
): Promise<void> {
  if (siteUrl === null) return;
  await writeFile(
    join(outDir, 'sitemap.xml'),
    sitemapXml(siteUrl, written.map(addressOf), lastmods),
  );
}
