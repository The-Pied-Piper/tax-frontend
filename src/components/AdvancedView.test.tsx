import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdvancedGroup } from '../adapters';
import { AdvancedView } from './AdvancedView';
import { strings } from '../strings';
import { cad, months } from '../test/units';
import { caOnAdapter } from '../adapters/ca-on';
import { compute70000 } from '../test/syntheticPages';

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
  return screen.getByRole('group', { name: strings.advanced.toggle });
}

function summary() {
  const el = section().querySelector(':scope > summary');
  if (!el) throw new Error('no summary');
  return el;
}

function open() {
  return userEvent.click(screen.getByText(strings.advanced.toggle));
}

function form(name: string) {
  return screen.getByRole('group', { name: new RegExp(name) });
}

describe('AdvancedView', () => {
  it('is a real details fold, closed by default, with every form already in the DOM', () => {
    render(<AdvancedView groups={groups} />);
    const fold = section();
    expect(fold.tagName).toBe('DETAILS');
    expect(fold).not.toHaveAttribute('open');
    expect(fold.querySelector('summary')).toHaveTextContent(
      strings.advanced.toggle,
    );
    expect(within(fold).getByText(strings.advanced.note)).toBeInTheDocument();
    expect(within(fold).getByText('ca/schedule_8')).toBeInTheDocument();
    expect(within(fold).getByText('cpp basic exemption')).toBeInTheDocument();
    expect(within(fold).getByText('ca/schedule_8')).not.toBeVisible();
  });

  it('has no checkbox and hides nothing with display:none or the hidden attribute', () => {
    const { container } = render(<AdvancedView groups={groups} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    // (A line's own help bubble keeps the hidden attribute until its ? is pressed.)
    for (const el of container.querySelectorAll('summary, dl, dt, dd')) {
      expect(el.closest('[hidden], [style]')).toBeNull();
    }
  });

  it('puts the summary first in the tab order, so the keyboard can open it', async () => {
    render(<AdvancedView groups={groups} />);
    await userEvent.tab();
    expect(section().querySelector('summary')).toHaveFocus();
  });

  it('shows the yearly note once opened and hides it again when closed', async () => {
    render(<AdvancedView groups={groups} />);
    expect(screen.getByText(strings.advanced.note)).not.toBeVisible();
    await open();
    expect(screen.getByText(strings.advanced.note)).toBeVisible();
    await open();
    expect(screen.getByText('ca/schedule_8')).not.toBeVisible();
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
      expect(screen.getByText('$1,077.48')).toBeVisible();
      expect(screen.getByText('-$1,234.50')).toBeVisible();
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

  // The row is drawn like the checkbox it replaced (#124 made it a caret); the
  // look is checked in a browser, jsdom has no layout. These pin the behaviour.
  describe('checkbox row', () => {
    it('uses the native summary: no fake input, no hand-made aria state', () => {
      render(<AdvancedView groups={groups} />);
      const el = summary();
      expect(el.querySelector('input')).toBeNull();
      expect(el).not.toHaveAttribute('aria-expanded');
      expect(el).not.toHaveAttribute('role');
    });

    it('keeps the label text in the summary', () => {
      render(<AdvancedView groups={groups} />);
      expect(summary()).toHaveTextContent(strings.advanced.toggle);
    });

    it('leaves Enter and Space to the browser to toggle it, and a click toggles it', async () => {
      render(<AdvancedView groups={groups} />);
      await userEvent.tab();
      const prevented: boolean[] = [];
      summary().addEventListener('keydown', (event) => {
        prevented.push(event.defaultPrevented);
      });
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      expect(prevented).toEqual([false, false]);
      // jsdom does not run the browser's key-to-click step; a click toggles it.
      await userEvent.click(summary());
      expect(section()).toHaveAttribute('open');
    });
  });
});

describe('AdvancedView form link', () => {
  const real = caOnAdapter.adapt(compute70000).advanced;
  const on428 = real.find((g) => g.form === 'ca-on/on428');
  const unmapped = real.find((g) => g.form === 'ca-on/return');
  const t2204 = real.find((g) => g.form === 'ca/t2204');

  function linkOf(name: string) {
    return within(form(name)).queryByRole('link', {
      name: /What is this form\?/,
    });
  }

  function pick(group: AdvancedGroup | undefined): AdvancedGroup {
    if (!group) throw new Error('missing fixture group');
    return group;
  }

  it('links a mapped, published form to its page', () => {
    const group = pick(on428);
    render(<AdvancedView groups={[group]} />);
    const link = linkOf(group.name);
    expect(link).toHaveAttribute('href', '/forms/on428/');
    expect(link).toHaveTextContent('What is this form?');
  });

  it('has no link for a form with no map entry', () => {
    const group = pick(unmapped);
    render(<AdvancedView groups={[group]} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('has no link for a mapped form whose page is not published', () => {
    const group = pick(t2204);
    render(<AdvancedView groups={[group]} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('is a plain link in the heading, outside the line list, named for the form', () => {
    const group = pick(on428);
    render(<AdvancedView groups={[group]} />);
    const link = linkOf(group.name);
    expect(link?.tagName).toBe('A');
    expect(link?.closest('button')).toBeNull();
    expect(link?.closest('summary')).not.toBeNull();
    expect(link?.closest('dl')).toBeNull();
    expect(link).toHaveAccessibleName(new RegExp(group.name));
  });

  it('does not open or close the form when clicked', async () => {
    const group = pick(on428);
    render(<AdvancedView groups={[group]} />);
    await open();
    const details = form(group.name);
    const link = linkOf(group.name);
    if (!link) throw new Error('no link');
    link.addEventListener('click', (event) => {
      event.preventDefault();
    });
    await userEvent.click(link);
    expect(details).not.toHaveAttribute('open');
  });

  it('can be reached with the keyboard', async () => {
    const group = pick(on428);
    render(<AdvancedView groups={[group]} />);
    await open();
    const link = linkOf(group.name);
    await userEvent.tab();
    await userEvent.tab();
    expect(link).toHaveFocus();
  });
});
