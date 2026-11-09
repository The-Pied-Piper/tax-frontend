import { render, screen } from '@testing-library/react';
import { App } from './App';
import { strings } from './strings';

describe('App', () => {
  it('shows the page title', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: strings.title, level: 1 }),
    ).toBeInTheDocument();
  });
});
