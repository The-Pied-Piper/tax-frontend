import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DisplayRow } from '../adapters';
import { Breakdown } from './Breakdown';
import { strings } from '../strings';

const rows: DisplayRow[] = [
  {
    id: 'cpp',
    name: 'Canada Pension Plan',
    help: 'Pension contributions taken from each paycheque.',
    amount: '3956.75',
  },
  {
    id: 'ei',
    name: 'Employment Insurance',
    help: 'Insurance against losing your job.',
    amount: '1077.48',
  },
];
const totals: DisplayRow[] = [
  {
    id: 'taken-off',
    name: 'Total taken off',
    help: 'Everything taken from your salary.',
    amount: '16531.32',
  },
];

function open() {
  return userEvent.click(screen.getByText(strings.breakdown.toggle));
}

describe('Breakdown', () => {
  it('is folded by default', () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="annually" />);
    expect(screen.getByRole('group')).not.toHaveAttribute('open');
  });

  it('shows rows and totals once opened', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="annually" />);
    await open();
    expect(screen.getByRole('group')).toHaveAttribute('open');
    expect(screen.getByText('Canada Pension Plan')).toBeVisible();
    expect(screen.getByText('3,956.75')).toBeVisible();
    expect(screen.getByText('1,077.48')).toBeVisible();
    expect(screen.getByText('Total taken off')).toBeVisible();
    expect(screen.getByText('16,531.32')).toBeVisible();
  });

  it('follows the pay period', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="monthly" />);
    await open();
    expect(screen.getByText('329.73')).toBeVisible();
  });

  it('shows the help text only after the ? button is pressed', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="annually" />);
    await open();
    const button = screen.getByRole('button', {
      name: strings.breakdown.helpButton('Canada Pension Plan'),
    });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(rows[0]?.help ?? '')).not.toBeVisible();
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(rows[0]?.help ?? '')).toBeVisible();
    await userEvent.click(button);
    expect(screen.getByText(rows[0]?.help ?? '')).not.toBeVisible();
  });

  it('works from the keyboard and closes help with Escape', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="annually" />);
    await open();
    const button = screen.getByRole('button', {
      name: strings.breakdown.helpButton('Employment Insurance'),
    });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(rows[1]?.help ?? '')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText(rows[1]?.help ?? '')).not.toBeVisible();
  });

  it('shows nothing when the adapter gave no rows', () => {
    const { container } = render(
      <Breakdown rows={[]} totals={[]} payPeriod="annually" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
