import { strings } from '../strings';
import type { ContentPageSpec } from './contentPages';
import { contentPath, HOME_PATH } from './siteLinks';
import type { PageLink } from './useTakeHome';

/** The trail of a page: the linked steps, nearest the site root first, and the page being read. */
export type BreadcrumbTrail = {
  steps: PageLink[];
  current: string;
};

/** The trail of a content page: Home, the pages of its trail, then its heading. */
export function contentBreadcrumb(
  spec: Pick<ContentPageSpec, 'heading' | 'trail'>,
): BreadcrumbTrail {
  return {
    steps: [
      { label: strings.siteNav.home, href: HOME_PATH },
      ...spec.trail.map((step) => ({
        label: step.label,
        href: contentPath(step.slug),
      })),
    ],
    current: spec.heading,
  };
}

/** The trail of a salary page: the calculator, the province hub, then the salary shown. */
export function salaryBreadcrumb(
  hub: PageLink,
  salaryLabel: string,
): BreadcrumbTrail {
  return {
    steps: [{ label: strings.siteNav.calculator, href: HOME_PATH }, hub],
    current: salaryLabel,
  };
}
