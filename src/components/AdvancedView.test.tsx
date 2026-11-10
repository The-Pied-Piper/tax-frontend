import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdvancedGroup } from '../adapters';
import { AdvancedView } from './AdvancedView';
import { strings } from '../strings';

const groups: AdvancedGroup[] = [
  {
    form: 'ca/schedule_8',
    lines: [
      { label: 'cpp basic exemption', amount: '3500.00' },
      { label: 'cpp base contribution', amount: '3867.50' },
    ],
  },
  {
    form: 'ca-on/return',
    lines: [{ label: 'take home', amount: '53468.68' }],
  },
  { form: 'ca/t2204', lines: [{ label: 'note only', amount: null }] },
];

function section() {
  return screen.getByRole('region', { name: strings.advanced.toggle });
}

function open() {
  return userEvent.click(screen.getByText(strings.advanced.toggle));
}

function form(name: string) {
  return screen.getByRole('group', { name: new RegExp(name) });
}

describe('AdvancedView', () => {
  it('is folded by default', () => {
    render(<AdvancedView groups={groups} />);
    expect(section().querySelector('details')).not.toHaveAttribute('open');
  });

  it('lists every form with its line count once opened', async () => {
    render(<AdvancedView groups={groups} />);
    await open();
    expect(within(form('ca/schedule_8')).getByText('2 lines')).toBeVisible();
    expect(within(form('ca-on/return')).getByText('1 line')).toBeVisible();
    expect(within(form('ca/t2204')).getByText('1 line')).toBeVisible();
  });

  it('shows label and yearly amount for each line of an opened form', async () => {
    render(<AdvancedView groups={groups} />);
    await open();
    await userEvent.click(
      within(form('ca/schedule_8')).getByText('ca/schedule_8'),
    );
    expect(screen.getByText('cpp basic exemption')).toBeVisible();
    expect(screen.getByText('3,500.00')).toBeVisible();
    expect(screen.getByText('3,867.50')).toBeVisible();
  });

  it('keeps a form folded until it is opened', async () => {
    render(<AdvancedView groups={groups} />);
    await open();
    expect(screen.getByText('take home')).not.toBeVisible();
    await userEvent.click(screen.getByText('ca-on/return'));
    expect(screen.getByText('take home')).toBeVisible();
    expect(screen.getByText('53,468.68')).toBeVisible();
  });

  it('says there is no amount for a line without one', async () => {
    render(<AdvancedView groups={groups} />);
    await open();
    await userEvent.click(screen.getByText('ca/t2204'));
    expect(
      screen.getByText(strings.advanced.noAmountSpoken),
    ).toBeInTheDocument();
  });

  it('shows repeated labels, negative and non-decimal amounts as given', async () => {
    render(
      <AdvancedView
        groups={[
          {
            form: 'ex/form',
            lines: [
              { label: 'same', amount: '-1234.50' },
              { label: 'same', amount: '99.00' },
              { label: 'rate', amount: '0.0505' },
              { label: 'odd', amount: 'n/a' },
            ],
          },
          { form: 'ex/empty', lines: [] },
        ]}
      />,
    );
    await open();
    await userEvent.click(screen.getByText('ex/form'));
    expect(screen.getAllByText('same')).toHaveLength(2);
    expect(screen.getByText('-1,234.50')).toBeVisible();
    expect(screen.getByText('99.00')).toBeVisible();
    expect(screen.getByText('0.0505')).toBeVisible();
    expect(screen.getByText('n/a')).toBeVisible();
    expect(screen.getByText('0 lines')).toBeVisible();
  });

  it('shows nothing when there are no forms', () => {
    const { container } = render(<AdvancedView groups={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
