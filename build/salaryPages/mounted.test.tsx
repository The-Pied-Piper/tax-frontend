import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { strings } from '../../src/strings';
import { fixtureClient } from '../../src/test/fixtureClient';
import {
  compute150000,
  compute30000,
  compute70000,
  pageData,
} from '../../src/test/syntheticPages';
import { renderSalaryApp } from './prerender';

// The calculator mounted from a page's data block must agree with the static
// HTML written for that page (section 11: pre-hydration content), and
// recalculating on it must stay on the same address.
const pages = [
  { salary: '30000', data: pageData(compute30000, '30000') },
  { salary: '70000', data: pageData(compute70000, '70000') },
  { salary: '150000', data: pageData(compute150000, '150000') },
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
    },
  );
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
      <App client={client} initial={pageData(compute70000, '70000')} />,
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
    expect(screen.getAllByText('CA$27,550.43').length).toBeGreaterThan(0);
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
