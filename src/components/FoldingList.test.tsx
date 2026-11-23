import { cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { FoldingList, type FoldingItem } from './FoldingList';
import { strings } from '../strings';

/** The limits the list folds at: over 1,000 characters, the first 3 items stay. */
const FOLD_ABOVE_CHARACTERS = 1000;
const FOLD_SHOWN_ITEMS = 3;

/** `count` items that share `total` characters between them. */
function items(count: number, total: number): FoldingItem[] {
  return Array.from({ length: count }, (_, at) => ({
    key: `item-${String(at + 1)}`,
    length: Math.floor(total / count),
    content: `Item ${String(at + 1)}`,
  }));
}

function draw(list: FoldingItem[]) {
  return render(<FoldingList items={list} listClassName="notes" />);
}

describe('FoldingList', () => {
  it('draws a list at or under the limit whole, with no link', () => {
    const { container } = draw(items(9, FOLD_ABOVE_CHARACTERS));
    expect(container.querySelectorAll('li')).toHaveLength(9);
    expect(container.querySelector('details')).toBeNull();
    expect(screen.queryByText(strings.fold.more)).toBeNull();
  });

  it('draws a long list of few items whole', () => {
    const { container } = draw(items(FOLD_SHOWN_ITEMS + 1, 5000));
    expect(container.querySelector('details')).toBeNull();
  });

  it('shows the first items of a long list and folds the rest behind "See more"', () => {
    const { container } = draw(items(9, FOLD_ABOVE_CHARACTERS * 2));
    const lists = container.querySelectorAll('ul');
    expect(lists[0]?.querySelectorAll('li')).toHaveLength(FOLD_SHOWN_ITEMS);
    const fold = container.querySelector('details');
    expect(fold).not.toBeNull();
    expect(fold?.hasAttribute('open')).toBe(false);
    expect(fold?.querySelectorAll('li')).toHaveLength(9 - FOLD_SHOWN_ITEMS);
    expect(screen.getByText('See more')).toBeInTheDocument();
    expect(container.textContent).toContain('Item 9');
  });

  it('keeps every item, in order', () => {
    const { container } = draw(items(7, 3000));
    const words = [...container.querySelectorAll('li')].map(
      (li) => li.textContent,
    );
    expect(words).toEqual(items(7, 3000).map((item) => item.content));
  });

  it('puts the folded items in the pre-built markup, so it needs no script', () => {
    const html = renderToString(
      <FoldingList items={items(8, 2000)} listClassName="notes" />,
    );
    expect(html).toContain('<details');
    expect(html).toContain('Item 8');
  });

  it('folds at over 1,000 characters, not at 1,000', () => {
    const sized = (total: number): FoldingItem[] =>
      items(5, 0).map((item, at) => ({
        ...item,
        length: at === 0 ? total : 0,
      }));
    expect(draw(sized(1000)).container.querySelector('details')).toBeNull();
    cleanup();
    expect(draw(sized(1001)).container.querySelector('details')).not.toBeNull();
  });

  it('folds five items, leaving two behind the link', () => {
    const { container } = draw(items(5, 3000));
    expect(container.querySelectorAll('details li')).toHaveLength(2);
  });

  it('labels the link for both states without running together', () => {
    const { container } = draw(items(5, 3000));
    expect(container.querySelector('summary')?.textContent).toBe(
      'See more See less',
    );
  });
});
