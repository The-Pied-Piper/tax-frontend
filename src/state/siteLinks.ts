/** The one place that says where a content page lives on the site. */

const SEGMENT = '[a-z0-9][a-z0-9-]*';
const SLUG = new RegExp(`^${SEGMENT}(?:/${SEGMENT})*$`);
const INDEX = '/index.html';

/** The page the footer's "How we calculate" link goes to. */
export const METHODOLOGY_SLUG = 'methodology';

/** The provinces the footer links to, in the order shown. */
export const FOOTER_PROVINCES: { name: string; slug: string }[] = [
  { name: 'Ontario', slug: 'ca-on' },
  { name: 'Alberta', slug: 'ca-ab' },
  { name: 'British Columbia', slug: 'ca-bc' },
];

/** Whether this is a slug: lower-case letters, digits and hyphens, in segments separated by "/". */
export function isContentSlug(slug: string): boolean {
  return SLUG.test(slug);
}

/** The address of a content page, such as `/ca-on/`. */
export function contentPath(slug: string): string {
  return `/${slug}/`;
}

/** The file of a content page below the output folder, such as `ca-on/index.html`. */
export function contentFile(slug: string): string {
  return `${slug}${INDEX}`;
}

/** The slug of a content page file; throws on a path that is not `<slug>/index.html`. */
export function contentSlugOfFile(file: string): string {
  const slug = file.endsWith(INDEX) ? file.slice(0, -INDEX.length) : '';
  if (!isContentSlug(slug)) {
    throw new Error(`Unexpected page path ${file}`);
  }
  return slug;
}
