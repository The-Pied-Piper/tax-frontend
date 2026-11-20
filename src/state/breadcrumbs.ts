import { strings } from '../strings';
import type { ContentPageSpec } from './contentPages';
import { contentPath, HOME_PATH } from './siteLinks';
import type { PageLink } from './useTakeHome';

/** The trail of a page: the linked steps, nearest the site root first, and the page being read. */
export type BreadcrumbTrail = {
  steps: PageLink[];
  current: string;
};

/** The first step of every trail, so the home link reads the same on every page and in the structured data. */
export function homeStep(): PageLink {
  return { label: strings.siteNav.home, href: HOME_PATH };
}

/** The trail of a content page: Home, the pages of its trail, then its heading. */
export function contentBreadcrumb(
  spec: Pick<ContentPageSpec, 'heading' | 'trail'>,
): BreadcrumbTrail {
  return {
    steps: [
      homeStep(),
      ...spec.trail.map((step) => ({
        label: step.label,
        href: contentPath(step.slug),
      })),
    ],
    current: spec.heading,
  };
}

/** The trail of a salary page: Home, the province hub, then the salary shown. */
export function salaryBreadcrumb(
  hub: PageLink,
  salaryLabel: string,
): BreadcrumbTrail {
  return {
    steps: [homeStep(), hub],
    current: salaryLabel,
  };
}
