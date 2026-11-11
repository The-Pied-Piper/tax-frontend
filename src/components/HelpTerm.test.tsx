import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpTerm } from './HelpTerm';
import { strings } from '../strings';

function setup() {
  render(
    <div>
      <HelpTerm name="Line 2" help="the explanation" />
      <p>elsewhere</p>
    </div>,
  );
  return screen.getByRole('button', {
    name: strings.breakdown.helpButton('Line 2'),
  });
}

describe('HelpTerm', () => {
  it('stays closed when pointed at', async () => {
    const button = setup();
    await userEvent.hover(screen.getByText('Line 2'));
    expect(screen.getByText('the explanation')).not.toBeVisible();
    await userEvent.hover(button);
    expect(screen.getByText('the explanation')).not.toBeVisible();
  });

  it('opens on click and closes on a second click', async () => {
    const button = setup();
    await userEvent.click(button);
    expect(screen.getByText('the explanation')).toBeVisible();
    await userEvent.click(button);
    expect(screen.getByText('the explanation')).not.toBeVisible();
  });

  it('closes on a click elsewhere', async () => {
    const button = setup();
    await userEvent.click(button);
    await userEvent.click(screen.getByText('elsewhere'));
    expect(screen.getByText('the explanation')).not.toBeVisible();
  });

  it('closes with Escape wherever the focus is', async () => {
    const button = setup();
    await userEvent.click(button);
    await userEvent.click(screen.getByText('the explanation'));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText('the explanation')).not.toBeVisible();
  });
});
