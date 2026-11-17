import { render, screen, within } from '@testing-library/react';
import { contentBreadcrumb } from '../state/breadcrumbs';
import { strings } from '../strings';
import { plainSpec, sampleSpec } from '../test/contentPageData';
import { ContentPage } from './ContentPage';

/** The links and the plain last step of the page's breadcrumb, as a visitor reads them. */
function visibleTrail() {
  const crumbs = screen.getByRole('navigation', {
    name: strings.siteNav.breadcrumb,
  });
  const current = crumbs.querySelector('li[aria-current="page"]');
  return {
    steps: within(crumbs)
      .getAllByRole('link')
      .map((a) => ({ label: a.textContent, href: a.getAttribute('href') })),
    current: current?.textContent,
  };
}

// The structured data in the page's head is built from contentBreadcrumb, so
// the visible trail must be the same value: the two cannot drift.
describe('ContentPage breadcrumb and contentBreadcrumb', () => {
  it('show the same links and current page for a page with a trail', () => {
    expect(sampleSpec.trail.length).toBeGreaterThan(0);
    render(<ContentPage {...sampleSpec} />);
    expect(visibleTrail()).toEqual(contentBreadcrumb(sampleSpec));
  });

  it('show the same links and current page for a page with no trail', () => {
    render(<ContentPage {...plainSpec} />);
    expect(visibleTrail()).toEqual(contentBreadcrumb(plainSpec));
  });
});
