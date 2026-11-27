import { render, screen, within } from '@testing-library/react';
import { readUnit } from '../adapters/fallback';
import { displayMoney, displayWholeMoney } from '../money/format';
import { strings } from '../strings';
import { compute70000 } from '../test/syntheticPages';
import type { SalaryPageLinks } from '../state/useTakeHome';
import { bareLinks, ontarioTargets } from '../test/pageLinks';
import { SalaryLinks } from './SalaryLinks';

const unit = readUnit(compute70000.unit) ?? strings.fallbackUnit;
const money = (salary: string) => displayWholeMoney(salary, 'annually', unit);
/** A pattern matching any name that contains the text (jest-dom 8 takes a string or pattern). */
const containing = (text: string) =>
  new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const kept = (takeHome: string) => displayMoney(takeHome, 'annually', unit);

// Distinct take-home figures, as the API prints them, one per linked page.
const takeHomes: Record<string, string> = {
  '60000': '46321.10',
  '65000': '49976.45',
  '75000': '57611.80',
  '80000': '61430.05',
};
const link = (salary: string) => ({
  salary,
  href: `/ca-on/${salary}/`,
  takeHome: takeHomes[salary] as string,
});

const links: SalaryPageLinks = {
  calculator: '/',
  previous: link('65000'),
  next: link('75000'),
  others: [link('65000'), link('75000'), link('60000'), link('80000')],
  ...ontarioTargets,
};

function show(value: SalaryPageLinks) {
  return render(<SalaryLinks links={value} unit={unit} />);
}

describe('SalaryLinks', () => {
  it('writes whole-dollar salaries as $65,000, with no cents and no CA$', () => {
    show(links);
    const nav = screen.getByRole('navigation');
    expect(
      within(nav).getByRole('link', {
        name: new RegExp(`^Previous: \\$65,000(?!\\d)`),
      }),
    ).toBeInTheDocument();
    expect(
      within(nav).getByRole('link', {
        name: new RegExp(`^Next: \\$75,000(?!\\d)`),
      }),
    ).toBeInTheDocument();
    expect(
      within(nav).getByRole('link', { name: new RegExp(`^\\$60,000(?!\\d)`) }),
    ).toBeVisible();
    expect(nav.textContent).not.toContain('CA$');
    expect(nav.textContent).not.toContain('.00');
  });

  it('is one named nav landmark', () => {
    show(links);
    expect(
      screen.getAllByRole('navigation', { name: strings.salaryLinks.label }),
    ).toHaveLength(1);
  });

  it('links to the previous and next salary, naming the amount', () => {
    show(links);
    const nav = screen.getByRole('navigation');
    const previous = within(nav).getByRole('link', {
      name: strings.salaryLinks.previous(money('65000'), kept('49976.45')),
    });
    expect(previous).toHaveAttribute('href', '/ca-on/65000/');
    expect(previous).toHaveAccessibleName(containing(money('65000')));
    const next = within(nav).getByRole('link', {
      name: strings.salaryLinks.next(money('75000'), kept('57611.80')),
    });
    expect(next).toHaveAttribute('href', '/ca-on/75000/');
    expect(next).toHaveAccessibleName(containing(money('75000')));
  });

  it('links back to the calculator', () => {
    show(links);
    expect(
      screen.getByRole('link', { name: strings.salaryLinks.calculator }),
    ).toHaveAttribute('href', '/');
  });

  it('lists the other pages as links named by their salary, in the given order', () => {
    show(links);
    const list = screen.getByRole('list', {
      name: strings.salaryLinks.others,
    });
    const items = within(list).getAllByRole('link');
    expect(items.map((a) => a.getAttribute('href'))).toEqual(
      links.others.map((l) => l.href),
    );
    expect(items[2]).toHaveAccessibleName(
      strings.salaryLinks.other(money('60000'), kept('46321.10')),
    );
    expect(screen.getByText(strings.salaryLinks.others)).toBeInTheDocument();
  });

  it('uses plain links: every link has an href and none opens a new tab', () => {
    show(links);
    for (const a of screen.getAllByRole('link')) {
      expect(a).toHaveAttribute('href');
      expect(a).not.toHaveAttribute('target');
    }
  });

  it('shows one neighbour only on an edge page', () => {
    show({
      ...links,
      previous: null,
      others: [link('75000')],
    });
    expect(
      screen.queryByRole('link', {
        name: strings.salaryLinks.previous(money('65000'), kept('49976.45')),
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: strings.salaryLinks.next(money('75000'), kept('57611.80')),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: strings.salaryLinks.calculator }),
    ).toBeInTheDocument();
  });

  it('omits the list when there are no other pages', () => {
    show(bareLinks);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: strings.salaryLinks.calculator }),
    ).toBeInTheDocument();
  });

  it('shows, on every link, the take-home of the page it points to, salary first and amount second', () => {
    show(links);
    const nav = screen.getByRole('navigation');
    const cases: [string, string][] = [
      ['65000', strings.salaryLinks.previous(money('65000'), kept('49976.45'))],
      ['75000', strings.salaryLinks.next(money('75000'), kept('57611.80'))],
    ];
    for (const [salary, name] of cases) {
      const a = within(nav).getByRole('link', { name });
      expect(a.textContent).toContain(kept(takeHomes[salary] as string));
      expect(a.textContent.indexOf(money(salary))).toBeLessThan(
        a.textContent.indexOf(kept(takeHomes[salary] as string)),
      );
    }
    const list = screen.getByRole('list', { name: strings.salaryLinks.others });
    const items = within(list).getAllByRole('link');
    expect(items.map((a) => a.textContent)).toEqual(
      links.others.map((l) =>
        strings.salaryLinks.other(money(l.salary), kept(l.takeHome)),
      ),
    );
    // Two links to one page show the same figure; different pages differ.
    expect(items[0]?.textContent).toBe(
      within(nav)
        .getByRole('link', { name: cases[0]?.[1] })
        .textContent.replace(/^Previous: /, ''),
    );
    expect(new Set(items.map((a) => a.textContent)).size).toBe(items.length);
  });

  it('prints the figure through displayMoney: two decimals, $ sign, no CA$', () => {
    show(links);
    const nav = screen.getByRole('navigation');
    expect(kept('49976.45')).toMatch(/^\$49,976\.45$/);
    expect(nav.textContent).toContain('$49,976.45');
    expect(nav.textContent).toContain('$57,611.80');
    expect(nav.textContent).not.toContain('CA$');
  });

  it('does not calculate the figure: it prints the take-home it is given for that page', () => {
    show({
      ...links,
      previous: { ...link('65000'), takeHome: '1234.50' },
      next: { ...link('75000'), takeHome: '99999.99' },
    });
    const nav = screen.getByRole('navigation');
    expect(nav.textContent).toContain('$1,234.50');
    expect(nav.textContent).toContain('$99,999.99');
  });

  it('keeps the hrefs as they were', () => {
    show(links);
    const nav = screen.getByRole('navigation');
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(
      expect.arrayContaining([
        '/',
        '/ca-on/65000/',
        '/ca-on/75000/',
        '/ca-on/60000/',
        '/ca-on/80000/',
      ]),
    );
    expect(within(nav).getAllByRole('link')).toHaveLength(
      2 + 1 + links.others.length,
    );
  });

  it('renders neither a broken link nor an empty figure on a page with no previous and no next', () => {
    show({ ...links, previous: null, next: null, others: [] });
    for (const a of screen.getAllByRole('link')) {
      expect(a.getAttribute('href')).toMatch(/^\//);
    }
    expect(screen.getByRole('navigation').textContent).not.toMatch(
      /undefined|NaN|null/,
    );
  });
});
