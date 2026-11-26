import { strings } from '../strings';
import { provinceHubs } from './provinceHubs';
import {
  contentPath,
  formSlug,
  METHODOLOGY_SLUG,
  ratesSlug,
} from './siteLinks';
import type { SalaryPageLinks } from './useTakeHome';

/**
 * The province hub and the "Learn more" links of a pre-built salary page: the
 * hub, the methodology page and the province's main form page, and the link to the
 * province's rates page with this page's salary in its address. A page is linked
 * only when `published` (the slugs of the pages in the build) has it.
 */
export function provinceLinks(
  slug: string,
  provinceName: string,
  published: ReadonlySet<string>,
  salary: string,
): Pick<SalaryPageLinks, 'hub' | 'learnMore' | 'rates'> {
  const hubPath = contentPath(slug);
  const learnMore = [
    { label: strings.formPage.hub(provinceName), href: hubPath },
    { label: strings.siteNav.methodology, href: contentPath(METHODOLOGY_SLUG) },
  ];
  const hubText = provinceHubs.find((hub) => hub.slug === slug);
  const form = hubText?.own[0];
  if (form && published.has(formSlug(form.id))) {
    learnMore.push({
      label: strings.learnMore.form(form.name),
      href: contentPath(formSlug(form.id)),
    });
  }
  const ratesPath = hubText && ratesSlug(hubText.slug);
  const rates =
    ratesPath !== undefined && published.has(ratesPath)
      ? {
          label: strings.ratesLink.salaryLink(provinceName),
          href: `${contentPath(ratesPath)}?salary=${salary}`,
        }
      : null;
  return { hub: { label: provinceName, href: hubPath }, learnMore, rates };
}
