// Test data only: nothing in the build imports this file. The hub and
// "Learn more" links of a pre-built Ontario page, for the tests that build a
// SalaryPageLinks by hand.
import type { SalaryPageLinks } from '../state/useTakeHome';

/** The slugs of the content pages a build has written, for the page tests. */
export const publishedSlugs: ReadonlySet<string> = new Set([
  'methodology',
  'forms/on428',
]);

/** The hub step of an Ontario page. */
export const ontarioHub = { label: 'Ontario', href: '/ca-on/' };

/** The three "Learn more" links of an Ontario page when its form page exists. */
export const ontarioLearnMore = [
  { label: 'Ontario forms and salary pages', href: '/ca-on/' },
  { label: 'How we calculate', href: '/methodology/' },
  { label: 'What is Form ON428: Ontario Tax?', href: '/forms/on428/' },
];

/** The new link fields an Ontario page carries, to spread into a links object. */
export const ontarioTargets: Pick<
  SalaryPageLinks,
  'hub' | 'learnMore' | 'rates'
> = {
  hub: ontarioHub,
  learnMore: ontarioLearnMore,
  rates: null,
};

/** Links with no neighbours, for tests that only need a valid links object. */
export const bareLinks: SalaryPageLinks = {
  calculator: '/',
  previous: null,
  next: null,
  others: [],
  ...ontarioTargets,
};

/** The hub step and "Learn more" links of an Alberta page when no Alberta form page is published. */
export const albertaTargets: Pick<
  SalaryPageLinks,
  'hub' | 'learnMore' | 'rates'
> = {
  hub: { label: 'Alberta', href: '/ca-ab/' },
  rates: null,
  learnMore: [
    { label: 'Alberta forms and salary pages', href: '/ca-ab/' },
    { label: 'How we calculate', href: '/methodology/' },
  ],
};
