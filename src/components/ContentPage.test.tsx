import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { ContentPage } from './ContentPage';
import { strings } from '../strings';
import { THEME_STORAGE_KEY } from '../theme/theme';
import { blocksSpec, plainSpec, sampleSpec } from '../test/contentPageData';
import { sampleHubCharts } from '../test/comparisonData';
import { fullHubCharts } from '../test/hubNotesData';
import { PROVINCE_COMPARISON_SLOT_ID } from '../state/hubSlots';
import { ratesPages } from '../../build/contentPages/rates';

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

describe('ContentPage sub-heading and card', () => {
  const spec = {
    ...plainSpec,
    sections: [
      {
        heading: 'Framed part',
        card: true as const,
        blocks: [{ kind: 'subheading' as const, text: 'Chart title' }],
      },
      { heading: 'Plain part', blocks: [] },
    ],
  };

  it('renders a sub-heading block as an h3', () => {
    render(<ContentPage {...spec} />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Chart title' }),
    ).toBeInTheDocument();
  });

  it('draws only a section marked as a card with the card class', () => {
    render(<ContentPage {...spec} />);
    const framed = screen
      .getByRole('heading', { level: 2, name: 'Framed part' })
      .closest('section');
    const plain = screen
      .getByRole('heading', { level: 2, name: 'Plain part' })
      .closest('section');
    expect(framed?.className).toMatch(/card/);
    expect(plain?.className).not.toMatch(/card/);
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
      9,
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

describe('ContentPage chart notes', () => {
  const spec = {
    ...plainSpec,
    sections: [
      {
        heading: 'Average tax rate',
        blocks: [
          {
            kind: 'chartNotes' as const,
            province: 'ca-on' as const,
            chart: 'averageRate' as const,
          },
        ],
      },
    ],
  };

  it('writes the province text of a chart as a list, figures filled from the hub data', () => {
    const { container } = render(
      <ContentPage {...spec} hubCharts={fullHubCharts(['ca-on'])} />,
    );
    const list = container.querySelector('ul[data-chart-notes="averageRate"]');
    expect(list).not.toBeNull();
    // Employment Insurance as the EI form sets it, and the average at $70,000, from the hub's data.
    expect(list?.textContent).toContain(
      'until the full rate applies by about $2,033',
    );
    expect(list?.textContent).toContain('23.2% at $70,000');
    expect(list?.textContent).not.toMatch(/[{}]/);
  });

  it('draws nothing when the hub has no sweep or the sweep is not the full one', () => {
    const none = render(<ContentPage {...spec} />);
    expect(none.container.querySelector('[data-chart-notes]')).toBeNull();
    none.unmount();
    const partial = render(
      <ContentPage {...spec} hubCharts={sampleHubCharts} />,
    );
    expect(partial.container.querySelector('[data-chart-notes]')).toBeNull();
  });

  it('folds a chart with long text behind See more, for any province', () => {
    for (const province of ['ca-on', 'ca-nl'] as const) {
      const marginal = {
        ...plainSpec,
        sections: [
          {
            heading: 'Marginal tax rate',
            blocks: [
              {
                kind: 'chartNotes' as const,
                province,
                chart: 'marginalRate' as const,
              },
            ],
          },
        ],
      };
      const { container, unmount } = render(
        <ContentPage {...marginal} hubCharts={fullHubCharts([province])} />,
      );
      expect(
        container.querySelector('ul[data-chart-notes="marginalRate"]')
          ?.children,
      ).toHaveLength(3);
      expect(container.querySelector('details')).not.toBeNull();
      expect(screen.getByText('See more')).toBeInTheDocument();
      unmount();
    }
  });

  it('does not fold a chart whose text is short', () => {
    const { container } = render(
      <ContentPage {...spec} hubCharts={fullHubCharts(['ca-on'])} />,
    );
    expect(container.querySelector('details')).toBeNull();
  });

  it('writes the same markup on the server', () => {
    const html = renderToString(
      <ContentPage {...spec} hubCharts={fullHubCharts(['ca-on'])} />,
    );
    expect(html).toContain('data-chart-notes="averageRate"');
  });
});

describe('ContentPage lists of forms', () => {
  const entries = Array.from({ length: 6 }, (_, at) => ({
    label: `Form ${String(at + 1)}`,
    description: 'A description of what the form is for. '.repeat(8),
  }));
  const spec = {
    ...plainSpec,
    sections: [
      {
        heading: 'The forms we follow',
        blocks: [{ kind: 'list' as const, items: entries }],
      },
    ],
  };

  it('folds a long list of forms behind See more, keeping every form', () => {
    const { container } = render(<ContentPage {...spec} />);
    expect(container.querySelectorAll('details li')).toHaveLength(3);
    expect(
      container.querySelectorAll('section ul > li, section details li'),
    ).toHaveLength(6);
    expect(screen.getByText('See more')).toBeInTheDocument();
  });

  it('draws a short list of forms whole', () => {
    const short = {
      ...spec,
      sections: [
        {
          heading: 'The forms we follow',
          blocks: [{ kind: 'list' as const, items: entries.slice(0, 2) }],
        },
      ],
    };
    const { container } = render(<ContentPage {...short} />);
    expect(container.querySelector('details')).toBeNull();
  });
});

describe('the parts of a rates page', () => {
  const ratesSpec = () => {
    const [page] = ratesPages(new Set(['ca-on']));
    if (!page) throw new Error('no rates page');
    return page;
  };
  const renderPage = () =>
    render(
      <ContentPage {...ratesSpec()} hubCharts={fullHubCharts(['ca-on'])} />,
    );

  it('writes the lead with no heading above it, before the chart heading', () => {
    renderPage();
    const lead = screen.getByText(/Ontario Health Premium rises/);
    expect(lead.closest('section')?.querySelector('h2')).toBeNull();
    expect(screen.getAllByRole('heading', { level: 2 })[0]).toHaveTextContent(
      'Your tax rates at every salary',
    );
  });

  it('links each salary range with an anchor that the group carries', () => {
    const { container } = renderPage();
    const hrefs = [
      ...container.querySelectorAll<HTMLAnchorElement>(
        'a[href^="#salary-range-"]',
      ),
    ].map((a) => a.getAttribute('href') ?? '');
    expect(hrefs).toEqual([
      '#salary-range-1',
      '#salary-range-2',
      '#salary-range-3',
      '#salary-range-4',
      '#salary-range-5',
    ]);
    for (const href of hrefs) {
      expect(container.querySelector(href)).not.toBeNull();
    }
  });

  it('links "credits paid to you when you file" in the basis to the Methodology page', () => {
    renderPage();
    expect(
      screen.getByRole('link', { name: /credits paid to you when you file/i }),
    ).toHaveAttribute('href', '/methodology/');
  });

  it('links the other provinces, in a row', () => {
    const [on, , nl] = ratesPages(new Set(['ca-on', 'ca-ab', 'ca-nl']));
    if (!on || !nl) throw new Error('no pages');
    render(<ContentPage {...on} hubCharts={fullHubCharts(['ca-on'])} />);
    expect(
      screen.getByRole('link', { name: 'Alberta tax rates by salary' }),
    ).toHaveAttribute('href', '/ca-ab/tax-rates/');
    expect(
      screen.queryByRole('link', { name: 'Ontario tax rates by salary' }),
    ).toBeNull();
  });
});
