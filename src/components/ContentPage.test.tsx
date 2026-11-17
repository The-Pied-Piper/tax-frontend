import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ContentPage } from './ContentPage';
import { strings } from '../strings';
import { THEME_STORAGE_KEY } from '../theme/theme';
import { blocksSpec, plainSpec, sampleSpec } from '../test/contentPageData';

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe.each(['light', 'dark'] as const)(
  'ContentPage in the %s theme',
  (theme) => {
    beforeEach(() => {
      document.documentElement.dataset.theme = theme;
    });

    it('shows the heading as the one h1 and the lede under it', () => {
      render(<ContentPage {...sampleSpec} />);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(
        screen.getByRole('heading', { level: 1, name: sampleSpec.heading }),
      ).toBeInTheDocument();
      expect(screen.getByText(sampleSpec.lede ?? '')).toHaveClass('lede');
    });

    it('shows no lede paragraph when the page has none', () => {
      const { container } = render(<ContentPage {...plainSpec} />);
      expect(container.querySelector('.lede')).toBeNull();
    });

    it('renders each section as an h2 with its paragraphs', () => {
      render(<ContentPage {...sampleSpec} />);
      for (const section of sampleSpec.sections) {
        expect(
          screen.getByRole('heading', { level: 2, name: section.heading }),
        ).toBeInTheDocument();
        for (const paragraph of section.paragraphs) {
          expect(screen.getByText(paragraph)).toBeInTheDocument();
        }
      }
    });

    it('has the footer with the site links and the disclaimer', () => {
      render(<ContentPage {...sampleSpec} />);
      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveTextContent(strings.footer);
      expect(
        within(footer).getByRole('link', { name: 'How we calculate' }),
      ).toHaveAttribute('href', '/methodology/');
      expect(
        within(footer).getByRole('link', { name: 'Ontario' }),
      ).toHaveAttribute('href', '/ca-on/');
    });
  },
);

describe('ContentPage breadcrumb', () => {
  it('goes Home, the trail links, then the current heading as plain text', () => {
    render(<ContentPage {...sampleSpec} />);
    const crumbs = screen.getByRole('navigation', {
      name: strings.siteNav.breadcrumb,
    });
    expect(
      within(crumbs)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['Home', '/'],
      ['Sample hub', '/sample-hub/'],
    ]);
    const current = within(crumbs).getByText(sampleSpec.heading);
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('a')).toBeNull();
  });

  it('is just Home and the current page when the trail is empty', () => {
    render(<ContentPage {...plainSpec} />);
    const crumbs = screen.getByRole('navigation', {
      name: strings.siteNav.breadcrumb,
    });
    expect(within(crumbs).getAllByRole('link')).toHaveLength(1);
    expect(within(crumbs).getByText(plainSpec.heading)).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

describe('ContentPage theme switch', () => {
  it('has the Light/Dark switch in the #content-theme-toggle slot', () => {
    const { container } = render(<ContentPage {...sampleSpec} />);
    const slot = container.querySelector('#content-theme-toggle');
    expect(slot).not.toBeNull();
    expect(slot?.closest('header')).toHaveClass('page-header');
    expect(
      within(slot as HTMLElement).getByRole('button', {
        name: strings.themeDark,
      }),
    ).toBeInTheDocument();
  });

  it('keeps the choice when Dark is pressed', () => {
    render(<ContentPage {...sampleSpec} />);
    fireEvent.click(screen.getByRole('button', { name: strings.themeDark }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('renders on the server with the slot in the markup', () => {
    const html = renderToString(<ContentPage {...sampleSpec} />);
    expect(html).toContain('id="content-theme-toggle"');
    expect(html).toContain(sampleSpec.heading);
  });
});

describe('ContentPage sections with blocks', () => {
  it('draws the paragraphs and then the blocks of a section, inside it', () => {
    const { container } = render(<ContentPage {...blocksSpec} />);
    const section = container.querySelector('section');
    expect(section).not.toBeNull();
    const kids = [...(section as Element).children].map((c) => c.tagName);
    expect(kids).toEqual(['H2', 'P', 'H3', 'UL', 'NAV', 'NAV', 'TABLE']);
  });

  it('draws a section with no blocks exactly as before', () => {
    const { container } = render(<ContentPage {...plainSpec} />);
    expect(
      [...(container.querySelector('section') as Element).children].map(
        (c) => c.tagName,
      ),
    ).toEqual(['H2', 'P']);
  });
});
