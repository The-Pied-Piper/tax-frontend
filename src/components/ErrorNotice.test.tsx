import { render, screen } from '@testing-library/react';
import { ErrorNotice } from './ErrorNotice';

describe('ErrorNotice', () => {
  it('announces the message as an alert', () => {
    render(<ErrorNotice message="Could not reach the service." />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not reach the service.',
    );
  });
});
