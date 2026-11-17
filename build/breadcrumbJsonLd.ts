import type { BreadcrumbTrail } from '../src/state/breadcrumbs';
import { jsonText } from './salaryPages/pageHtml';

/**
 * The structured data of a page's breadcrumb: a schema.org BreadcrumbList with
 * one item for each step and a last item for the page itself. Addresses are the
 * site address plus each step's path; the text is escaped like `dataBlock`'s.
 */
export function breadcrumbJsonLd(
  trail: BreadcrumbTrail,
  siteUrl: string,
  pagePath: string,
): string {
  const items = [
    ...trail.steps.map((step) => ({ name: step.label, path: step.href })),
    { name: trail.current, path: pagePath },
  ];
  const list = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, at) => ({
      '@type': 'ListItem',
      position: at + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
  return `<script type="application/ld+json">${jsonText(list)}</script>`;
}
