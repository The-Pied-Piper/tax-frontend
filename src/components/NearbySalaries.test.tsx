import { render, screen, within } from '@testing-library/react';
import { displayMoney } from '../money/format';
import { strings } from '../strings';
import { indexUnit } from '../test/salaryIndexData';
import { NearbySalaries } from './NearbySalaries';

const money = (salary: string) => displayMoney(salary, 'annually', indexUnit);

// Presentational: the pages are given, already chosen and in order.
const pages = [
  { salary: '80000', href: '/ca-on/80000/' },
  { salary: '85000', href: '/ca-on/85000/' },
  { salary: '75000', href: '/ca-on/75000/' },
  { salary: '90000', href: '/ca-on/90000/' },
];

function show(given = pages) {
  return render(
    <NearbySalaries pages={given} place="Ontario" unit={indexUnit} />,
  );
}

describe('NearbySalaries', () => {
  it('is one nav landmark named Nearby salaries', () => {
    show();
    expect(strings.salaryIndex.nearby).toBe('Nearby salaries');
    expect(
      screen.getAllByRole('navigation', { name: 'Nearby salaries' }),
    ).toHaveLength(1);
  });

  it('lists the given pages as plain links, in the given order, named by salary and place', () => {
    show();
    const links = within(screen.getByRole('navigation')).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      pages.map((p) => p.href),
    );
    expect(links.map((a) => a.textContent)).toEqual(
      pages.map((p) => strings.salaryIndex.link(money(p.salary), 'Ontario')),
    );
    for (const a of links) expect(a).not.toHaveAttribute('target');
  });

  it('has one accessible name: the list is not labelled by the same text again', () => {
    show();
    expect(
      screen.queryAllByRole('list', { name: strings.salaryIndex.nearby }),
    ).toHaveLength(0);
    const list = screen.getByRole('list');
    expect(list).not.toHaveAttribute('aria-labelledby');
    expect(list).not.toHaveAccessibleName(strings.salaryIndex.nearby);
  });

  it('renders nothing when there are no pages', () => {
    const { container } = show([]);
    expect(container).toBeEmptyDOMElement();
  });
});
