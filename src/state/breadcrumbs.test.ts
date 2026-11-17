import { HOME_PATH, contentPath } from './siteLinks';
import { strings } from '../strings';
import { contentBreadcrumb, salaryBreadcrumb } from './breadcrumbs';

// The one place the visible trail is worked out: the breadcrumb on a page and
// the structured data in its head both come from these functions.
describe('contentBreadcrumb', () => {
  it('is Home, then the trail, then the heading as the current page', () => {
    expect(
      contentBreadcrumb({
        heading: 'Form ON428',
        trail: [
          { label: 'Forms', slug: 'forms' },
          { label: 'Ontario', slug: 'ca-on' },
        ],
      }),
    ).toEqual({
      steps: [
        { label: strings.siteNav.home, href: HOME_PATH },
        { label: 'Forms', href: contentPath('forms') },
        { label: 'Ontario', href: contentPath('ca-on') },
      ],
      current: 'Form ON428',
    });
  });

  it('is Home and the heading when the trail is empty', () => {
    expect(contentBreadcrumb({ heading: 'Methodology', trail: [] })).toEqual({
      steps: [{ label: strings.siteNav.home, href: HOME_PATH }],
      current: 'Methodology',
    });
  });
});

describe('salaryBreadcrumb', () => {
  it('is Calculator, then the hub link, then the salary label as the current page', () => {
    expect(
      salaryBreadcrumb({ label: 'Ontario', href: '/ca-on/' }, '$75,000'),
    ).toEqual({
      steps: [
        { label: strings.siteNav.calculator, href: HOME_PATH },
        { label: 'Ontario', href: '/ca-on/' },
      ],
      current: '$75,000',
    });
  });
});
