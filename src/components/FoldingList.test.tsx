import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import {
  FOLD_ABOVE_CHARACTERS,
  FOLD_SHOWN_ITEMS,
  FoldingList,
  type FoldingItem,
} from './FoldingList';
import { strings } from '../strings';

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
});
