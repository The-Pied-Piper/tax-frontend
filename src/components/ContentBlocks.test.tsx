import { render, screen, within } from '@testing-library/react';
import { ContentBlocks } from './ContentBlocks';
import type { ContentBlock } from '../state/contentPages';
import { blocksSpec } from '../test/contentPageData';

const blocks = blocksSpec.sections[0]?.blocks ?? [];

describe('ContentBlocks', () => {
  it('draws a subheading as an h3', () => {
    render(<ContentBlocks blocks={blocks} />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'A smaller heading' }),
    ).toBeInTheDocument();
  });

  it('draws a list item with an address as a link, and one without as plain text', () => {
    render(<ContentBlocks blocks={blocks} />);
    expect(screen.getByRole('link', { name: 'Linked item' })).toHaveAttribute(
      'href',
      '/plain-page/',
    );
    expect(
      screen.queryByRole('link', { name: 'Item with no page yet' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Item with no page yet')).toBeInTheDocument();
    expect(screen.getByText('Its line.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2 + 2 + 1);
  });

  it('draws each links block as its own named nav of plain links', () => {
    render(<ContentBlocks blocks={blocks} />);
    const grid = screen.getByRole('navigation', { name: 'Some pages' });
    expect(
      within(grid)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual([
      ['$30,000', '/sample-hub/30000/'],
      ['$35,000', '/sample-hub/35000/'],
    ]);
    const row = screen.getByRole('navigation', { name: 'More pages' });
    expect(
      within(row).getByRole('link', { name: 'Calculator' }),
    ).toHaveAttribute('href', '/');
  });

  it('draws a table with a caption, a header row and one cell per column', () => {
    render(<ContentBlocks blocks={blocks} />);
    const table = screen.getByRole('table', { name: 'A small table' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((h) => h.textContent),
    ).toEqual(['Name', 'Amount']);
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(
      within(rows[2] as HTMLElement)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Second', '$2']);
  });

  it('shows text that looks like markup as text, never as elements', () => {
    const hostile: ContentBlock[] = [
      { kind: 'subheading', text: '<b>bold</b>' },
      {
        kind: 'list',
        items: [{ label: '<i>x</i>', text: '<script>1</script>' }],
      },
    ];
    const { container } = render(<ContentBlocks blocks={hostile} />);
    expect(container.querySelector('b, i, script')).toBeNull();
    expect(screen.getByText('<b>bold</b>')).toBeInTheDocument();
    expect(screen.getByText('<script>1</script>')).toBeInTheDocument();
  });

  it('draws nothing for no blocks', () => {
    const { container } = render(<ContentBlocks blocks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
