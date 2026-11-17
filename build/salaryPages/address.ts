import { contentPath, contentSlugOfFile } from '../../src/state/siteLinks';

/** The address of a salary page on the site: the one place that says where a page lives. */
export function pagePath(slug: string, salary: string | number): string {
  return `/${slug}/${salary.toString()}/`;
}

/** Whether this slug has the shape of a salary page's folder, such as `ca-on/70000`. */
export function isSalaryAddress(slug: string): boolean {
  return /^[a-z0-9-]+\/\d+$/.test(slug);
}

/** The full address of a salary page under the site origin. */
export function pageUrl(
  origin: string,
  slug: string,
  salary: string | number,
): string {
  return `${origin}${pagePath(slug, salary)}`;
}

/** The address of a written page, from its path such as `ca-on/70000/index.html` or `methodology/index.html`. */
export function addressOf(file: string): string {
  return contentPath(contentSlugOfFile(file));
}
