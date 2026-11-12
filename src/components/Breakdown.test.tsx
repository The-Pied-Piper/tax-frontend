import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DisplayRow } from '../adapters';
import { Breakdown } from './Breakdown';
import { strings } from '../strings';
import { cad, months } from '../test/units';

const rows: DisplayRow[] = [
  {
    id: 'cpp',
    name: 'Canada Pension Plan',
    help: 'Pension contributions taken from each paycheque.',
    amount: '3956.75',
    unit: cad,
    group: 'Pension',
  },
  {
    id: 'ei',
    name: 'Employment Insurance',
    help: 'Insurance against losing your job.',
    amount: '1077.48',
    unit: cad,
    group: 'Employment Insurance',
  },
];
const totals: DisplayRow[] = [
  {
    id: 'taken-off',
    name: 'Total taken off',
    help: 'Everything taken from your salary.',
    amount: '16531.32',
    unit: cad,
  },
];

function open() {
  return userEvent.click(screen.getByText(strings.breakdown.toggle));
}

describe('Breakdown', () => {
  it('is folded by default', () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="annually" />);
    expect(screen.getByRole('group')).not.toHaveAttribute('open');
  });

  it('shows rows and totals once opened', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="annually" />);
    await open();
    expect(screen.getByRole('group')).toHaveAttribute('open');
    expect(screen.getByText('Canada Pension Plan')).toBeVisible();
    expect(screen.getByText('CA$3,956.75')).toBeVisible();
    expect(screen.getByText('CA$1,077.48')).toBeVisible();
    expect(screen.getByText('Total taken off')).toBeVisible();
    expect(screen.getByText('CA$16,531.32')).toBeVisible();
  });

  it('lists rows under their headings, grouped totals after the rows', async () => {
    const mixed: DisplayRow[] = [
      ...rows,
      {
        id: 'fed',
        name: 'Federal',
        help: 'h',
        amount: '7585.64',
        unit: cad,
        group: 'Income tax',
      },
    ];
    const mixedTotals: DisplayRow[] = [
      {
        id: 'tt',
        name: 'Total tax',
        help: 'h',
        amount: '11497.09',
        unit: cad,
        group: 'Income tax',
      },
      ...totals,
    ];
    render(
      <Breakdown rows={mixed} totals={mixedTotals} payPeriod="annually" />,
    );
    await open();
    const headings = screen.getAllByRole('heading', { level: 4 });
    expect(headings.map((h) => h.textContent)).toEqual([
      'Pension',
      'Employment Insurance',
      'Income tax',
    ]);
    const names = (heading: HTMLElement | undefined) =>
      Array.from(heading?.nextElementSibling?.querySelectorAll('dt') ?? []).map(
        (dt) => dt.textContent,
      );
    expect(names(headings[2])).toEqual(['Federal?h', 'Total tax?h']);
    // A row with no heading is listed last, in a section without a heading.
    const last = screen.getByText('Total taken off').closest('dl');
    expect(last?.previousElementSibling).toBeNull();
    expect(last?.parentElement?.nextElementSibling).toBeNull();
    expect(last?.parentElement).toContainElement(
      screen.getByText('Total taken off'),
    );
  });

  it('treats an empty heading as no heading', async () => {
    const blank: DisplayRow[] = [
      {
        id: 'b',
        name: 'Blank',
        help: 'h',
        amount: '1.00',
        unit: cad,
        group: '  ',
      },
    ];
    render(<Breakdown rows={blank} totals={[]} payPeriod="annually" />);
    await open();
    expect(screen.queryAllByRole('heading', { level: 4 })).toHaveLength(0);
    expect(screen.getByText('Blank')).toBeVisible();
  });

  it('follows the pay period', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="monthly" />);
    await open();
    expect(screen.getByText('CA$329.73')).toBeVisible();
  });

  it('shows the help text only after the ? button is pressed', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="annually" />);
    await open();
    const button = screen.getByRole('button', {
      name: strings.breakdown.helpButton('Canada Pension Plan'),
    });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(rows[0]?.help ?? '')).not.toBeVisible();
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(rows[0]?.help ?? '')).toBeVisible();
    await userEvent.click(button);
    expect(screen.getByText(rows[0]?.help ?? '')).not.toBeVisible();
  });

  it('works from the keyboard and closes help with Escape', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="annually" />);
    await open();
    const button = screen.getByRole('button', {
      name: strings.breakdown.helpButton('Employment Insurance'),
    });
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(rows[1]?.help ?? '')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText(rows[1]?.help ?? '')).not.toBeVisible();
  });

  it('shows nothing when the adapter gave no rows', () => {
    const { container } = render(
      <Breakdown rows={[]} totals={[]} payPeriod="annually" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows an amount it cannot divide as the engine sent it', async () => {
    const odd: DisplayRow[] = [
      { id: 'odd', name: 'Odd', help: 'x', amount: '3956.755', unit: cad },
    ];
    render(<Breakdown rows={odd} totals={[]} payPeriod="monthly" />);
    await open();
    expect(screen.getByText('3956.755')).toBeVisible();
  });

  it('shows the unit before every amount', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="annually" />);
    await open();
    const amounts = screen
      .getAllByRole('definition')
      .map((dd) => dd.textContent);
    expect(amounts).toEqual(['CA$3,956.75', 'CA$1,077.48', 'CA$16,531.32']);
  });

  it('keeps the unit on the pay-period figure', async () => {
    render(<Breakdown rows={rows} totals={totals} payPeriod="weekly" />);
    await open();
    expect(screen.getByText('CA$76.09')).toBeVisible();
    expect(screen.getByText('CA$20.72')).toBeVisible();
    expect(screen.getByText('CA$317.91')).toBeVisible();
  });

  it('uses the unit of each row', async () => {
    const mixed: DisplayRow[] = [
      { id: 'a', name: 'Cash', help: 'h', amount: '1077.48', unit: cad },
      { id: 'b', name: 'Time', help: 'h', amount: '12.00', unit: months },
      { id: 'c', name: 'One', help: 'h', amount: '1.00', unit: months },
    ];
    render(<Breakdown rows={mixed} totals={[]} payPeriod="annually" />);
    await open();
    expect(screen.getByText('CA$1,077.48')).toBeVisible();
    expect(screen.getByText('12.00 months')).toBeVisible();
    expect(screen.getByText('1.00 month')).toBeVisible();
  });

  it('shows a bare amount for a row with no unit', async () => {
    const bare: DisplayRow[] = [
      { id: 'r', name: 'Rate', help: 'h', amount: '1077.48', unit: null },
    ];
    render(<Breakdown rows={bare} totals={[]} payPeriod="annually" />);
    await open();
    expect(screen.getByText('1,077.48')).toBeVisible();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });
});
