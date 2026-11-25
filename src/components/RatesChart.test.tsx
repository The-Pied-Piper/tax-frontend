import { fireEvent, render, screen } from '@testing-library/react';
import { RatesChart } from './RatesChart';
import { fullHubCharts } from '../test/hubNotesData';

const sweep = () => {
  const found = fullHubCharts(['ca-on']).provinces[0];
  if (!found) throw new Error('no sweep');
  return found;
};

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('RatesChart', () => {
  it('opens at $150,000 with no salary picked', () => {
    render(<RatesChart sweep={sweep()} place="Ontario" />);
    expect(
      screen.getByText('Hover or tap the chart to read a salary.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      'Salaries up to $150,000',
    );
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('from $0 to $150,000'),
    );
  });

  it('shows every figure in a table that starts closed', () => {
    const { container } = render(
      <RatesChart sweep={sweep()} place="Ontario" />,
    );
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    expect(screen.getByText('Show the figures as a table')).toBeInTheDocument();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(327);
    expect(container.querySelector('caption')?.textContent).toContain(
      'Ontario',
    );
  });

  it('moves the highest salary with the slider and never touches the address', () => {
    const before = window.location.href;
    render(<RatesChart sweep={sweep()} place="Ontario" />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      'Salaries up to $500,000',
    );
    expect(window.location.href).toBe(before);
  });

  it('picks the salary named by ?salary= and widens the range to hold it', () => {
    window.history.replaceState(null, '', '/?salary=201000');
    render(<RatesChart sweep={sweep()} place="Ontario" />);
    expect(
      screen.getByText(/^At \$201,000: marginal rate/),
    ).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      'Salaries up to $250,000',
    );
  });

  it('ignores a salary in the address that is not a point of the sweep', () => {
    window.history.replaceState(null, '', '/?salary=abc');
    render(<RatesChart sweep={sweep()} place="Ontario" />);
    expect(
      screen.getByText('Hover or tap the chart to read a salary.'),
    ).toBeInTheDocument();
  });

  it('writes the salary to the address only when asked to link to it', () => {
    window.history.replaceState(null, '', '/?salary=70000');
    render(<RatesChart sweep={sweep()} place="Ontario" />);
    window.history.replaceState(null, '', '/');
    fireEvent.click(
      screen.getByRole('button', { name: 'Link to this salary' }),
    );
    expect(window.location.search).toBe('?salary=70000');
  });
});
