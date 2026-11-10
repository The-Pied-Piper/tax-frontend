import { render, screen } from '@testing-library/react';
import { StarLink } from './StarLink';
import { strings } from './strings';

describe('StarLink', () => {
  it('links to the engine repository in a new tab', () => {
    render(<StarLink />);
    const link = screen.getByRole('link', { name: strings.starLink });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/The-Pied-Piper/tax-engine',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});
