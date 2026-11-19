import { render, screen, within } from '@testing-library/react';
import { SiteFooter } from './SiteFooter';
import { strings } from '../strings';
import {
  contentPath,
  FOOTER_PROVINCE_SLUGS,
  METHODOLOGY_SLUG,
} from '../state/siteLinks';

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe.each(['light', 'dark'] as const)(
  'SiteFooter in the %s theme',
  (theme) => {
    beforeEach(() => {
      document.documentElement.dataset.theme = theme;
    });

    it('is the page footer with a labelled nav inside', () => {
      render(<SiteFooter />);
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('page-footer');
      expect(
        within(footer).getByRole('navigation', { name: strings.siteNav.label }),
      ).toBeInTheDocument();
    });

    it('links to how we calculate, with plain anchors', () => {
      render(<SiteFooter />);
      const link = screen.getByRole('link', { name: 'How we calculate' });
      expect(link).toHaveAttribute('href', contentPath(METHODOLOGY_SLUG));
      expect(link).toHaveAttribute('href', '/methodology/');
      expect(link.tagName).toBe('A');
    });

    it('shows "Provinces:" and then the six province links', () => {
      render(<SiteFooter />);
      const nav = screen.getByRole('navigation', {
        name: strings.siteNav.label,
      });
      expect(nav).toHaveTextContent('Provinces:');
      const hrefs = within(nav)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]);
      expect(hrefs).toEqual([
        ['How we calculate', '/methodology/'],
        ['Ontario', '/ca-on/'],
        ['Alberta', '/ca-ab/'],
        ['British Columbia', '/ca-bc/'],
        ['Manitoba', '/ca-mb/'],
        ['Saskatchewan', '/ca-sk/'],
        ['Newfoundland and Labrador', '/ca-nl/'],
      ]);
      expect(
        FOOTER_PROVINCE_SLUGS.map(
          (slug) => strings.siteNav.provinceNames[slug],
        ),
      ).toEqual([
        'Ontario',
        'Alberta',
        'British Columbia',
        'Manitoba',
        'Saskatchewan',
        'Newfoundland and Labrador',
      ]);
    });

    it('puts the disclaimer word for word below the links', () => {
      render(<SiteFooter />);
      const footer = screen.getByRole('contentinfo');
      const nav = within(footer).getByRole('navigation');
      expect(footer).toHaveTextContent(strings.footer);
      expect(nav).not.toHaveTextContent(strings.footer);
      const disclaimer = within(footer).getByText(strings.footer);
      expect(
        nav.compareDocumentPosition(disclaimer) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });
  },
);

describe('siteNav strings', () => {
  it('has the words the footer and the breadcrumb use', () => {
    expect(strings.siteNav.label.length).toBeGreaterThan(0);
    expect(strings.siteNav.breadcrumb.length).toBeGreaterThan(0);
    expect(strings.siteNav.methodology).toBe('How we calculate');
    expect(strings.siteNav.provinces).toBe('Provinces:');
  });
});
