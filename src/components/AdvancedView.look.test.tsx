import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedView } from './AdvancedView';
import { strings } from '../strings';

const groups = [
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
    ],
  },
];

function summary() {
  const el = screen
    .getByRole('group', { name: strings.advanced.toggle })
    .querySelector(':scope > summary');
  if (!el) throw new Error('no summary');
  return el;
}

// The row is drawn like the checkbox it replaced (#124 made it a caret); the
// look is checked in a browser, jsdom has no layout. These pin the behaviour.
describe('AdvancedView checkbox row', () => {
  it('uses the native summary: no fake input, no hand-made aria state', () => {
    render(<AdvancedView groups={groups} />);
    const el = summary();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(el.querySelector('input')).toBeNull();
    expect(el).not.toHaveAttribute('aria-expanded');
    expect(el).not.toHaveAttribute('role');
    expect(el.closest('details')).not.toHaveAttribute('open');
  });

  it('keeps the label text in the summary', () => {
    render(<AdvancedView groups={groups} />);
    expect(summary()).toHaveTextContent(strings.advanced.toggle);
  });

  it('is first in the tab order and Enter and Space are left to the browser to toggle it', async () => {
    render(<AdvancedView groups={groups} />);
    await userEvent.tab();
    expect(summary()).toHaveFocus();
    const prevented: boolean[] = [];
    summary().addEventListener('keydown', (event) => {
      prevented.push(event.defaultPrevented);
    });
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(prevented).toEqual([false, false]);
    // jsdom does not run the browser's key-to-click step; a click toggles it.
    await userEvent.click(summary());
    expect(summary().closest('details')).toHaveAttribute('open');
  });
});
