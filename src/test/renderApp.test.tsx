import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { strings } from '../strings';
import { renderApp } from './renderApp';

describe('page flow through the shared mock service worker', () => {
  it('shows the fixture take-home for Ontario, 2025, $70,000', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.selectOptions(
      await screen.findByRole('combobox', { name: strings.form.place }),
      'CA-ON',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: strings.form.year }),
      '2025',
    );
    await user.type(
      screen.getByRole('textbox', { name: strings.form.salary }),
      '70000',
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    expect(
      await screen.findByRole('heading', { name: strings.answer.heading }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('$53,468.68')[0]).toBeInTheDocument();
  });
});
