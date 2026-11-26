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
    expect(details?.querySelector('summary')?.textContent).toBe(
      'Show the figures as a table',
    );
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

  it('hovers the salary and both rates beside the dot, and still reads them aloud', () => {
    window.history.replaceState(null, '', '/?salary=70000');
    render(<RatesChart sweep={sweep()} place="Ontario" />);
    const label = screen
      .getByRole('img')
      .querySelector('text[class*="markerLabel"]');
    const lines = [...(label?.querySelectorAll('tspan') ?? [])].map(
      (t) => t.textContent,
    );
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('$70,000');
    expect(lines[1]).toMatch(/^Marginal rate: \d+(\.\d)?%$/);
    expect(lines[2]).toMatch(/^Average rate: \d+(\.\d)?%$/);
    expect(
      screen.getByText(/^At \$70,000: marginal rate/).closest('[aria-live]'),
    ).not.toBeNull();
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

  it('leaves the $2,000 band out of the scale and says where it goes off the top', () => {
    render(<RatesChart sweep={sweep()} place="Ontario" />);
    expect(
      screen.getByText('Off the top: 100% from $2,000 to $2,033'),
    ).toBeInTheDocument();
    // The scale is set by the rates above $5,000 (the 59.1% spike is the highest at $150,000), not by 100%.
    expect(screen.getByRole('img').textContent).not.toContain('100%');
  });

  it('labels every $50,000 up to $250,000 and every $100,000 beyond, ending the axis at the range', () => {
    const labels = () =>
      [...screen.getByRole('img').querySelectorAll('text')].map(
        (t) => t.textContent,
      );
    render(<RatesChart sweep={sweep()} place="Ontario" />);
    expect(labels()).toEqual(
      expect.arrayContaining(['$50k', '$100k', '$150k']),
    );
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });
    expect(labels()).toEqual(
      expect.arrayContaining(['$100k', '$200k', '$300k', '$400k', '$500k']),
    );
    expect(labels()).not.toContain('$50k');
  });

  describe('on a phone-width screen', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    afterEach(() => {
      if (original) Object.defineProperty(window, 'matchMedia', original);
      else Reflect.deleteProperty(window, 'matchMedia');
    });
    const mock = (matches: boolean) => {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        value: (query: string) => ({
          matches,
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }),
      });
    };

    it('draws the taller figure', () => {
      mock(true);
      render(<RatesChart sweep={sweep()} place="Ontario" />);
      expect(screen.getByRole('img')).toHaveAttribute('viewBox', '0 0 420 400');
    });

    it('draws the wide figure on a wider screen and where matchMedia is missing', () => {
      mock(false);
      const wide = render(<RatesChart sweep={sweep()} place="Ontario" />);
      expect(screen.getByRole('img')).toHaveAttribute('viewBox', '0 0 420 250');
      wide.unmount();
      Reflect.deleteProperty(window, 'matchMedia');
      render(<RatesChart sweep={sweep()} place="Ontario" />);
      expect(screen.getByRole('img')).toHaveAttribute('viewBox', '0 0 420 250');
    });
  });
});
