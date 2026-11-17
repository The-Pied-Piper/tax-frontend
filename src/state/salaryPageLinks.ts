import { strings } from '../strings';
import { provinceHubs } from './provinceHubs';
import { contentPath, formSlug, METHODOLOGY_SLUG } from './siteLinks';
import type { SalaryPageLinks } from './useTakeHome';

/**
 * The province hub and the "Learn more" links of a pre-built salary page: the
 * hub, the methodology page and the province's main form page. A form page is
 * linked only when `published` (the slugs of the pages in the build) has it.
 */
export function provinceLinks(
  slug: string,
  provinceName: string,
  published: ReadonlySet<string>,
): Pick<SalaryPageLinks, 'hub' | 'learnMore'> {
  const hubPath = contentPath(slug);
  const learnMore = [
    { label: strings.formPage.hub(provinceName), href: hubPath },
    { label: strings.siteNav.methodology, href: contentPath(METHODOLOGY_SLUG) },
  ];
  const form = provinceHubs.find((hub) => hub.slug === slug)?.own[0];
  if (form && published.has(formSlug(form.id))) {
    learnMore.push({
      label: strings.learnMore.form(form.name),
      href: contentPath(formSlug(form.id)),
    });
  }
  return { hub: { label: provinceName, href: hubPath }, learnMore };
}
