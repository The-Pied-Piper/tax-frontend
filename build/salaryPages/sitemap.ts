import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sitemapXml } from '../seo';
import { pagePath } from './address';

/** The address of a written page, from its path such as `ca-on/70000/index.html`. */
function addressOf(file: string): string {
  const [slug, salary, name, ...rest] = file.split('/');
  if (!slug || !salary || name !== 'index.html' || rest.length > 0) {
    throw new Error(`Sitemap: unexpected page path ${file}`);
  }
  return pagePath(slug, salary);
}

/**
 * Replaces dist/sitemap.xml with the calculator and exactly the pages that were
 * written. With no site address there is no sitemap, so nothing is written.
 */
export async function rewriteSitemap(
  outDir: string,
  siteUrl: string | null,
  written: string[],
): Promise<void> {
  if (siteUrl === null) return;
  await writeFile(
    join(outDir, 'sitemap.xml'),
    sitemapXml(siteUrl, written.map(addressOf)),
  );
}
