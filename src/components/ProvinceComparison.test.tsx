import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { MEASURES } from '../state/provinceComparison';
import { strings } from '../strings';
import type { FooterProvinceSlug } from '../state/siteLinks';
import { sampleHubCharts, sampleSweeps } from '../test/comparisonData';
import { ProvinceComparison } from './ProvinceComparison';

const copy = strings.hubCharts.comparison;
const names = strings.siteNav.provinceNames;

function show(province: FooterProvinceSlug = 'ca-on', data = sampleHubCharts) {
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
  it('shows take-home pay at $70,000, lowest tax and contributions first, every province once', () => {
    show();
    expect(barTexts()).toEqual([
      `${names['ca-bc']}$54,348.15`,
      `${names['ca-ab']}$54,107.20`,
      `${names['ca-on']}$53,786.25`,
      `${names['ca-sk']}$52,669.31`,
      `${names['ca-mb']}$51,899.32`,
      `${names['ca-nl']}$51,703.00`,
      `${names['ca-ns']}$50,496.28`,
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
        name: 'Bar chart: Take-home pay for a $70,000 salary, by province. These figures, and every other salary, are in the table under “Show the figures as a table”.',
      }),
    ).toBeInTheDocument();
  });

  it('says what the bars are, the year and that they run from the lowest tax and contributions', () => {
    show();
    expect(
      screen.getByText(
        'Bars are for a $70,000 salary in 2026, lowest tax and contributions first. Provinces with the same amount are listed in the usual order.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.measureNotes.takeHome)).toBeInTheDocument();
  });

  it('offers the three measures under the label "Compare by"', () => {
    show();
    const group = screen.getByRole('radiogroup', { name: copy.toggleLabel });
    expect(
      within(group)
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['takeHome', 'takenOff', 'averageRate']);
    // Screen readers get the full wording; the phone wording is visual only and hidden from them.
    for (const option of MEASURES) {
      const label = measure(copy.measures[option]).parentElement;
      const hidden = label?.querySelector('[aria-hidden="true"]');
      expect(hidden?.textContent).toBe(copy.measuresPhone[option]);
    }
  });
});

describe('the highlighted province and the links', () => {
  it('marks the hub province, bold and not a link, and links every other bar to its hub', () => {
    show('ca-ab');
    const current = bars().find((bar) => bar.getAttribute('aria-current'));
    expect(current).toHaveTextContent(names['ca-ab']);
    expect(within(current as HTMLElement).queryByRole('link')).toBeNull();
    const links = bars()
      .flatMap((bar) => within(bar).queryAllByRole('link'))
      .map((link) => [link.textContent, link.getAttribute('href')]);
    expect(links).toEqual([
      [names['ca-bc'], '/ca-bc/'],
      [names['ca-on'], '/ca-on/'],
      [names['ca-sk'], '/ca-sk/'],
      [names['ca-mb'], '/ca-mb/'],
      [names['ca-nl'], '/ca-nl/'],
      [names['ca-ns'], '/ca-ns/'],
    ]);
    // The credits line is the one link besides the bars', twice: under the notes and in the fold.
    expect(
      screen
        .getAllByRole('link', { name: copy.creditsNote })
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/methodology/', '/methodology/']);
  });

  it('draws nothing when the hub province has no sweep', () => {
    const { container } = show('ca-nl', {
      provinces: sampleSweeps.filter((sweep) => sweep.slug !== 'ca-nl'),
    });
    expect(container).toBeEmptyDOMElement();
  });
});

describe('the measure toggle', () => {
  it('re-words the bars for tax and contributions and keeps the order', () => {
    show();
    fireEvent.click(measure(copy.measures.takenOff));
    expect(barTexts()).toEqual([
      `${names['ca-bc']}$15,651.85`,
      `${names['ca-ab']}$15,892.80`,
      `${names['ca-on']}$16,213.75`,
      `${names['ca-sk']}$17,330.69`,
      `${names['ca-mb']}$18,100.68`,
      `${names['ca-nl']}$18,297.00`,
      `${names['ca-ns']}$19,503.72`,
    ]);
    expect(screen.getByText(copy.measureNotes.takenOff)).toBeInTheDocument();
    expect(screen.queryByText(copy.measureNotes.takeHome)).toBeNull();
    expect(
      screen.getByRole('group', {
        name: 'Bar chart: Tax and contributions for a $70,000 salary, by province. These figures, and every other salary, are in the table under “Show the figures as a table”.',
      }),
    ).toBeInTheDocument();
  });

  it('shows the average rate as a percent, with the rate note', () => {
    show();
    fireEvent.click(measure(copy.measures.averageRate));
    expect(barTexts()).toEqual([
      `${names['ca-bc']}22.4%`,
      `${names['ca-ab']}22.7%`,
      `${names['ca-on']}23.2%`,
      `${names['ca-sk']}24.8%`,
      `${names['ca-mb']}25.9%`,
      `${names['ca-nl']}26.1%`,
      `${names['ca-ns']}27.9%`,
    ]);
    expect(screen.getByText(copy.measureNotes.averageRate)).toBeInTheDocument();
  });

  it('keeps the salary when the measure changes, and the measure when the salary changes', () => {
    show();
    fireEvent.change(slider(), { target: { value: '2' } });
    fireEvent.click(measure(copy.measures.takenOff));
    expect(slider()).toHaveAttribute('aria-valuetext', '$30,000 a year');
    fireEvent.change(slider(), { target: { value: '4' } });
    expect(measure(copy.measures.takenOff)).toBeChecked();
  });
});

describe('the salary controls', () => {
  it('moves every bar to the chosen salary: at $30,000 Ontario passes Alberta', () => {
    show();
    fireEvent.change(slider(), { target: { value: '2' } });
    fireEvent.pointerUp(slider());
    expect(
      screen.getByText(
        'Bars are for a $30,000 salary in 2026, lowest tax and contributions first. Provinces with the same amount are listed in the usual order.',
      ),
    ).toBeInTheDocument();
    expect(barTexts()).toEqual([
      `${names['ca-bc']}$26,254.39`,
      `${names['ca-on']}$26,236.88`,
      `${names['ca-ab']}$26,123.66`,
      `${names['ca-sk']}$25,743.78`,
      `${names['ca-nl']}$25,366.73`,
      `${names['ca-mb']}$25,224.22`,
      `${names['ca-ns']}$25,130.28`,
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
        'Bars are for a $150,000 salary in 2026, lowest tax and contributions first. Provinces with the same amount are listed in the usual order.',
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
      '92.9%',
    ]);
  });

  it('give the hub province its own look and the other provinces the same', () => {
    show('ca-sk');
    const rows = bars();
    const mine = rows.filter((row) => row.hasAttribute('aria-current'));
    const others = rows.filter((row) => !row.hasAttribute('aria-current'));
    expect(mine).toHaveLength(1);
    expect(others).toHaveLength(6);
    expect(new Set(others.map((row) => row.className)).size).toBe(1);
    expect(mine[0]?.className).not.toBe(others[0]?.className);
  });
});

describe('the table of the figures', () => {
  const table = () => {
    const fold = screen.getByText(copy.tableToggle).closest('details');
    return within(fold as HTMLElement).getByRole('table');
  };

  it('sits in a closed fold, written into the markup, with the credits line linked', () => {
    show();
    const fold = screen.getByText(copy.tableToggle).closest('details');
    expect(fold).not.toHaveAttribute('open');
    expect(table()).toBeInTheDocument();
    expect(
      within(fold as HTMLElement).getByRole('link', {
        name: copy.creditsNote,
      }),
    ).toHaveAttribute('href', '/methodology/');
  });

  it('has a row for every salary and three columns for every province', () => {
    show();
    const rows = within(table()).getAllByRole('row');
    // Two heading rows, then one row for each regular salary of the sample.
    expect(rows).toHaveLength(2 + 8);
    expect(
      within(rows[0] as HTMLElement)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual([
      copy.table.salaryHeader,
      ...sampleSweeps.map((sweep) => names[sweep.slug as FooterProvinceSlug]),
    ]);
    expect(
      within(rows[1] as HTMLElement)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(
      sampleSweeps.flatMap(() => [
        copy.table.takeHomeHeader,
        copy.table.takenOffHeader,
        copy.table.averageRateHeader,
      ]),
    );
    expect(
      within(table()).getByRole('columnheader', { name: names['ca-ab'] }),
    ).toHaveAttribute('colspan', '3');
  });

  it('gives each row the whole-dollar figures and one-decimal rate of every province', () => {
    show();
    const row = within(table())
      .getByRole('rowheader', { name: '$70,000' })
      .closest('tr') as HTMLElement;
    const cells = within(row)
      .getAllByRole('cell')
      .map((cell) => cell.textContent);
    // Ontario is the first province of the sample sweep.
    expect(cells.slice(0, 3)).toEqual(['$53,786', '$16,214', '23.2%']);
    expect(cells).toHaveLength(sampleSweeps.length * 3);
  });

  it('shows the same table whatever the measure and the salary', () => {
    show();
    const before = table().textContent;
    fireEvent.click(measure(copy.measures.averageRate));
    fireEvent.change(slider(), { target: { value: '2' } });
    expect(table().textContent).toBe(before);
  });

  it('can be scrolled with the keyboard and says so to a screen reader', () => {
    show();
    const region = screen.getByRole('region', {
      name: copy.table.scrollLabel,
    });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(screen.getByText(copy.table.scrollHint)).toBeInTheDocument();
  });
});

describe('the bars link to the page of the salary shown', () => {
  const withPages = {
    provinces: sampleSweeps.map((sweep) => ({
      ...sweep,
      salaryPages: sweep.slug === 'ca-bc' ? ['70000', '30000'] : [],
    })),
  };

  it("goes to the province's salary page where there is one, and to its hub where there is none", () => {
    render(<ProvinceComparison data={withPages} />);
    const hrefs = () =>
      bars().map((bar) => within(bar).getByRole('link').getAttribute('href'));
    expect(
      within(bars()[0] as HTMLElement)
        .getByRole('link')
        .getAttribute('aria-label'),
    ).toBe(
      'British Columbia: Take-home pay $54,348.15 for a $70,000 salary. Open the British Columbia page for this salary.',
    );
    expect(
      within(bars()[1] as HTMLElement)
        .getByRole('link')
        .getAttribute('aria-label'),
    ).toBe(
      'Alberta: Take-home pay $54,107.20 for a $70,000 salary. Open the Alberta hub page.',
    );
    expect(hrefs()).toEqual([
      '/ca-bc/70000/',
      '/ca-ab/',
      '/ca-on/',
      '/ca-sk/',
      '/ca-mb/',
      '/ca-nl/',
      '/ca-ns/',
    ]);
    fireEvent.change(slider(), { target: { value: '2' } });
    fireEvent.pointerUp(slider());
    expect(hrefs()).toContain('/ca-bc/30000/');
    fireEvent.change(slider(), { target: { value: '4' } });
    fireEvent.pointerUp(slider());
    expect(hrefs()).toContain('/ca-bc/');
  });
});

describe('a comparison that belongs to no province', () => {
  it('highlights none and links every bar to its hub', () => {
    render(<ProvinceComparison data={sampleHubCharts} />);
    expect(bars().some((bar) => bar.hasAttribute('aria-current'))).toBe(false);
    expect(
      bars().flatMap((bar) => within(bar).queryAllByRole('link')),
    ).toHaveLength(sampleSweeps.length);
  });
});

describe('the order of the list', () => {
  it('announces the new order once the slider is let go, and nothing before', () => {
    show();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    fireEvent.change(slider(), { target: { value: '2' } });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    fireEvent.pointerUp(slider());
    expect(screen.getByRole('status')).toHaveTextContent(
      copy.reordered('$30,000'),
    );
  });

  it('re-orders the list while the slider is dragged, before it is let go', () => {
    show();
    const first = barTexts().map((text) => text.slice(0, 5));
    // At $30,000 Ontario pays less tax than Alberta, so the order changes at once.
    fireEvent.change(slider(), { target: { value: '2' } });
    expect(barTexts().map((text) => text.slice(0, 5))).not.toEqual(first);
  });

  it('announces nothing when the slider is passed by without moving it', () => {
    show();
    fireEvent.pointerUp(slider());
    fireEvent.keyUp(slider(), { key: 'Tab' });
    fireEvent.blur(slider());
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('says so when every province has the same tax and contributions', () => {
    show();
    fireEvent.change(slider(), { target: { value: '0' } });
    expect(screen.getByText(copy.tied)).toBeInTheDocument();
    fireEvent.pointerUp(slider());
    expect(screen.getByText(copy.tied)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      copy.reorderedTied('$1,000'),
    );
  });

  it('keeps the announcement as it was while the slider is dragged away from where it was let go', () => {
    show();
    fireEvent.change(slider(), { target: { value: '0' } });
    fireEvent.pointerUp(slider());
    const spoken = copy.reorderedTied('$1,000');
    expect(screen.getByRole('status')).toHaveTextContent(spoken);
    // Dragging to a salary where provinces differ changes the list and the caption, not the spoken line.
    fireEvent.change(slider(), { target: { value: '3' } });
    expect(screen.getByRole('status')).toHaveTextContent(spoken);
  });

  it('opens at the salary the address names', () => {
    window.history.pushState({}, '', '/compare-provinces/?salary=30000');
    show();
    expect(slider()).toHaveAttribute('aria-valuetext', '$30,000 a year');
    window.history.pushState({}, '', '/');
  });

  it('opens at the nearest step to a salary the address names between steps', () => {
    window.history.pushState({}, '', '/compare-provinces/?salary=36400');
    show();
    expect(slider()).toHaveAttribute('aria-valuetext', '$30,000 a year');
    window.history.pushState({}, '', '/compare-provinces/?salary=64000');
    cleanup();
    show();
    expect(slider()).toHaveAttribute('aria-valuetext', '$70,000 a year');
    window.history.pushState({}, '', '/');
  });

  it('opens at the default for a salary outside the sweep or that is not a salary', () => {
    for (const query of ['500', '9999999', '0', '70000.50', 'abc', '']) {
      window.history.pushState({}, '', `/compare-provinces/?salary=${query}`);
      cleanup();
      show();
      expect(slider()).toHaveAttribute('aria-valuetext', '$70,000 a year');
    }
    window.history.pushState({}, '', '/');
  });
});

describe('what the card does not do', () => {
  it('fetches nothing and stores nothing', () => {
    const fetcher = vi.spyOn(globalThis, 'fetch');
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    show();
    fireEvent.click(measure(copy.measures.takenOff));
    fireEvent.change(slider(), { target: { value: '1' } });
    expect(fetcher).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    fetcher.mockRestore();
    setItem.mockRestore();
  });
});
