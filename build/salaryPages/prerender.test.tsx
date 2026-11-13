import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderSalaryApp } from './prerender';
import { pageMeta } from './pageMeta';
import { salaryLinks } from './links';
import { App } from '../../src/App';
import { createApiClient } from '../../src/api';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixture30000 from '../../src/api/fixtures/compute-on-2026-30000.json';
import fixture70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import fixture150000 from '../../src/api/fixtures/compute-on-2026-150000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
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
    expect(html).toContain('CA$53,786.25');
    expect(html).toContain('CA$16,213.75');
    expect(html).toContain('CA$70,000.00');
  });

  it.each([
    [compute30000, '30000', 'CA$27,550.43'],
    [compute150000, '150000', 'CA$104,319.88'],
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
    expect(within(card).getAllByText('CA$53,786.25').length).toBeGreaterThan(0);
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

  it('follows the answer when the salary is changed in place', async () => {
    const before = pageMeta(dataFor(compute70000, '70000'));
    const after = pageMeta(dataFor(compute30000, '30000'));
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
      expect(
        screen.getByRole('heading', { name: after.heading, level: 1 }),
      ).toBeInTheDocument();
    });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText(after.paragraph)).toBeInTheDocument();
    expect(screen.queryByText(before.paragraph)).not.toBeInTheDocument();
  });
});

describe('salary links in the static page and the mounted page (#81)', () => {
  const base = dataFor(compute70000, '70000');
  const links = salaryLinks('ca-on', ['65000', '70000', '75000'], '70000');
  const withLinks: SalaryPageData = { ...base, links };

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

  it('has no nav in the static HTML for data without links', () => {
    show(base);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders the same nav when mounted from the same data (the pre-hydration rule)', () => {
    show(withLinks);
    const staticNav = screen.getByRole('navigation').outerHTML;
    document.body.innerHTML = '';
    render(<App initial={withLinks} />);
    expect(screen.getByRole('navigation').outerHTML).toBe(staticNav);
  });
});
