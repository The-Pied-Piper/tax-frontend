import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';
import compute70000 from './api/fixtures/compute-on-2026-70000.json';
import compute1500 from './api/fixtures/compute-on-2026-1500.json';
import { strings } from './strings';
import { fixtureClient } from './test/fixtureClient';

async function openEiHelp(answer: unknown, salary: string) {
  const user = userEvent.setup();
  render(<App client={fixtureClient(() => {}, answer)} />);
  await user.selectOptions(
    await screen.findByRole('combobox', { name: strings.form.year }),
    '2026',
  );
  await user.type(
    screen.getByRole('textbox', { name: strings.form.salary }),
    salary,
  );
  await user.click(
    screen.getByRole('button', { name: strings.form.calculate }),
  );
  await screen.findByRole('heading', { name: strings.answer.heading });
  await user.click(screen.getByText(strings.breakdown.toggle));
  await user.click(
    screen.getByRole('button', {
      name: strings.breakdown.helpButton(strings.adapters.caOn.ei.name),
    }),
  );
}

describe('Employment Insurance help on the page', () => {
  it('explains the refund when a $1,500 salary has no EI', async () => {
    await openEiHelp(compute1500, '1500');
    expect(
      screen.getByText(
        `${strings.adapters.caOn.ei.help} On a salary of CA$1,500.00 the premium is refunded when you file, so none is counted in this estimate. A pay slip would still show it withheld during the year, and it comes back at tax time.`,
      ),
    ).toBeVisible();
    expect(screen.queryByText(/this small/, { exact: false })).toBeNull();
  });

  it('shows only the usual text at $70,000', async () => {
    await openEiHelp(compute70000, '70000');
    expect(screen.getByText(strings.adapters.caOn.ei.help)).toBeVisible();
    expect(
      screen.queryByText(/the premium is refunded when you file/, {
        exact: false,
      }),
    ).not.toBeInTheDocument();
  });
});
