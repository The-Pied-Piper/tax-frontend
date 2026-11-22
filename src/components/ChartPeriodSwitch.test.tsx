import { fireEvent, render, screen } from '@testing-library/react';
import { ChartPeriodSwitch } from './ChartPeriodSwitch';
import { strings } from '../strings';

describe('ChartPeriodSwitch', () => {
  it('shows both choices and marks the chosen one pressed', () => {
    render(<ChartPeriodSwitch value="monthly" onChange={() => undefined} />);
    expect(
      screen.getByRole('button', { name: strings.hubCharts.perMonth }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: strings.hubCharts.perYear }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the period that was clicked', () => {
    const onChange = vi.fn();
    render(<ChartPeriodSwitch value="annually" onChange={onChange} />);
    fireEvent.click(
      screen.getByRole('button', { name: strings.hubCharts.perMonth }),
    );
    expect(onChange).toHaveBeenCalledWith('monthly');
  });
});
