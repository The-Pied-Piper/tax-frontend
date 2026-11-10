import { screen } from '@testing-library/react';
import { strings } from '../strings';
import { renderApp } from './renderApp';

describe('renderApp', () => {
  it('renders the page', () => {
    renderApp();
    expect(
      screen.getByRole('heading', { name: strings.title, level: 1 }),
    ).toBeInTheDocument();
  });
});
