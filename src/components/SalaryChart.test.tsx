import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { SalaryChart } from './SalaryChart';
import { HUB_CHART_IDS, type HubChartId } from '../state/hubCharts';
import { resetChartView } from '../state/hubChartView';
import { hubChartsData } from '../test/hubChartsData';
import { strings } from '../strings';

const t = strings.hubCharts;
const data = hubChartsData(['ca-on', 'ca-ab']);

// Each chart of a hub is its own React root, so a test draws them side by side.
function hub(province: 'ca-on' | 'ca-ab' = 'ca-on', charts = HUB_CHART_IDS) {
  return render(
    <>
      {charts.map((chart) => (
        <section key={chart} aria-label={chart}>
          <SalaryChart data={data} province={province} chart={chart} />
        </section>
      ))}
    </>,
  );
}

const section = (chart: HubChartId) =>
  within(screen.getByRole('region', { name: chart }));

afterEach(() => {
  act(() => {
    resetChartView();
  });
});

describe('SalaryChart', () => {
  it('draws one chart with the marker at $70,000, and its own accessible name', () => {
    render(<SalaryChart data={data} province="ca-on" chart="averageRate" />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img')).toHaveAccessibleName(
      t.chartLabel(t.charts.averageRate.title, '$1,000', '$500,000'),
    );
  });

  it('draws no title or description of its own: the section has them', () => {
    hub();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('draws nothing for a province with no sweep', () => {
    const { container } = render(
      <SalaryChart
        data={hubChartsData(['ca-on'])}
        province="ca-bc"
        chart="takeHome"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the one-line note under the chart', () => {
    render(
      <SalaryChart
        data={hubChartsData(['ca-on'], true)}
        province="ca-on"
        chart="yearTotal"
      />,
    );
    expect(
      screen.getByText(
        'These are estimates for a single person whose only income is a salary.',
      ),
    ).toBeInTheDocument();
  });

  it('has the Per year / Per month switch on the two money charts only', () => {
    hub();
    expect(
      section('takeHome').getByRole('button', { name: t.perMonth }),
    ).toBeInTheDocument();
    expect(
      section('yearTotal').getByRole('button', { name: t.perMonth }),
    ).toBeInTheDocument();
    expect(section('averageRate').queryByRole('button')).toBeNull();
    expect(section('marginalRate').queryByRole('button')).toBeNull();
  });

  it('shows no salary readout, and has one hidden announcement for the four charts', () => {
    hub();
    const announcements = screen.getAllByText(t.readout('$70,000'));
    expect(announcements).toHaveLength(1);
    expect(announcements[0]).toHaveAttribute('aria-live', 'polite');
    expect(announcements[0]?.className).toMatch(/visuallyHidden/);
    expect(section('takeHome').getByText(t.readout('$70,000'))).toBe(
      announcements[0],
    );
  });

  it('divides money by 12 under Per month in every money chart, and leaves rates alone', () => {
    hub();
    const row = (chart: HubChartId) =>
      section(chart).getByRole('row', { name: /^\$70,000/ }).textContent;
    const before = HUB_CHART_IDS.map(row);
    fireEvent.click(
      section('takeHome').getByRole('button', { name: t.perMonth }),
    );
    const after = HUB_CHART_IDS.map(row);
    expect(after[0]).not.toBe(before[0]);
    expect(after[3]).not.toBe(before[3]);
    expect(after[1]).toBe(before[1]);
    expect(after[2]).toBe(before[2]);
    // Pressing the switch of the other money chart reads the same period.
    expect(
      section('yearTotal').getByRole('button', { name: t.perMonth }),
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      section('yearTotal').getByRole('button', { name: t.perYear }),
    );
    expect(HUB_CHART_IDS.map(row)).toEqual(before);
  });

  it('holds every sweep point in a table of its own figures, shown by a real details', () => {
    hub();
    const details = screen
      .getByRole('region', { name: 'marginalRate' })
      .querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    const rows = within(details as HTMLElement).getAllByRole('row', {
      hidden: true,
    });
    // Header row plus 307 sweep points.
    expect(rows).toHaveLength(1 + 307);
    expect(
      within(details as HTMLElement).getByRole('columnheader', {
        name: t.charts.marginalRate.header,
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(section('marginalRate').getByText(t.showTable)).toBeInTheDocument();
  });

  it('draws every figure of a table in the one basis: the year total is income tax, CPP and EI less credits paid', () => {
    hub();
    // At $3,000 Ontario pays $48.90 of EI and no income tax, and the Canada workers benefit is paid on filing.
    const rowAt = (chart: HubChartId) =>
      section(chart).getByRole('row', { name: /^\$3,000/, hidden: true });
    expect(rowAt('yearTotal')).toHaveTextContent('$48.90');
    expect(rowAt('averageRate')).toHaveTextContent('1.63%');
    expect(rowAt('marginalRate')).toHaveTextContent('-25.37%');
  });

  it('moves the marker of every chart, and the announcement, with the keyboard in one', () => {
    hub();
    const charts = screen.getAllByRole('img');
    const [first, second] = charts;
    if (!first || !second) throw new Error('no charts');
    fireEvent.keyDown(second, { key: 'ArrowRight' });
    expect(screen.getByText(t.readout('$71,000'))).toBeInTheDocument();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByText(t.readout('$72,000'))).toBeInTheDocument();
    fireEvent.keyDown(first, { key: 'Escape' });
    expect(screen.getByText(t.readout('$70,000'))).toBeInTheDocument();
  });
});
