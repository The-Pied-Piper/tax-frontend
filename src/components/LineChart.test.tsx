import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { LineChart, type ChartPoint } from './LineChart';
import { displayMoney } from '../money/format';

const unit = {
  placement: 'before' as const,
  singular: '$',
  plural: '$',
  spaced: false,
};
const formatValue = (value: string) => displayMoney(value, 'annually', unit);

const POINTS: ChartPoint[] = [
  { salary: '1000', values: ['950.00', '900.00'] },
  { salary: '70000', values: ['16531.32', '16000.00'] },
  { salary: '500000', values: ['201000.00', '200500.00'] },
];

const FIRST_SERIES = { id: 'tax', label: 'Income tax for the year' };
const SERIES = [
  FIRST_SERIES,
  { id: 'after', label: 'After credits', dashed: true },
];

function chart(
  overrides: Partial<React.ComponentProps<typeof LineChart>> = {},
) {
  return (
    <LineChart
      title="Income tax for the year"
      description="The tax you owe."
      points={POINTS}
      series={SERIES}
      xMin="0"
      xMax="500000"
      xTicks={['100000', '500000']}
      xAxisLabel="Salary before tax"
      yAxisLabel="Dollars a year"
      yKind="dollars"
      formatValue={formatValue}
      ariaLabel="Line chart: Income tax for the year against salary."
      activeIndex={null}
      onActiveChange={() => undefined}
      {...overrides}
    />
  );
}

const hitRect = (container: HTMLElement) => {
  const rect = container.querySelector('rect');
  if (!rect) throw new Error('no hit rect');
  return rect;
};
const svg = () => screen.getByRole('img');

describe('LineChart', () => {
  it('shows the title, the words, the axis labels and the legend', () => {
    render(chart());
    expect(
      screen.getByRole('heading', { name: 'Income tax for the year' }),
    ).toBeInTheDocument();
    expect(screen.getByText('The tax you owe.')).toBeInTheDocument();
    expect(screen.getByText('Salary before tax')).toBeInTheDocument();
    expect(screen.getByText('Dollars a year')).toBeInTheDocument();
    expect(screen.getByText('After credits')).toBeInTheDocument();
    expect(svg()).toHaveAccessibleName(
      'Line chart: Income tax for the year against salary.',
    );
  });

  it('draws one path per series, the second dashed, and round tick labels', () => {
    const { container } = render(chart());
    expect(container.querySelectorAll('path')).toHaveLength(2);
    expect(container.querySelector('path')?.getAttribute('d')).toBe(
      'M56.7 205.3L105.3 193.0L408.0 48.4',
    );
    // Salary ticks, then the money axis (0 to $250k in $50k steps).
    expect(screen.getAllByText('$100k')).toHaveLength(2);
    expect(screen.getByText('$500k')).toBeInTheDocument();
    expect(screen.getByText('$250k')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('has no legend for a single line', () => {
    render(chart({ series: [FIRST_SERIES] }));
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('draws no marker until a point is active, then the figure beside it', () => {
    const { container, rerender } = render(chart());
    expect(container.querySelector('circle')).toBeNull();
    rerender(chart({ activeIndex: 1 }));
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(screen.getByText('$16,531.32')).toBeInTheDocument();
  });

  it('ignores an active index that is not a point', () => {
    const { container } = render(chart({ activeIndex: 9 }));
    expect(container.querySelector('circle')).toBeNull();
  });

  it('reports the nearest point under the pointer', () => {
    const onActiveChange = vi.fn();
    const { container } = render(chart({ onActiveChange }));
    svg().getBoundingClientRect = () =>
      ({ left: 100, width: 420, top: 0, height: 250 }) as DOMRect;
    const hit = hitRect(container);
    // x = 105.3 in the drawing, i.e. $70,000.
    fireEvent.pointerMove(hit, { clientX: 100 + 106 });
    expect(onActiveChange).toHaveBeenLastCalledWith(1);
    fireEvent.pointerDown(hit, { clientX: 100 + 420 });
    expect(onActiveChange).toHaveBeenLastCalledWith(2);
    fireEvent.pointerDown(hit, { clientX: 100 });
    expect(onActiveChange).toHaveBeenLastCalledWith(0);
  });

  it('does nothing when the chart has no width yet', () => {
    const onActiveChange = vi.fn();
    const { container } = render(chart({ onActiveChange }));
    fireEvent.pointerMove(hitRect(container), { clientX: 50 });
    expect(onActiveChange).not.toHaveBeenCalled();
  });

  it('moves with the keyboard and clears with Escape', () => {
    const onActiveChange = vi.fn();
    const { rerender } = render(chart({ onActiveChange }));
    expect(svg()).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(svg(), { key: 'ArrowRight' });
    expect(onActiveChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(svg(), { key: 'ArrowLeft' });
    expect(onActiveChange).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(svg(), { key: 'End' });
    expect(onActiveChange).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(svg(), { key: 'Home' });
    expect(onActiveChange).toHaveBeenLastCalledWith(0);
    rerender(chart({ onActiveChange, activeIndex: 1 }));
    fireEvent.keyDown(svg(), { key: 'ArrowRight' });
    expect(onActiveChange).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(svg(), { key: 'ArrowLeft' });
    expect(onActiveChange).toHaveBeenLastCalledWith(0);
    fireEvent.keyDown(svg(), { key: 'Escape' });
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
    onActiveChange.mockClear();
    fireEvent.keyDown(svg(), { key: 'a' });
    expect(onActiveChange).not.toHaveBeenCalled();
  });

  it('draws rates as percent ticks', () => {
    render(
      chart({
        yKind: 'percent',
        series: [FIRST_SERIES],
        points: [
          { salary: '1000', values: ['0.05'] },
          { salary: '500000', values: ['0.43'] },
        ],
      }),
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders on the server with the whole chart in the HTML', () => {
    const html = renderToString(chart({ activeIndex: 1 }));
    expect(html).toContain('<path');
    expect(html).toContain('Line chart: Income tax for the year');
    expect(html).toContain('$16,531.32');
  });
});
