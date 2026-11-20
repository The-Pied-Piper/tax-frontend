import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  renderContentPage,
  renderSalaryApp,
  renderSiteFooter,
} from './prerender';
import { sampleSpec } from '../../src/test/contentPageData';
import { pageMeta } from './pageMeta';
import { salaryLinks } from './links';
import { App } from '../../src/App';
import { createApiClient } from '../../src/api';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixture30000 from '../../src/api/fixtures/compute-on-2026-30000.json';
import fixture70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import fixture150000 from '../../src/api/fixtures/compute-on-2026-150000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { bareLinks, ontarioTargets } from '../../src/test/pageLinks';
import { strings } from '../../src/strings';
import type { SalaryPageData } from '../../src/state/useTakeHome';

const compute30000 = fixture30000 as ComputeTakeHomeCalculationResponse;
const compute70000 = fixture70000 as ComputeTakeHomeCalculationResponse;
const compute150000 = fixture150000 as ComputeTakeHomeCalculationResponse;

function dataFor(
  response: SalaryPageData['response'],
  salary: string,
): SalaryPageData {
  return {
    jurisdictions: jurisdictions.jurisdictions,
    response,
    jurisdictionCode: 'CA-ON',
    year: 2026,
    salary,
    // Only a pre-built page, which carries its links, shows the summary.
    links: bareLinks,
  };
}

// The string is what a crawler gets: no script has run. It is put into the
// document only so it can be read by role.
function show(data: SalaryPageData) {
  document.body.innerHTML = renderSalaryApp(data);
}

describe('renderSalaryApp (the static body of a salary page)', () => {
  it('has the answer in the HTML without JavaScript', () => {
    const html = renderSalaryApp(dataFor(compute70000, '70000'));
    expect(html).toContain('$53,786.25');
    expect(html).toContain('$16,213.75');
    expect(html).toContain('$70,000.00');
  });

  it('shows no CA$ in the text a visitor reads', () => {
    for (const response of [compute30000, compute70000, compute150000]) {
      const html = renderSalaryApp(dataFor(response, '70000'));
      // The data block is the API's answer as sent; only text on the page counts.
      show(dataFor(response, '70000'));
      expect(document.body.textContent).not.toContain('CA$');
      expect(html).not.toMatch(/CA\$\d/);
    }
  });

  it.each([
    [compute30000, '30000', '$27,550.43'],
    [compute150000, '150000', '$104,319.88'],
  ])(
    'has the real figure on the edge page for $%s',
    (response, salary, takeHome) => {
      expect(renderSalaryApp(dataFor(response, salary))).toContain(takeHome);
    },
  );

  it('shows the same page as the live app: heading, estimate card, footer', () => {
    show(dataFor(compute70000, '70000'));
    expect(
      screen.getByRole('heading', {
        name: pageMeta(dataFor(compute70000, '70000')).heading,
        level: 1,
      }),
    ).toBeInTheDocument();
    const card = screen.getByRole('region', { name: strings.answer.heading });
    expect(within(card).getAllByText('$53,786.25').length).toBeGreaterThan(0);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(strings.footer);
  });

  it('pre-fills the form for that place, year and salary', () => {
    show(dataFor(compute70000, '70000'));
    expect(
      screen.getByRole('combobox', { name: strings.form.place }),
    ).toHaveValue('CA-ON');
    expect(
      screen.getByRole('combobox', { name: strings.form.year }),
    ).toHaveValue('2026');
    const salary = screen.getByRole('textbox', { name: strings.form.salary });
    expect((salary as HTMLInputElement).value.replace(/,/g, '')).toBe('70000');
  });

  it('uses estimate wording, never "checked against CRA"', () => {
    const html = renderSalaryApp(dataFor(compute70000, '70000'));
    expect(html.toLowerCase()).toContain('estimate');
    expect(html.toLowerCase()).not.toContain('checked against cra');
  });

  it('makes no network request', () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    renderSalaryApp(dataFor(compute70000, '70000'));
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the h1 and paragraph of a salary page', () => {
  const pages = [
    dataFor(compute30000, '30000'),
    dataFor(compute70000, '70000'),
    dataFor(compute150000, '150000'),
  ];

  it.each(pages.map((p) => [p.salary, p] as const))(
    'has exactly one h1, the page heading, for $%s',
    (_salary, data) => {
      show(data);
      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent(pageMeta(data).heading);
    },
  );

  it.each(pages.map((p) => [p.salary, p] as const))(
    'has the paragraph from pageMeta in the static HTML for $%s, once',
    (_salary, data) => {
      show(data);
      expect(screen.getAllByText(pageMeta(data).paragraph)).toHaveLength(1);
    },
  );

  it('has different headings and paragraphs on different pages', () => {
    const headings = pages.map((p) => pageMeta(p).heading);
    const paragraphs = pages.map((p) => pageMeta(p).paragraph);
    expect(new Set(headings).size).toBe(3);
    expect(new Set(paragraphs).size).toBe(3);
  });

  it('keeps the generic title and one h1 when there is no answer yet', () => {
    const pending = createApiClient({
      baseUrl: 'https://api.test',
      fetch: () => new Promise<Response>(() => undefined),
    });
    render(<App client={pending} />);
    expect(
      screen.getByRole('heading', { name: strings.title, level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('writes the paragraph again, and keeps the heading, when the salary is changed in place', async () => {
    const before = pageMeta(dataFor(compute70000, '70000'));
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetch: (input) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        return Promise.resolve(
          url.endsWith('/jurisdictions')
            ? Response.json(jurisdictions)
            : Response.json(compute30000),
        );
      },
    });
    const user = userEvent.setup();
    render(<App client={client} initial={dataFor(compute70000, '70000')} />);
    const salary = screen.getByRole('textbox', { name: strings.form.salary });
    await user.clear(salary);
    await user.type(salary, '30000');
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    await waitFor(() => {
      expect(document.querySelector('.page-summary')).toHaveTextContent(
        /^On a salary of \$30,000 in Ontario/,
      );
    });
    expect(screen.queryByText(before.paragraph)).not.toBeInTheDocument();
    // The heading stays the one the page was built with, like its address.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      before.heading,
    );
  });
});

describe('salary links in the static page and the mounted page (#81)', () => {
  const base: SalaryPageData = {
    ...dataFor(compute70000, '70000'),
    links: undefined,
  };
  const links = salaryLinks('ca-on', ['65000', '70000', '75000'], '70000', {
    '65000': '49976.45',
    '70000': '53786.25',
    '75000': '57611.80',
  });
  const withLinks: SalaryPageData = {
    ...base,
    links: { ...links, ...ontarioTargets },
  };

  it('puts the nav with its links in the static HTML', () => {
    show(withLinks);
    const nav = screen.getByRole('navigation', {
      name: strings.salaryLinks.label,
    });
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining(['/', '/ca-on/65000/', '/ca-on/75000/']),
    );
  });

  it('writes each neighbour with its take-home in the static HTML, and the mounted page agrees', () => {
    show(withLinks);
    const nav = screen.getByRole('navigation', {
      name: strings.salaryLinks.label,
    });
    const previous = within(nav).getByRole('link', {
      name: /^Previous: \$65,000/,
    });
    const next = within(nav).getByRole('link', { name: /^Next: \$75,000/ });
    expect(previous.textContent).toContain('$49,976.45');
    expect(next.textContent).toContain('$57,611.80');
    expect(previous.textContent).not.toContain('$53,786.25');
    const staticText = nav.textContent;
    document.body.innerHTML = '';
    render(<App initial={withLinks} />);
    expect(
      screen.getByRole('navigation', { name: strings.salaryLinks.label })
        .textContent,
    ).toBe(staticText);
  });

  it('renders the first and last page of a province with no previous or next and no crash', () => {
    const first: SalaryPageData = {
      ...base,
      links: {
        ...salaryLinks('ca-on', ['70000', '75000'], '70000', {
          '70000': '53786.25',
          '75000': '57611.80',
        }),
        ...ontarioTargets,
      },
    };
    show(first);
    const nav = screen.getByRole('navigation', {
      name: strings.salaryLinks.label,
    });
    expect(within(nav).queryByRole('link', { name: /^Previous/ })).toBeNull();
    expect(
      within(nav).getByRole('link', { name: /^Next: \$75,000.*\$57,611\.80/ }),
    ).toBeInTheDocument();
    expect(nav.textContent).not.toMatch(/undefined|NaN|null/);
  });

  it('has no nav in the static HTML for data without links', () => {
    show(base);
    expect(
      screen.queryByRole('navigation', { name: strings.salaryLinks.label }),
    ).not.toBeInTheDocument();
  });

  it('renders the same nav when mounted from the same data (the pre-hydration rule)', () => {
    show(withLinks);
    const staticNav = screen.getByRole('navigation', {
      name: strings.salaryLinks.label,
    }).outerHTML;
    document.body.innerHTML = '';
    render(<App initial={withLinks} />);
    expect(
      screen.getByRole('navigation', { name: strings.salaryLinks.label })
        .outerHTML,
    ).toBe(staticNav);
  });

  it('keeps the nav as the page was built once another salary is calculated', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetch: (input) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        return Promise.resolve(
          url.endsWith('/jurisdictions')
            ? Response.json(jurisdictions)
            : Response.json(compute30000),
        );
      },
    });
    const user = userEvent.setup();
    render(<App client={client} initial={withLinks} />);
    expect(
      screen.getByRole('navigation', { name: strings.salaryLinks.label }),
    ).toBeInTheDocument();
    const salary = screen.getByRole('textbox', { name: strings.form.salary });
    await user.clear(salary);
    await user.type(salary, '30000');
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    await waitFor(() => {
      expect(document.querySelector('.page-summary')).toHaveTextContent(
        /\$30,000/,
      );
    });
    // The links stay the ones the page was built with, like its address.
    expect(
      screen.getByRole('navigation', { name: strings.salaryLinks.label }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: strings.salaryLinks.calculator }),
    ).toBeInTheDocument();
  });
});

describe('renderSiteFooter (the static footer of the home page)', () => {
  it('is the real footer as a string, with a plain link to the methodology page and each hub', () => {
    document.body.innerHTML = renderSiteFooter();
    const nav = screen.getByRole('navigation', { name: strings.siteNav.label });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual([
      '/methodology/',
      '/ca-on/',
      '/ca-ab/',
      '/ca-bc/',
      '/ca-mb/',
      '/ca-sk/',
      '/ca-nl/',
    ]);
    expect(document.body).toHaveTextContent(strings.footer);
  });
});

describe('renderContentPage', () => {
  it('is the real content page as a string, footer and theme slot included', () => {
    const html = renderContentPage(sampleSpec);
    const page = new DOMParser().parseFromString(html, 'text/html');
    expect(page.querySelector('h1')?.textContent).toBe(sampleSpec.heading);
    expect(page.querySelector('#content-theme-toggle')).not.toBeNull();
    expect(page.querySelector('footer a[href="/methodology/"]')).not.toBeNull();
    expect(page.querySelector('footer')?.textContent).toContain(strings.footer);
  });
});

describe('breadcrumb and learn-more links in the static page (#150)', () => {
  const links = {
    ...salaryLinks('ca-on', ['65000', '70000', '75000'], '70000', {
      '65000': '49976.45',
      '70000': '53786.25',
      '75000': '57611.80',
    }),
    ...ontarioTargets,
  };
  const withLinks: SalaryPageData = {
    ...dataFor(compute70000, '70000'),
    links,
  };
  const crumbs = () =>
    screen.getByRole('navigation', { name: strings.siteNav.breadcrumb });
  const learnMore = () =>
    screen.getByRole('navigation', { name: /learn more about this estimate/i });

  it('has the breadcrumb Home / Ontario / $70,000 in the HTML, with no script run', () => {
    show(withLinks);
    const nav = crumbs();
    expect(within(nav).getByRole('list').tagName).toBe('OL');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['Home', '/'],
      ['Ontario', '/ca-on/'],
    ]);
    const current = within(nav).getByText('$70,000');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('a')).toBeNull();
  });

  it('puts the answer and the page paragraph before the form', () => {
    show(dataFor(compute70000, '70000'));
    const form = screen.getByLabelText(strings.form.place);
    const answer = screen.getByRole('heading', {
      name: strings.answer.heading,
    });
    const paragraph = document.querySelector('.page-summary') as Node;
    for (const earlier of [answer, paragraph]) {
      expect(
        earlier.compareDocumentPosition(form) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it('puts the provisional note after the answer and before the form', () => {
    show(dataFor(compute70000, '70000'));
    const note = screen.getByText(strings.notices.provisionalTitle(2026));
    const answer = screen.getByRole('heading', {
      name: strings.answer.heading,
    });
    const form = screen.getByLabelText(strings.form.place);
    expect(
      answer.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      note.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('puts the form before the neighbour links, so the keyboard reaches it in screen order', () => {
    show(dataFor(compute70000, '70000'));
    const form = screen.getByLabelText(strings.form.place);
    const neighbours = screen.getByRole('navigation', {
      name: strings.salaryLinks.label,
    });
    expect(
      form.compareDocumentPosition(neighbours) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('puts the breadcrumb above the h1', () => {
    show(withLinks);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(
      crumbs().compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('has a Learn more nav with the hub, methodology and form links in the HTML', () => {
    show(withLinks);
    const nav = learnMore();
    expect(nav).toHaveTextContent(/learn more about this estimate/i);
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual(ontarioTargets.learnMore.map((l) => [l.label, l.href]));
  });

  it('puts the Learn more nav after the neighbour links', () => {
    show(withLinks);
    const neighbours = screen.getByRole('navigation', {
      name: strings.salaryLinks.label,
    });
    expect(
      neighbours.compareDocumentPosition(learnMore()) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('leaves the form link out when the data has none', () => {
    show({
      ...withLinks,
      links: { ...links, learnMore: ontarioTargets.learnMore.slice(0, 2) },
    });
    expect(within(learnMore()).getAllByRole('link')).toHaveLength(2);
    expect(learnMore().innerHTML).not.toContain('/forms/');
  });

  it('has no breadcrumb and no Learn more nav on the calculator home (no links)', () => {
    show({ ...withLinks, links: undefined });
    expect(
      screen.queryByRole('navigation', { name: strings.siteNav.breadcrumb }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: /learn more/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the same breadcrumb and Learn more nav when mounted from the same data', () => {
    show(withLinks);
    const staticCrumbs = crumbs().outerHTML;
    const staticMore = learnMore().outerHTML;
    document.body.innerHTML = '';
    render(<App initial={withLinks} />);
    expect(crumbs().outerHTML).toBe(staticCrumbs);
    expect(learnMore().outerHTML).toBe(staticMore);
  });

  it('keeps the breadcrumb and the Learn more nav once another salary is calculated', async () => {
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetch: (input) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        return Promise.resolve(
          url.endsWith('/jurisdictions')
            ? Response.json(jurisdictions)
            : Response.json(compute30000),
        );
      },
    });
    const user = userEvent.setup();
    render(<App client={client} initial={withLinks} />);
    expect(crumbs()).toBeInTheDocument();
    await user.clear(
      screen.getByRole('textbox', { name: strings.form.salary }),
    );
    await user.type(
      screen.getByRole('textbox', { name: strings.form.salary }),
      '30000',
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    await waitFor(() => {
      expect(document.querySelector('.page-summary')).toHaveTextContent(
        /\$30,000/,
      );
    });
    expect(
      screen.getByRole('navigation', { name: /learn more/i }),
    ).toBeInTheDocument();
    // The breadcrumb stays the one the page was built with, like its address.
    expect(crumbs()).toBeInTheDocument();
    expect(within(crumbs()).getByText('$70,000')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
