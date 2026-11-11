import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayPeriodSwitch } from './PayPeriodSwitch';
import { strings } from '../strings';
import { amountForPeriod, type PayPeriod } from '../money/payPeriod';

function Harness() {
  const [period, setPeriod] = useState<PayPeriod>('annually');
  return (
    <>
      <PayPeriodSwitch value={period} onChange={setPeriod} />
      <output>{amountForPeriod('53468.68', period)}</output>
    </>
  );
}

describe('PayPeriodSwitch', () => {
  it('offers the four periods with Annually chosen by default', () => {
    render(<Harness />);
    expect(
      screen.getByRole('group', { name: strings.payPeriod.legend }),
    ).toBeInTheDocument();
    const labels = screen
      .getAllByRole('radio')
      .map((r) => (r as HTMLInputElement).labels?.[0]?.textContent);
    expect(labels).toEqual(['Weekly', 'Bi-weekly', 'Monthly', 'Annually']);
    expect(screen.getByRole('radio', { name: 'Annually' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('53468.68');
  });

  it('reports the chosen period', async () => {
    render(<Harness />);
    await userEvent.click(
      screen.getByRole('radio', { name: strings.payPeriod.monthly }),
    );
    expect(
      screen.getByRole('radio', { name: strings.payPeriod.monthly }),
    ).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('4455.72');
    await userEvent.click(
      screen.getByRole('radio', { name: strings.payPeriod.weekly }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('1028.24');
  });
});
