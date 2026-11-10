import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { strings } from '../strings';
import { renderApp } from './renderApp';

describe('page flow through the shared mock service worker', () => {
  it('shows the saved take-home for $70,000 in Ontario, 2025', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(
      await screen.findByRole('textbox', { name: strings.form.salary }),
      '70000',
    );
    await user.click(
      screen.getByRole('button', { name: strings.form.calculate }),
    );
    expect(
      await screen.findByRole('heading', { name: strings.answer.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText('53,468.68')).toBeInTheDocument();
  });
});
