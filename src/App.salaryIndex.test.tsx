import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { displayMoney } from './money/format';
import { strings } from './strings';
import { fixtureClient } from './test/fixtureClient';
import {
  indexUnit,
  ontarioIndex,
  xlandOnlyIndex,
} from './test/salaryIndexData';
import { pageData, syntheticResponse } from './test/syntheticPages';
import type { SalaryIndex } from './state/salaryIndex';

// What App does with the salary index: the home-page list on the calculator and
// the nearby list after a calculation. The fake client answers every request with
// a response for the salary asked.
const money = (salary: string) => displayMoney(salary, 'annually', indexUnit);

async function calculate(salary: string) {
  const user = userEvent.setup();
  const box = await screen.findByRole('textbox', { name: strings.form.salary });
  await user.clear(box);
  await user.type(box, salary);
  await user.click(
    screen.getByRole('button', { name: strings.form.calculate }),
  );
  await screen.findByRole('heading', { name: strings.answer.heading });
}

function showCalculator(index?: SalaryIndex, salary = 82000) {
  const client = fixtureClient(undefined, syntheticResponse(salary));
  return render(<App client={client} salaryIndex={index} />);
}

const nearby = () =>
  screen.queryByRole('navigation', { name: strings.salaryIndex.nearby });

describe('App with a salary index: the calculator', () => {
  it('shows the Popular salaries nav with every page, before any calculation', () => {
    showCalculator(ontarioIndex);
    const nav = screen.getByRole('navigation', { name: 'Popular salaries' });
    expect(within(nav).getAllByRole('link')).toHaveLength(25);
    expect(within(nav).getByRole('list', { name: 'Ontario' })).toBeVisible();
  });

  it('shows no Popular salaries nav without an index (plain build)', () => {
    showCalculator(undefined);
    expect(
      screen.queryByRole('navigation', { name: 'Popular salaries' }),
    ).not.toBeInTheDocument();
  });

  it('shows no nearby list before a calculation', () => {
    showCalculator(ontarioIndex);
    expect(nearby()).not.toBeInTheDocument();
  });

  it('lists the four nearest pre-built salaries after a calculation, nearest first, ties lower first', async () => {
    showCalculator(ontarioIndex, 82000);
    await calculate('82000');
    const nav = nearby();
    expect(nav).toBeInTheDocument();
    const links = within(nav as HTMLElement).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/ca-on/80000/',
      '/ca-on/85000/',
      '/ca-on/75000/',
      '/ca-on/90000/',
    ]);
    expect(links.map((a) => a.textContent)).toEqual(
      ['80000', '85000', '75000', '90000'].map((s) =>
        strings.salaryIndex.link(money(s), 'Ontario'),
      ),
    );
    expect(nav).toHaveTextContent(strings.salaryIndex.nearby);
  });

  it('starts the nearby list with the page itself when the salary is a step', async () => {
    showCalculator(ontarioIndex, 70000);
    await calculate('70000');
    expect(
      within(nearby() as HTMLElement)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual([
      '/ca-on/70000/',
      '/ca-on/65000/',
      '/ca-on/75000/',
      '/ca-on/60000/',
    ]);
  });

  it('gives the lowest steps for a salary below them', async () => {
    showCalculator(ontarioIndex, 10000);
    await calculate('10000');
    expect(
      within(nearby() as HTMLElement)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual([
      '/ca-on/30000/',
      '/ca-on/35000/',
      '/ca-on/40000/',
      '/ca-on/45000/',
    ]);
  });

  it('shows no nearby list when the index has no group for the place', async () => {
    showCalculator(xlandOnlyIndex, 82000);
    await calculate('82000');
    expect(nearby()).not.toBeInTheDocument();
  });

  it('shows no nearby list without an index', async () => {
    showCalculator(undefined, 82000);
    await calculate('82000');
    expect(nearby()).not.toBeInTheDocument();
  });
});

describe('App with a salary index: a pre-built page', () => {
  const links = {
    calculator: '/',
    previous: { salary: '65000', href: '/ca-on/65000/' },
    next: { salary: '75000', href: '/ca-on/75000/' },
    others: [],
  };
  const initial = {
    ...pageData(syntheticResponse(70000), '70000'),
    links,
  };

  function showPage() {
    const client = fixtureClient(undefined, syntheticResponse(82000));
    return render(
      <App client={client} initial={initial} salaryIndex={ontarioIndex} />,
    );
  }

  it('keeps its own previous and next links and shows neither list', () => {
    showPage();
    expect(
      screen.getByRole('navigation', { name: strings.salaryLinks.label }),
    ).toBeInTheDocument();
    expect(nearby()).not.toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Popular salaries' }),
    ).not.toBeInTheDocument();
  });

  it('switches to the nearby list for the new salary when recalculated', async () => {
    showPage();
    await calculate('82000');
    expect(
      screen.queryByRole('navigation', { name: strings.salaryLinks.label }),
    ).not.toBeInTheDocument();
    expect(
      within(nearby() as HTMLElement)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual([
      '/ca-on/80000/',
      '/ca-on/85000/',
      '/ca-on/75000/',
      '/ca-on/90000/',
    ]);
  });
});
