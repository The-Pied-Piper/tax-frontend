import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { AdvancedView } from './AdvancedView';
import { strings } from '../strings';

const css = readFileSync('src/components/AdvancedView.module.css', 'utf8');

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

// The row looks like the checkbox it replaced (#124 changed it to a caret).
// jsdom has no layout, so the look is pinned in the stylesheet source and the
// behaviour on the element.
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\>]/g, '\\$&');
  const match = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return match?.[1] ?? '';
}

describe('AdvancedView checkbox look', () => {
  it('hides the default marker on the outer summary', () => {
    expect(rule('.summary')).toMatch(/list-style:\s*none/);
    expect(css).toMatch(
      /\.summary::-webkit-details-marker\s*\{[^}]*display:\s*none/,
    );
  });

  it('draws the old 18px box with the old tokens', () => {
    const box = rule('.summary::before');
    expect(box).toMatch(/width:\s*18px/);
    expect(box).toMatch(/height:\s*18px/);
    expect(box).toMatch(/border:\s*1px solid var\(--edge\)/);
    expect(box).toMatch(/border-radius:\s*4px/);
    expect(box).toMatch(/background:\s*var\(--surface\)/);
    expect(rule('.summary')).toMatch(/gap:\s*8px/);
  });

  it('draws the check mark and shows it only when open', () => {
    const mark = rule('.summary::after');
    expect(mark).toMatch(/border-left:\s*2px solid var\(--btn-fg\)/);
    expect(mark).toMatch(/opacity:\s*0/);
    expect(rule('details[open] > .summary::after')).toMatch(/opacity:\s*1/);
    expect(rule('details[open] > .summary::before')).toMatch(
      /background:\s*var\(--accent\)/,
    );
  });

  it('has a forced-colors fallback and a focus ring on the box row', () => {
    expect(css).toMatch(/forced-colors:\s*active/);
    expect(css).toMatch(/\.summary:focus-visible/);
  });

  it('no longer carries the caret or unused checkbox rules for the outer fold', () => {
    expect(css).not.toMatch(/\.checkbox|\.toggle\b/);
  });

  it('leaves the per-form summaries with their own caret look', () => {
    expect(rule('.formSummary::before')).toMatch(/content:\s*'▸'/);
  });

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
