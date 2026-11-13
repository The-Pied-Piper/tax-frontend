import { render, screen, within } from '@testing-library/react';
import { displayMoney } from '../money/format';
import { strings } from '../strings';
import { compute70000 } from '../test/syntheticPages';
import type { SalaryPageLinks } from '../state/useTakeHome';
import { SalaryLinks } from './SalaryLinks';

const unit = compute70000.unit;
const money = (salary: string) => displayMoney(salary, 'annually', unit);

const links: SalaryPageLinks = {
  calculator: '/',
  previous: { salary: '65000', href: '/ca-on/65000/' },
  next: { salary: '75000', href: '/ca-on/75000/' },
  others: [
    { salary: '65000', href: '/ca-on/65000/' },
    { salary: '75000', href: '/ca-on/75000/' },
    { salary: '60000', href: '/ca-on/60000/' },
    { salary: '80000', href: '/ca-on/80000/' },
  ],
};

function show(value: SalaryPageLinks) {
  return render(<SalaryLinks links={value} unit={unit} />);
}

describe('SalaryLinks', () => {
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
      name: strings.salaryLinks.previous(money('65000')),
    });
    expect(previous).toHaveAttribute('href', '/ca-on/65000/');
    expect(previous).toHaveAccessibleName(
      expect.stringContaining(money('65000')),
    );
    const next = within(nav).getByRole('link', {
      name: strings.salaryLinks.next(money('75000')),
    });
    expect(next).toHaveAttribute('href', '/ca-on/75000/');
    expect(next).toHaveAccessibleName(expect.stringContaining(money('75000')));
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
    expect(items[2]).toHaveAccessibleName(money('60000'));
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
      others: [{ salary: '75000', href: '/ca-on/75000/' }],
    });
    expect(
      screen.queryByRole('link', {
        name: strings.salaryLinks.previous(money('65000')),
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: strings.salaryLinks.next(money('75000')),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: strings.salaryLinks.calculator }),
    ).toBeInTheDocument();
  });

  it('omits the list when there are no other pages', () => {
    show({ calculator: '/', previous: null, next: null, others: [] });
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: strings.salaryLinks.calculator }),
    ).toBeInTheDocument();
  });
});
