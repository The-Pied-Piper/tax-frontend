import { fireEvent, render, screen, within } from '@testing-library/react';
import { strings } from '../strings';
import { sampleHubCharts, sampleSweeps } from '../test/hubChartsData';
import { ProvinceComparison } from './ProvinceComparison';

const copy = strings.hubCharts.comparison;
const names = strings.siteNav.provinceNames;

function show(province = 'ca-on', data = sampleHubCharts) {
  return render(<ProvinceComparison data={data} province={province} />);
}

const bars = () =>
  within(screen.getByRole('group', { name: /^Bar chart:/ })).getAllByRole(
    'listitem',
  );
const barTexts = () => bars().map((bar) => bar.textContent);
const slider = () => screen.getByRole('slider', { name: copy.salaryLabel });
const box = () => screen.getByRole('textbox', { name: copy.typedLabel });
const measure = (name: string) => screen.getByRole('radio', { name });

describe('ProvinceComparison at the start', () => {
  it('shows take-home pay at $70,000, highest first, every province once', () => {
    show();
    expect(barTexts()).toEqual([
      `${names['ca-bc']}$54,348.15`,
      `${names['ca-ab']}$54,107.20`,
      `${names['ca-on']}$53,786.25`,
      `${names['ca-sk']}$52,669.31`,
      `${names['ca-mb']}$51,899.32`,
      `${names['ca-nl']}$51,703.00`,
    ]);
    expect(measure(copy.measures.takeHome)).toBeChecked();
  });

  it('starts the slider and the box at $70,000', () => {
    show();
    expect(slider()).toHaveAttribute('aria-valuetext', '$70,000 a year');
    expect(box()).toHaveValue('70,000');
  });

  it('labels the bars for a screen reader with the approved sentence', () => {
    show();
    expect(
      screen.getByRole('group', {
        name: 'Bar chart: Take-home pay for a $70,000 salary, by province. The same figures are in the table below.',
      }),
    ).toBeInTheDocument();
  });

  it('says what the bars are, the year and that they run from highest to lowest', () => {
    show();
    expect(
      screen.getByText(
        'Bars are for a $70,000 salary in 2026, from highest to lowest.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.measureNotes.takeHome)).toBeInTheDocument();
  });

  it('says the figures are provisional only when the year is', () => {
    const { unmount } = show();
    expect(
      screen.getByText('The 2026 figures are provisional.'),
    ).toBeInTheDocument();
    unmount();
    show('ca-on', {
      provinces: sampleSweeps.map((sweep) => ({
        ...sweep,
        provisional: false,
      })),
    });
    expect(screen.queryByText(/provisional/)).toBeNull();
  });

  it('offers the three measures under the label "Compare by"', () => {
    show();
    const group = screen.getByRole('radiogroup', { name: copy.toggleLabel });
    expect(
      within(group)
        .getAllByRole('radio')
        .map((radio) => radio.parentElement?.textContent),
    ).toEqual(['Take-home pay', 'Income tax', 'Average income tax rate']);
  });
});

describe('the highlighted province and the links', () => {
  it('marks the hub province, bold and not a link, and links every other bar to its hub', () => {
    show('ca-ab');
    const current = bars().find((bar) => bar.getAttribute('aria-current'));
    expect(current).toHaveTextContent(names['ca-ab']);
    expect(within(current as HTMLElement).queryByRole('link')).toBeNull();
    const links = screen
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')]);
    expect(links).toEqual([
      [names['ca-bc'], '/ca-bc/'],
      [names['ca-on'], '/ca-on/'],
      [names['ca-sk'], '/ca-sk/'],
      [names['ca-mb'], '/ca-mb/'],
      [names['ca-nl'], '/ca-nl/'],
    ]);
  });

  it('draws nothing when the hub province has no sweep', () => {
    const { container } = show('ca-xx');
    expect(container).toBeEmptyDOMElement();
  });
});

describe('the measure toggle', () => {
  it('re-sorts and re-words the bars for income tax', () => {
    show();
    fireEvent.click(measure(copy.measures.incomeTax));
    expect(barTexts()).toEqual([
      `${names['ca-nl']}$13,217.18`,
      `${names['ca-mb']}$13,020.86`,
      `${names['ca-sk']}$12,250.87`,
      `${names['ca-on']}$11,133.93`,
      `${names['ca-ab']}$10,812.98`,
      `${names['ca-bc']}$10,572.03`,
    ]);
    expect(screen.getByText(copy.measureNotes.incomeTax)).toBeInTheDocument();
    expect(screen.queryByText(copy.measureNotes.takeHome)).toBeNull();
    expect(
      screen.getByRole('group', {
        name: 'Bar chart: Income tax for a $70,000 salary, by province. The same figures are in the table below.',
      }),
    ).toBeInTheDocument();
  });

  it('shows the average rate as a percent, with the rate note', () => {
    show();
    fireEvent.click(measure(copy.measures.averageRate));
    expect(barTexts()).toEqual([
      `${names['ca-nl']}18.88%`,
      `${names['ca-mb']}18.6%`,
      `${names['ca-sk']}17.5%`,
      `${names['ca-on']}15.91%`,
      `${names['ca-ab']}15.45%`,
      `${names['ca-bc']}15.1%`,
    ]);
    expect(screen.getByText(copy.measureNotes.averageRate)).toBeInTheDocument();
  });

  it('keeps the salary when the measure changes, and the measure when the salary changes', () => {
    show();
    fireEvent.change(slider(), { target: { value: '2' } });
    fireEvent.click(measure(copy.measures.incomeTax));
    expect(slider()).toHaveAttribute('aria-valuetext', '$30,000 a year');
    fireEvent.change(slider(), { target: { value: '4' } });
    expect(measure(copy.measures.incomeTax)).toBeChecked();
  });
});

describe('the salary controls', () => {
  it('moves every bar to the chosen salary: at $30,000 Ontario passes Alberta', () => {
    show();
    fireEvent.change(slider(), { target: { value: '2' } });
    expect(
      screen.getByText(
        'Bars are for a $30,000 salary in 2026, from highest to lowest.',
      ),
    ).toBeInTheDocument();
    expect(barTexts()).toEqual([
      `${names['ca-bc']}$26,254.39`,
      `${names['ca-on']}$26,236.88`,
      `${names['ca-ab']}$26,123.66`,
      `${names['ca-sk']}$25,743.78`,
      `${names['ca-nl']}$25,366.73`,
      `${names['ca-mb']}$25,224.22`,
    ]);
  });

  it('snaps a typed salary to the nearest point of the sweep', () => {
    show();
    fireEvent.change(box(), { target: { value: '140,000' } });
    fireEvent.blur(box());
    // The sample sweep has points at $70,000 and $150,000, and $150,000 is nearer.
    expect(slider()).toHaveAttribute('aria-valuetext', '$150,000 a year');
    expect(
      screen.getByText(
        'Bars are for a $150,000 salary in 2026, from highest to lowest.',
      ),
    ).toBeInTheDocument();
  });

  it('refuses a typed salary above the sweep and leaves the bars alone', () => {
    show();
    const before = barTexts();
    fireEvent.change(box(), { target: { value: '750000' } });
    fireEvent.blur(box());
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a salary from $1,000 to $500,000.',
    );
    expect(barTexts()).toEqual(before);
  });
});

describe('the bars', () => {
  const widths = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>('li [aria-hidden] > span'),
    ).map((fill) => fill.style.width);

  it('draw the highest province at full width and the others in proportion', () => {
    show();
    expect(widths()).toEqual([
      '100%',
      '99.6%',
      '99%',
      '96.9%',
      '95.5%',
      '95.1%',
    ]);
  });

  it('give the hub province its own look and the other provinces the same', () => {
    show('ca-sk');
    const rows = bars();
    const mine = rows.filter((row) => row.hasAttribute('aria-current'));
    const others = rows.filter((row) => !row.hasAttribute('aria-current'));
    expect(mine).toHaveLength(1);
    expect(others).toHaveLength(5);
    expect(new Set(others.map((row) => row.className)).size).toBe(1);
    expect(mine[0]?.className).not.toBe(others[0]?.className);
  });
});

describe('the table of the figures', () => {
  it('lists every province and the measure in a table inside a closed fold', () => {
    show();
    const fold = screen.getByText(copy.tableToggle).closest('details');
    expect(fold).not.toHaveAttribute('open');
    const table = within(fold as HTMLElement).getByRole('table');
    expect(
      within(table)
        .getAllByRole('row')
        .map((row) => row.textContent),
    ).toEqual([
      `${copy.tableProvince}${copy.measures.takeHome}`,
      `${names['ca-bc']}$54,348.15`,
      `${names['ca-ab']}$54,107.20`,
      `${names['ca-on']}$53,786.25`,
      `${names['ca-sk']}$52,669.31`,
      `${names['ca-mb']}$51,899.32`,
      `${names['ca-nl']}$51,703.00`,
    ]);
  });

  it('follows the measure and the salary', () => {
    show();
    fireEvent.click(measure(copy.measures.averageRate));
    const table = screen.getByRole('table');
    expect(
      within(table).getByRole('columnheader', {
        name: copy.measures.averageRate,
      }),
    ).toBeInTheDocument();
    expect(within(table).getByText('15.91%')).toBeInTheDocument();
  });
});

describe('what the card does not do', () => {
  it('fetches nothing and stores nothing', () => {
    const fetcher = vi.spyOn(globalThis, 'fetch');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    show();
    fireEvent.click(measure(copy.measures.incomeTax));
    fireEvent.change(slider(), { target: { value: '1' } });
    expect(fetcher).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    fetcher.mockRestore();
    setItem.mockRestore();
  });
});
