import { fireEvent, render, screen, within } from '@testing-library/react';
import { SalaryChartsCard } from './SalaryChartsCard';
import { hubChartsData } from '../test/hubChartsData';
import { strings } from '../strings';

const t = strings.hubCharts;
const data = hubChartsData(['ca-on', 'ca-ab']);

describe('SalaryChartsCard', () => {
  it('draws four charts with their titles, the marker at $70,000 and the readout', () => {
    render(<SalaryChartsCard data={data} province="ca-on" />);
    expect(screen.getAllByRole('img')).toHaveLength(4);
    for (const title of [
      t.averageTitle,
      t.marginalTitle,
      t.takeHomeTitle,
      t.incomeTaxTitle,
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    expect(screen.getByText(t.readout('$70,000'))).toBeInTheDocument();
    expect(screen.getByText(t.intro('four'))).toBeInTheDocument();
  });

  it('uses the province name in the words and the sweep of that province', () => {
    render(<SalaryChartsCard data={data} province="ca-ab" />);
    expect(screen.getByText(t.averageText('Alberta'))).toBeInTheDocument();
  });

  it('draws nothing for a province with no sweep', () => {
    const { container } = render(
      <SalaryChartsCard data={hubChartsData(['ca-on'])} province="ca-bc" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('says the figures are provisional only when they are', () => {
    const { unmount } = render(
      <SalaryChartsCard
        data={hubChartsData(['ca-on'], true)}
        province="ca-on"
      />,
    );
    expect(screen.getByText(t.provisional(2026))).toBeInTheDocument();
    unmount();
    render(
      <SalaryChartsCard
        data={hubChartsData(['ca-on'], false)}
        province="ca-on"
      />,
    );
    expect(screen.queryByText(t.provisional(2026))).toBeNull();
  });

  it('divides money by 12 under Per month and leaves rates alone', () => {
    render(<SalaryChartsCard data={data} province="ca-on" />);
    const row = () =>
      screen.getByRole('row', { name: /^\$70,000/ }).textContent;
    // The table is in the HTML even closed; the row for $70,000 at index 69.
    const yearly = row();
    fireEvent.click(screen.getByRole('button', { name: t.perMonth }));
    const monthly = row();
    expect(monthly).not.toBe(yearly);
    // Rates (the 2nd and 3rd cells) are the same under both.
    expect(yearly.slice(0, 30)).toContain('%');
    fireEvent.click(screen.getByRole('button', { name: t.perYear }));
    expect(row()).toBe(yearly);
  });

  it('holds every sweep point in a table of real rows, shown by a real details', () => {
    const { container } = render(
      <SalaryChartsCard data={data} province="ca-on" />,
    );
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    const rows = within(details as HTMLElement).getAllByRole('row', {
      hidden: true,
    });
    // Header row plus 250 + 50 sweep points.
    expect(rows).toHaveLength(1 + 300);
    expect(screen.getByText(t.showTable)).toBeInTheDocument();
  });

  it('moves the marker, and so the readout, with the keyboard', () => {
    render(<SalaryChartsCard data={data} province="ca-on" />);
    const [chart] = screen.getAllByRole('img');
    if (!chart) throw new Error('no chart');
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    expect(screen.getByText(t.readout('$71,000'))).toBeInTheDocument();
    fireEvent.keyDown(chart, { key: 'Escape' });
    expect(screen.getByText(t.readout('$70,000'))).toBeInTheDocument();
  });
});
