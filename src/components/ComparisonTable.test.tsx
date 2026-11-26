import { render, screen, within } from '@testing-library/react';
import { strings } from '../strings';
import { sampleHubCharts, sampleSweeps } from '../test/comparisonData';
import { ComparisonTable } from './ComparisonTable';

const copy = strings.hubCharts.comparison.table;

describe('ComparisonTable', () => {
  it('has one heading cell for each province spanning its three figures, with scopes', () => {
    render(<ComparisonTable data={sampleHubCharts} />);
    const groups = screen.getAllByRole('columnheader', {
      name: (name) =>
        Object.values(strings.siteNav.provinceNames).includes(name),
    });
    expect(groups).toHaveLength(sampleSweeps.length);
    for (const group of groups) {
      expect(group).toHaveAttribute('colspan', '3');
      expect(group).toHaveAttribute('scope', 'colgroup');
    }
  });

  it('gives each salary a row heading and a figure for every column', () => {
    render(<ComparisonTable data={sampleHubCharts} />);
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    for (const row of rows.slice(2)) {
      expect(within(row).getByRole('rowheader')).toBeInTheDocument();
      expect(within(row).getAllByRole('cell')).toHaveLength(
        sampleSweeps.length * 3,
      );
    }
  });

  it('captions the table with the year and the number of salaries', () => {
    render(<ComparisonTable data={sampleHubCharts} />);
    expect(
      screen.getByText(copy.caption(2026, 8), { exact: true }),
    ).toBeInTheDocument();
  });

  it('keeps the decimal on every rate, so the column does not mix 23% and 23.2%', () => {
    render(<ComparisonTable data={sampleHubCharts} />);
    const rates = screen
      .getAllByRole('cell')
      .map((cell) => cell.textContent)
      .filter((text) => text.endsWith('%'));
    expect(rates.length).toBeGreaterThan(0);
    for (const text of rates) expect(text).toMatch(/\.\d%$/);
  });

  it('draws nothing for a block with no province', () => {
    const { container } = render(<ComparisonTable data={{ provinces: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
