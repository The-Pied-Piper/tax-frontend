import { render, screen, within } from '@testing-library/react';
import { strings } from '../strings';
import { Breadcrumb } from './Breadcrumb';

const steps = [
  { label: 'Home', href: '/' },
  { label: 'Ontario', href: '/ca-on/' },
];

function show() {
  render(<Breadcrumb steps={steps} current="$70,000" />);
  return screen.getByRole('navigation', { name: strings.siteNav.breadcrumb });
}

describe('Breadcrumb', () => {
  it('is one nav landmark named Breadcrumb', () => {
    show();
    expect(
      screen.getAllByRole('navigation', { name: 'Breadcrumb' }),
    ).toHaveLength(1);
    expect(strings.siteNav.breadcrumb).toBe('Breadcrumb');
  });

  it('holds an ordered list with one item per step and the current page', () => {
    const nav = show();
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('links each step in the order given, with its address', () => {
    const nav = show();
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['Home', '/'],
      ['Ontario', '/ca-on/'],
    ]);
  });

  it('ends with the current page as plain text marked aria-current="page"', () => {
    const nav = show();
    const items = within(nav).getAllByRole('listitem');
    const last = items[items.length - 1];
    expect(last).toHaveTextContent('$70,000');
    expect(last).toHaveAttribute('aria-current', 'page');
    expect(within(last as HTMLElement).queryByRole('link')).toBeNull();
    expect(nav.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('is only the current page when there are no steps', () => {
    render(<Breadcrumb steps={[]} current="Here" />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(nav).queryAllByRole('link')).toHaveLength(0);
    expect(within(nav).getByText('Here')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
