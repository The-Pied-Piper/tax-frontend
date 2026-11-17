import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import type { ApiClient } from '../../src/api';
import { strings } from '../../src/strings';
import { fixtureClient } from '../../src/test/fixtureClient';
import {
  compute150000,
  compute30000,
  compute70000,
  pageData,
} from '../../src/test/syntheticPages';
import { bareLinks } from '../../src/test/pageLinks';
import { renderSalaryApp } from './prerender';

// The calculator mounted from a page's data block must agree with the static
// HTML written for that page (section 11: pre-hydration content), and
// recalculating on it must stay on the same address.
// A pre-built page carries its links; only such a page shows the summary and
// the "After Tax in" heading.
const links = bareLinks;
const withLinks = (data: ReturnType<typeof pageData>) => ({ ...data, links });
const pages = [
  { salary: '30000', data: withLinks(pageData(compute30000, '30000')) },
  { salary: '70000', data: withLinks(pageData(compute70000, '70000')) },
  { salary: '150000', data: withLinks(pageData(compute150000, '150000')) },
];

function staticPage(salary: string): Document {
  const found = pages.find((p) => p.salary === salary);
  if (!found) throw new Error(`no page for ${salary}`);
  return new DOMParser().parseFromString(
    renderSalaryApp(found.data),
    'text/html',
  );
}

function cardOf(root: ParentNode): Element {
  const card = Array.from(root.querySelectorAll('section')).find(
    (s) => s.querySelector('h2')?.textContent === strings.answer.heading,
  );
  if (!card) throw new Error('no answer card');
  return card;
}

function rowTexts(rows: Iterable<Element>): string[] {
  return Array.from(rows).map((r) => r.textContent);
}

/** The figure rows of the card: salary, taken off, take-home and both rates. */
function figureRows(card: Element): string[] {
  return rowTexts(
    Array.from(card.querySelectorAll('dl > div')).filter(
      (r) => r.closest('details') === null,
    ),
  );
}

/** The rows under "how it was worked out". */
function breakdownRows(card: Element): string[] {
  return rowTexts(card.querySelectorAll('details dl > div'));
}

const each = pages.map((p) => [p.salary, p.data] as const);

describe('the calculator mounted from a page agrees with that page static HTML', () => {
  it.each(each)(
    'shows the same take-home, total taken off and rates for $%s',
    (salary, data) => {
      const { container } = render(<App initial={data} />);
      expect(figureRows(cardOf(container))).toEqual(
        figureRows(cardOf(staticPage(salary))),
      );
    },
  );

  it.each(each)(
    'shows the same breakdown rows, each with its amount, for $%s',
    (salary, data) => {
      const { container } = render(<App initial={data} />);
      const mounted = breakdownRows(cardOf(container));
      expect(mounted.length).toBeGreaterThan(0);
      expect(mounted).toEqual(breakdownRows(cardOf(staticPage(salary))));
    },
  );

  it.each(each)(
    'shows the same big take-home figure and the same "out of" line for $%s',
    (salary, data) => {
      const { container } = render(<App initial={data} />);
      const paragraphs = (card: Element) =>
        Array.from(card.querySelectorAll(':scope > p')).map(
          (p) => p.textContent,
        );
      expect(paragraphs(cardOf(container))).toEqual(
        paragraphs(cardOf(staticPage(salary))),
      );
    },
  );
});

describe('the page text before the bundle loads is the text after it mounts (#82)', () => {
  it.each(each)('has the same h1 for $%s', (salary, data) => {
    const { container } = render(<App initial={data} />);
    expect(container.querySelector('h1')?.textContent).toBe(
      staticPage(salary).querySelector('h1')?.textContent,
    );
  });

  it.each(each)('has the same intro paragraph for $%s', (salary, data) => {
    const { container } = render(<App initial={data} />);
    expect(container.querySelector('.lede')?.textContent).toBe(
      staticPage(salary).querySelector('.lede')?.textContent,
    );
  });

  it.each(each)(
    'has the same page-summary paragraph for $%s',
    (salary, data) => {
      const { container } = render(<App initial={data} />);
      const summary = container.querySelector('.page-summary')?.textContent;
      expect(summary).toBeTruthy();
      expect(summary).toBe(
        staticPage(salary).querySelector('.page-summary')?.textContent,
      );
      const about = Array.from(container.querySelectorAll('h2')).map(
        (h) => h.textContent,
      );
      expect(about).toContain('About this estimate');
    },
  );
});

describe('the breadcrumb and Learn more links before the bundle loads match those after it mounts (#150)', () => {
  const navs = (root: ParentNode) => [
    root.querySelector(`nav[aria-label="${strings.siteNav.breadcrumb}"]`)
      ?.outerHTML,
    Array.from(root.querySelectorAll('nav')).find((n) =>
      /learn more/i.test(n.getAttribute('aria-label') ?? n.textContent),
    )?.outerHTML,
  ];

  it.each(each)('has the same two navs for $%s', (salary, data) => {
    const { container } = render(<App initial={data} />);
    const mounted = navs(container);
    expect(mounted[0]).toBeDefined();
    expect(mounted[1]).toBeDefined();
    expect(mounted).toEqual(navs(staticPage(salary)));
  });

  it.each(each)('has the breadcrumb before the h1 for $%s', (_salary, data) => {
    const { container } = render(<App initial={data} />);
    const crumbs = container.querySelector(
      `nav[aria-label="${strings.siteNav.breadcrumb}"]`,
    );
    const h1 = container.querySelector('h1');
    expect(crumbs).not.toBeNull();
    expect(h1).not.toBeNull();
    expect(
      (crumbs as Node).compareDocumentPosition(h1 as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it.each(each)('has the answer before the form for $%s', (_salary, data) => {
    const { container } = render(<App initial={data} />);
    const answer = container.querySelector('.page-summary');
    const form = screen.getByLabelText(strings.form.place);
    expect(answer).not.toBeNull();
    expect(
      (answer as Node).compareDocumentPosition(form) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows no breadcrumb on the home calculator', () => {
    const { container } = render(<App />);
    expect(
      container.querySelector(
        `nav[aria-label="${strings.siteNav.breadcrumb}"]`,
      ),
    ).toBeNull();
  });
});

describe('recalculating on a mounted salary page', () => {
  async function recalculateTo30000() {
    window.history.replaceState(null, '', '/ca-on/70000/');
    const before = {
      href: window.location.href,
      entries: window.history.length,
    };
    const client = fixtureClient(undefined, compute30000);
    const user = userEvent.setup();
    const { container } = render(
      <App
        client={client}
        initial={withLinks(pageData(compute70000, '70000'))}
      />,
    );
    const box = screen.getByRole('textbox', { name: strings.form.salary });
    await user.clear(box);
    await user.type(box, '30000');
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    await waitFor(() => {
      expect(figureRows(cardOf(container))).toEqual(
        figureRows(cardOf(staticPage('30000'))),
      );
    });
    return before;
  }

  it('shows the figures of the other salary', async () => {
    await recalculateTo30000();
    expect(screen.getAllByText('$27,550.43').length).toBeGreaterThan(0);
  });

  it('does not change the address', async () => {
    const before = await recalculateTo30000();
    expect(window.location.href).toBe(before.href);
  });

  it('does not add a history entry', async () => {
    const before = await recalculateTo30000();
    expect(window.history.length).toBe(before.entries);
  });
});

describe('while a mounted salary page recalculates', () => {
  async function holdRequest() {
    const base = fixtureClient(undefined, compute30000);
    let release: () => void = () => {};
    const client: ApiClient = {
      listJurisdictions: (query) => base.listJurisdictions(query),
      computeTakeHomeCalculation: (body) =>
        new Promise((resolve) => {
          release = () => {
            resolve(base.computeTakeHomeCalculation(body));
          };
        }),
    };
    const user = userEvent.setup();
    const { container } = render(
      <App
        client={client}
        initial={withLinks(pageData(compute70000, '70000'))}
      />,
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    return { container, release };
  }

  it('keeps the old answer in place, with the form still below it', async () => {
    const { container } = await holdRequest();
    expect(screen.getAllByText('$53,786.25').length).toBeGreaterThan(0);
    const card = screen.getByRole('heading', { name: strings.answer.heading });
    const form = screen.getByLabelText(strings.form.place);
    expect(
      card.compareDocumentPosition(form) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('marks the old answer busy and unusable, and says it is calculating', async () => {
    const { container } = await holdRequest();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    const old = container.querySelector('[inert]');
    expect(old).not.toBeNull();
    expect(old).toContainElement(
      screen.getByRole('heading', { name: strings.answer.heading }),
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(strings.form.calculating);
    expect(old).not.toContainElement(status);
  });

  it('shows the new figures and drops the busy mark when the answer arrives', async () => {
    const { container, release } = await holdRequest();
    release();
    await waitFor(() => {
      expect(screen.getAllByText('$27,550.43').length).toBeGreaterThan(0);
    });
    expect(container.querySelector('[aria-busy="true"]')).toBeNull();
    expect(container.querySelector('[inert]')).toBeNull();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
