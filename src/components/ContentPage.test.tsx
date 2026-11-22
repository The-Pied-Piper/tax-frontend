import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ContentPage } from './ContentPage';
import { strings } from '../strings';
import { THEME_STORAGE_KEY } from '../theme/theme';
import { blocksSpec, plainSpec, sampleSpec } from '../test/contentPageData';
import { sampleHubCharts } from '../test/hubChartsData';
import { PROVINCE_COMPARISON_SLOT_ID } from '../state/hubChartSlots';

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
        for (const block of section.blocks) {
          if (block.kind !== 'paragraph') continue;
          const text = block.content
            .map((part) => (typeof part === 'string' ? part : part.label))
            .join('');
          expect(screen.getByText(text)).toBeInTheDocument();
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

describe('ContentPage blocks', () => {
  it('renders a paragraph with a link inside the words', () => {
    render(<ContentPage {...blocksSpec} />);
    const link = screen.getByRole('link', { name: 'the link' });
    expect(link).toHaveAttribute('href', '/sample-hub/');
    expect(link.closest('p')).toHaveTextContent('Before the link after.');
  });

  it('renders a list with its title as an h3 and each item with its description', () => {
    render(<ContentPage {...blocksSpec} />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Listed forms' }),
    ).toBeInTheDocument();
    const linked = screen.getByRole('link', { name: 'Linked form' });
    expect(linked).toHaveAttribute('href', '/forms/linked/');
    expect(linked.closest('li')).toHaveTextContent('The one with a page.');
    const plain = screen.getByText('Plain form');
    expect(plain.closest('a')).toBeNull();
    expect(plain.closest('li')).toHaveTextContent('The one without a page.');
  });

  it('renders a list with no title without an h3', () => {
    render(<ContentPage {...blocksSpec} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
    expect(screen.getByText('Untitled item').closest('li')).toHaveTextContent(
      'No title above.',
    );
  });

  it.each([
    ['Grid of links', ['/one/', '/two/']],
    ['Row of links', ['/three/']],
  ])(
    'renders the links block %s as a labelled nav with a list',
    (label, hrefs) => {
      render(<ContentPage {...blocksSpec} />);
      const nav = screen.getByRole('navigation', { name: label });
      expect(within(nav).getByRole('list')).toBeInTheDocument();
      expect(
        within(nav)
          .getAllByRole('link')
          .map((a) => a.getAttribute('href')),
      ).toEqual(hrefs);
    },
  );

  it('gives the grid and the row different classes', () => {
    render(<ContentPage {...blocksSpec} />);
    const grid = screen.getByRole('navigation', { name: 'Grid of links' });
    const row = screen.getByRole('navigation', { name: 'Row of links' });
    const classes = (nav: HTMLElement) =>
      `${nav.className} ${nav.querySelector('ul')?.className ?? ''}`;
    expect(classes(grid)).not.toBe(classes(row));
  });

  it('renders a table with a caption and column header cells', () => {
    render(<ContentPage {...blocksSpec} />);
    const table = screen.getByRole('table', { name: 'Sample rates' });
    expect(table.querySelector('caption')).toHaveTextContent('Sample rates');
    const heads = within(table).getAllByRole('columnheader');
    expect(heads.map((h) => h.textContent)).toEqual(['Band', 'Rate']);
    for (const head of heads) expect(head).toHaveAttribute('scope', 'col');
    expect(
      within(table)
        .getAllByRole('row')
        .map((r) => r.textContent),
    ).toEqual(['BandRate', 'First5%', 'Second10%']);
  });

  it('draws a province comparison in its slot when the hub has charts data', () => {
    const { container } = render(
      <ContentPage {...blocksSpec} hubCharts={sampleHubCharts} />,
    );
    const slot = container.querySelector(`#${PROVINCE_COMPARISON_SLOT_ID}`);
    expect(slot).toHaveAttribute('data-province', 'ca-on');
    expect(within(slot as HTMLElement).getAllByRole('listitem')).toHaveLength(
      6,
    );
  });

  it('draws nothing for a province comparison with no charts data, or none for its province', () => {
    const { container, rerender } = render(<ContentPage {...blocksSpec} />);
    expect(
      container.querySelector(`#${PROVINCE_COMPARISON_SLOT_ID}`),
    ).toBeNull();
    rerender(
      <ContentPage
        {...blocksSpec}
        hubCharts={{ provinces: sampleHubCharts.provinces.slice(1) }}
      />,
    );
    expect(
      container.querySelector(`#${PROVINCE_COMPARISON_SLOT_ID}`),
    ).toBeNull();
  });

  it('writes the page on the server with the same blocks and no raw markup', () => {
    const html = renderToString(<ContentPage {...blocksSpec} />);
    expect(html).toContain('<caption');
    expect(html).toContain('scope="col"');
    expect(html).toContain('aria-label="Grid of links"');
  });

  it('shows a word with a tag in it as plain text, never as markup', () => {
    const spec = {
      ...plainSpec,
      sections: [
        {
          heading: 'Odd',
          blocks: [
            { kind: 'paragraph' as const, content: ['a <b>bold</b> b'] },
          ],
        },
      ],
    };
    const { container } = render(<ContentPage {...spec} />);
    expect(container.querySelector('b')).toBeNull();
    expect(screen.getByText('a <b>bold</b> b')).toBeInTheDocument();
  });
});
