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
      points={POINTS}
      series={SERIES}
      xMin="0"
      xMax="500000"
      xTicks={['100000', '300000', '500000']}
      xTicksPhone={['400000', '500000']}
      xAxisLabel="Salary before tax"
      yAxisLabel="Dollars a year"
      xUnit={unit}
      yUnit={unit}
      formatValue={formatValue}
      ariaLabel="Line chart: Income tax for the year against salary."
      activeIndex={null}
      onActiveChange={() => undefined}
      {...overrides}
    />
  );
}

const hitRect = (container: HTMLElement) => {
  // The last rectangle is the one over the plot that takes the pointer (the first is the clip).
  const rect = [...container.querySelectorAll('rect')].pop();
  if (!rect) throw new Error('no hit rect');
  return rect;
};
const svg = () => screen.getByRole('img');

describe('LineChart', () => {
  it('on a phone hides every other label up the side beyond four, keeping the zero line labelled', () => {
    const { container } = render(
      chart({
        points: [
          { salary: '1000', values: ['-40000'] },
          { salary: '500000', values: ['140000'] },
        ],
        series: [FIRST_SERIES],
      }),
    );
    // Ticks -50k, 0, 50k, 100k, 150k: the zero line stays, and every other label from it.
    const hidden = [...container.querySelectorAll('text')]
      .filter((node) => /desktopOnly/.test(node.getAttribute('class') ?? ''))
      .map((node) => node.textContent);
    expect(hidden).toEqual(expect.arrayContaining(['-$50k', '$50k', '$150k']));
    expect(hidden).not.toContain('$0');
  });

  it('keeps every label up the side when there are four or fewer', () => {
    const { container } = render(
      chart({
        points: [
          { salary: '1000', values: ['0'] },
          { salary: '500000', values: ['300000'] },
        ],
        series: [FIRST_SERIES],
      }),
    );
    expect(
      container.querySelectorAll('text[class*="desktopOnly"]'),
    ).toHaveLength(
      // The two salary labels only desktop shows: $100k and $300k.
      2,
    );
  });

  it('marks which salary labels are for desktop only and which for phones only', () => {
    render(chart());
    // A class name carries the CSS module's hashed name; match on its stem.
    const classes = (text: string) =>
      screen.getByText(text).getAttribute('class') ?? '';
    expect(classes('$300k')).toMatch(/desktopOnly/);
    expect(classes('$400k')).toMatch(/phoneOnly/);
    // On both: no visibility class; the phone's last label ends at the edge.
    expect(classes('$500k')).not.toMatch(/desktopOnly|phoneOnly/);
    expect(classes('$500k')).toMatch(/phoneEnd/);
    expect(classes('$400k')).not.toMatch(/phoneEnd/);
  });

  it('shows the axis labels and the legend', () => {
    render(chart());
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

  it('keeps the marker figure inside the chart at the top of the axis', () => {
    const { container } = render(
      chart({
        activeIndex: 1,
        series: [FIRST_SERIES],
        points: [
          { salary: '1000', values: ['0'] },
          { salary: '500000', values: ['200000'] },
        ],
      }),
    );
    const label = [...container.querySelectorAll('text')].find(
      (t) => t.textContent === '$200,000.00',
    );
    // The dot is at y = 10.0; the figure is held down to 22.0.
    expect(label?.getAttribute('y')).toBe('22.0');
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
    rerender(chart({ onActiveChange, activeIndex: 500 }));
    fireEvent.keyDown(svg(), { key: 'ArrowLeft' });
    expect(onActiveChange).toHaveBeenLastCalledWith(1);
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
        yUnit: {
          ...unit,
          placement: 'after',
          singular: '%',
          plural: '%',
          spaced: true,
          as_percentage: true,
        },
        series: [FIRST_SERIES],
        points: [
          { salary: '1000', values: ['0.05'] },
          { salary: '500000', values: ['0.43'] },
        ],
      }),
    );
    expect(screen.getByText('50 %')).toBeInTheDocument();
  });

  it('renders on the server with the whole chart in the HTML', () => {
    const html = renderToString(chart({ activeIndex: 1 }));
    expect(html).toContain('<path');
    expect(html).toContain('Line chart: Income tax for the year');
    expect(html).toContain('$16,531.32');
  });

  it('sets the vertical scale from scaleValues only, and cuts the lines at the top of the plot', () => {
    const { container, rerender } = render(chart());
    const labels = () =>
      [...container.querySelectorAll('text')].map((t) => t.textContent);
    expect(labels()).toContain('$200k');
    // Only the first point sets the scale: the axis ends at the first tick above 950.
    rerender(chart({ scaleValues: ['950.00', '900.00'] }));
    expect(labels()).not.toContain('$200k');
    const clip = container.querySelector('clipPath rect');
    expect(clip).not.toBeNull();
    expect(container.querySelector('g[clip-path]')).not.toBeNull();
  });

  it('leaves the figure beside the marker out when markerLabel is false', () => {
    const withLabel = render(chart({ activeIndex: 1 }));
    expect(
      withLabel.container.querySelector(
        'text.markerLabel, text[class*="markerLabel"]',
      ),
    ).not.toBeNull();
    withLabel.unmount();
    const without = render(chart({ activeIndex: 1, markerLabel: false }));
    expect(
      without.container.querySelector('text[class*="markerLabel"]'),
    ).toBeNull();
  });

  it('draws a note in the top corner of the plot', () => {
    render(chart({ topNote: 'Off the top: 100.0% from $2,000 to $2,033' }));
    expect(
      screen.getByText('Off the top: 100.0% from $2,000 to $2,033'),
    ).toBeInTheDocument();
  });

  it('right-aligns the label at the end of the axis so it is not cut off', () => {
    const { container } = render(chart());
    const labels = [...container.querySelectorAll('text')];
    const end = labels.find((t) => t.textContent === '$500k');
    const middle = labels.find((t) => t.textContent === '$300k');
    expect(end?.getAttribute('text-anchor')).toBe('end');
    expect(middle?.getAttribute('text-anchor')).toBe('middle');
  });
});
