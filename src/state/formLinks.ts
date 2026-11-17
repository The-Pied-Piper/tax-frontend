import { contentPath, formSlug } from './siteLinks';

/**
 * The address of the page that explains a form, such as `/forms/on428/`, or
 * null when its page is not published. `pageId` is the form's page id, which
 * the adapters carry on each group (`adapters/formPages`); `published` is the
 * ids of the form pages, set at build time.
 */
export function formPageLink(
  pageId: string,
  published: readonly string[] = __FORM_PAGE_IDS__,
): string | null {
  if (!published.includes(pageId)) return null;
  return contentPath(formSlug(pageId));
}
