import { render, screen } from '@testing-library/react';
import { ProvisionalNotice } from './ProvisionalNotice';
import { strings } from '../strings';

describe('ProvisionalNotice', () => {
  it('names the year and explains the figures are not final', () => {
    render(<ProvisionalNotice year={2026} />);
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent(strings.notices.provisionalTitle(2026));
    expect(note).toHaveTextContent(strings.notices.provisionalBody(2026));
  });

  it('is worded as an estimate, never as checked', () => {
    render(<ProvisionalNotice year={2026} />);
    expect(screen.getByRole('note').textContent).not.toMatch(/CRA|checked/);
  });
});
