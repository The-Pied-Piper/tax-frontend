import { render, screen } from '@testing-library/react';
import { StarLink } from './StarLink';
import { strings } from '../strings';

describe('StarLink', () => {
  it('links to the engine repository in a new tab', () => {
    render(<StarLink />);
    const link = screen.getByRole('link', {
      name: 'Star the engine on GitHub',
    });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/The-Pied-Piper/tax-engine',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('says why a star helps', () => {
    render(<StarLink />);
    expect(screen.getByText(strings.starNote)).toBeInTheDocument();
  });
});
