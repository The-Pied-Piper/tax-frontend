import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdvancedGroup } from '../adapters';
import { AdvancedView } from './AdvancedView';
import { strings } from '../strings';
import { cad, months } from '../test/units';

const groups: AdvancedGroup[] = [
  {
    form: 'ca/schedule_8',
    name: 'ca/schedule_8',
    lines: [
      {
        label: 'cpp basic exemption',
        reference: null,
        amount: '3500.00',
        detail: 'd',
        named: true,
        unit: null,
      },
      {
        label: 'cpp base contribution',
        reference: null,
        amount: '3867.50',
        detail: 'd',
        named: true,
        unit: null,
      },
    ],
  },
  {
    form: 'ca-on/return',
    name: 'ca-on/return',
    lines: [
      {
        label: 'take home',
        reference: null,
        amount: '53468.68',
        detail: 'd',
        named: true,
        unit: null,
      },
    ],
  },
  {
    form: 'ca/t2204',
    name: 'ca/t2204',
    lines: [
      {
        label: 'note only',
        reference: null,
        amount: null,
        detail: 'd',
        named: true,
        unit: null,
      },
    ],
  },
];

function section() {
  return screen.getByRole('group', { name: strings.advanced.heading });
}

function open() {
  return userEvent.click(
    screen.getByRole('checkbox', { name: strings.advanced.toggle }),
  );
}

function form(name: string) {
  return screen.getByRole('group', { name: new RegExp(name) });
}

describe('AdvancedView', () => {
  it('is off by default and shows no forms', () => {
    render(<AdvancedView groups={groups} />);
    expect(
      screen.getByRole('checkbox', { name: strings.advanced.toggle }),
    ).not.toBeChecked();
    expect(screen.queryByText(strings.advanced.note)).not.toBeInTheDocument();
    expect(screen.queryByText('ca/schedule_8')).not.toBeInTheDocument();
  });

  it('can be switched on from the keyboard', async () => {
    render(<AdvancedView groups={groups} />);
    await userEvent.tab();
    const box = screen.getByRole('checkbox', { name: strings.advanced.toggle });
    expect(box).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(box).toBeChecked();
    expect(within(section()).getByText('ca/schedule_8')).toBeVisible();
  });

  it('shows the yearly note and hides the forms again when switched off', async () => {
    render(<AdvancedView groups={groups} />);
    await open();
    expect(screen.getByText(strings.advanced.note)).toBeVisible();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.queryByText('ca/schedule_8')).not.toBeInTheDocument();
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
            name: 'ex/form',
            lines: [
              {
                label: 'same',
                reference: null,
                amount: '-1234.50',
                detail: 'd',
                named: true,
                unit: null,
              },
              {
                label: 'same',
                reference: null,
                amount: '99.00',
                detail: 'd',
                named: true,
                unit: null,
              },
              {
                label: 'rate',
                reference: null,
                amount: '0.0505',
                detail: 'd',
                named: true,
                unit: null,
              },
              {
                label: 'odd',
                reference: null,
                amount: 'n/a',
                detail: 'd',
                named: true,
                unit: null,
              },
            ],
          },
          { form: 'ex/empty', name: 'ex/empty', lines: [] },
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

  it('shows the form name and the printed reference beside a line', async () => {
    render(
      <AdvancedView
        groups={[
          {
            form: 'ex/form',
            name: 'Example form',
            lines: [
              {
                label: 'Printed figure',
                reference: '65',
                amount: '1.00',
                detail: 'd',
                named: true,
                unit: null,
              },
              {
                label: 'Engine step',
                reference: null,
                amount: '2.00',
                detail: 'd',
                named: true,
                unit: null,
              },
            ],
          },
        ]}
      />,
    );
    await open();
    await userEvent.click(screen.getByText('Example form'));
    expect(screen.queryByText('ex/form')).not.toBeInTheDocument();
    const printed = screen.getByText('Printed figure').closest('div');
    expect(printed).toHaveTextContent(`${strings.advanced.reference} 65`);
    const step = screen.getByText('Engine step').closest('div');
    expect(step).not.toHaveTextContent(strings.advanced.reference);
  });

  it('shows nothing when there are no forms', () => {
    const { container } = render(<AdvancedView groups={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a line detail only after its ? button is pressed, by mouse or keyboard', async () => {
    const detail = 'lesser of a 81200.00 and b 70000.00 = 70000.00';
    render(
      <AdvancedView
        groups={[
          {
            form: 'ex/form',
            name: 'Example form',
            lines: [
              {
                label: 'Line 2',
                reference: '2',
                amount: '70000.00',
                detail,
                named: false,
                unit: null,
              },
            ],
          },
        ]}
      />,
    );
    await open();
    await userEvent.click(screen.getByText('Example form'));
    expect(screen.queryByText(strings.advanced.reference)).toBeNull();
    const button = screen.getByRole('button', {
      name: strings.breakdown.helpButton('Line 2'),
    });
    expect(screen.getByText(detail)).not.toBeVisible();
    await userEvent.click(button);
    expect(screen.getByText(detail)).toBeVisible();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText(detail)).not.toBeVisible();
    button.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(detail)).toBeVisible();
  });

  it('opens the detail with the Space key and gives every line a ? button', async () => {
    render(<AdvancedView groups={groups} />);
    await open();
    await userEvent.click(screen.getByText('ca/schedule_8'));
    expect(
      within(form('ca/schedule_8')).getAllByRole('button', { name: /What is/ }),
    ).toHaveLength(2);
    const button = screen.getByRole('button', {
      name: strings.breakdown.helpButton('cpp basic exemption'),
    });
    button.focus();
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps the reference badge for named lines only', async () => {
    render(
      <AdvancedView
        groups={[
          {
            form: 'ex/form',
            name: 'Example form',
            lines: [
              {
                label: 'Printed',
                reference: '65',
                amount: '1',
                detail: 'd',
                named: true,
                unit: null,
              },
              {
                label: 'Line 66',
                reference: '66',
                amount: '2',
                detail: 'd',
                named: false,
                unit: null,
              },
            ],
          },
        ]}
      />,
    );
    await open();
    await userEvent.click(screen.getByText('Example form'));
    expect(
      screen.getAllByText(strings.advanced.reference, { exact: false }),
    ).toHaveLength(1);
  });

  describe('units', () => {
    const unitGroups: AdvancedGroup[] = [
      {
        form: 'ex/form',
        name: 'Example form',
        lines: [
          {
            label: 'EI premiums',
            reference: '88',
            amount: '1077.48',
            detail: 'd',
            named: true,
            unit: cad,
          },
          {
            label: 'Months of CPP',
            reference: '9',
            amount: '12',
            detail: 'd',
            named: true,
            unit: months,
          },
          {
            label: 'One month',
            reference: '10',
            amount: '1',
            detail: 'd',
            named: true,
            unit: months,
          },
          {
            label: 'Owed back',
            reference: '11',
            amount: '-1234.50',
            detail: 'd',
            named: true,
            unit: cad,
          },
          {
            label: 'Ontario rate',
            reference: '12',
            amount: '0.0915',
            detail: 'd',
            named: true,
            unit: null,
          },
        ],
      },
    ];

    async function openForm() {
      render(<AdvancedView groups={unitGroups} />);
      await open();
      await userEvent.click(screen.getByText('Example form'));
    }

    it('shows the unit before the grouped amount of a line that has one', async () => {
      await openForm();
      expect(screen.getByText('CA$1,077.48')).toBeVisible();
      expect(screen.getByText('-CA$1,234.50')).toBeVisible();
    });

    it('shows a unit that goes after the amount, singular only for 1', async () => {
      await openForm();
      expect(screen.getByText('12 months')).toBeVisible();
      expect(screen.getByText('1 month')).toBeVisible();
    });

    it('shows a bare amount for a line with no unit', async () => {
      await openForm();
      expect(screen.getByText('0.0915')).toBeVisible();
    });
  });
});
