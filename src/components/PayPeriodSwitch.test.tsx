import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { PayPeriodSwitch } from './PayPeriodSwitch';
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
    const labels = screen
      .getAllByRole('radio')
      .map((r) => (r as HTMLInputElement).labels?.[0]?.textContent);
    expect(labels).toEqual(['Weekly', 'Bi-weekly', 'Monthly', 'Annually']);
    expect(screen.getByRole('radio', { name: 'Annually' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('53468.68');
  });

  it('reports the chosen period', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('radio', { name: 'Monthly' }));
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('4455.72');
    fireEvent.click(screen.getByRole('radio', { name: 'Weekly' }));
    expect(screen.getByRole('status')).toHaveTextContent('1028.24');
  });
});
