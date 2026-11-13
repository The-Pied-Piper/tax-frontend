import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import { strings } from './strings';
import { fixtureClient } from './test/fixtureClient';
import { ontarioIndex, xlandOnlyIndex } from './test/salaryIndexData';
import { pageData, syntheticResponse } from './test/syntheticPages';
import type { SalaryIndex } from './state/salaryIndex';

// What App does with the salary index: the home-page list on the calculator and
// nothing extra after a calculation. The fake client answers every request with
// a response for the salary asked.

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

const aboutEstimate = 'About this estimate';
const nearby = () =>
  screen.queryByRole('navigation', { name: 'Nearby salaries' });

describe('App with a salary index: the calculator', () => {
  it('shows the Popular salaries nav with every page, before any calculation', () => {
    showCalculator(ontarioIndex);
    const nav = screen.getByRole('navigation', { name: 'Popular salaries' });
    expect(within(nav).getAllByRole('link')).toHaveLength(25);
    expect(
      within(nav).getByRole('list', { name: 'Ontario' }),
    ).toBeInTheDocument();
    const details = nav.closest('details');
    expect(details).not.toHaveAttribute('open');
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

  it.each([
    ['an Ontario index', ontarioIndex],
    ['an index with no group for the place', xlandOnlyIndex],
    ['no index', undefined],
  ])(
    'shows no nearby list, summary or page title after a calculation with %s',
    async (_name, index) => {
      showCalculator(index, 82000);
      await calculate('82000');
      expect(nearby()).not.toBeInTheDocument();
      expect(document.querySelector('.page-summary')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: aboutEstimate }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        strings.title,
      );
    },
  );
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

  it('turns into the plain calculator when another salary is calculated', async () => {
    showPage();
    await calculate('82000');
    expect(
      screen.queryByRole('navigation', { name: strings.salaryLinks.label }),
    ).not.toBeInTheDocument();
    expect(nearby()).not.toBeInTheDocument();
    expect(document.querySelector('.page-summary')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      strings.title,
    );
  });
});
