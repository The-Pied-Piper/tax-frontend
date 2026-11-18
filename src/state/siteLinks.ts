/** The one place that says where a content page lives on the site. */

const SEGMENT = '[a-z0-9][a-z0-9-]*';
const SLUG = new RegExp(`^${SEGMENT}(?:/${SEGMENT})*$`);
const INDEX = '/index.html';

/** The page the footer's "How we calculate" link goes to. */
export const METHODOLOGY_SLUG = 'methodology';

/** The folder, below the site root, that every form page lives in. */
export const FORMS_SEGMENT = 'forms';

/** The address of the open-source engine's code, which the methodology page and the star button link to. */
export const ENGINE_REPO_URL = 'https://github.com/The-Pied-Piper/tax-engine';

/** The address of the calculator. */
export const HOME_PATH = '/';

/** The file, at the top of the output, that the host serves for an address with no page; not a slug or a page address. */
export const NOT_FOUND_FILE = '404.html';

/** The province pages the footer links to, in the order shown. Their names are in `strings.siteNav.provinceNames`. */
export const FOOTER_PROVINCE_SLUGS = [
  'ca-on',
  'ca-ab',
  'ca-bc',
  'ca-mb',
  'ca-sk',
] as const;

/** The province pages the footer links to, by slug. */
export type FooterProvinceSlug = (typeof FOOTER_PROVINCE_SLUGS)[number];

/** The footer provinces that have a hub but no salary pages yet (the API does not serve them); their hubs promise no salary examples. */
export const PROVINCES_WITHOUT_SALARY_PAGES: readonly FooterProvinceSlug[] = [
  'ca-sk',
];

/** Whether this is a slug: lower-case letters, digits and hyphens, in segments separated by "/". */
export function isContentSlug(slug: string): boolean {
  return SLUG.test(slug);
}

/** The slug of a form page, such as `forms/on428`. */
export function formSlug(id: string): string {
  return `${FORMS_SEGMENT}/${id}`;
}

/** The address of a content page, such as `/ca-on/`. */
export function contentPath(slug: string): string {
  return `/${slug}/`;
}

/** The address of a salary page, such as `/ca-on/70000/`. */
export function salaryPagePath(slug: string, salary: string | number): string {
  return `/${slug}/${salary.toString()}/`;
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
