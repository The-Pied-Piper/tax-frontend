import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnswerCard } from './AnswerCard';
import { strings } from '../strings';

const base = {
  salary: '70000.00',
  totalDeductions: '16531.32',
  takeHome: '53468.68',
  provisional: false,
  payPeriod: 'annually' as const,
  onPayPeriodChange: () => {},
};

describe('AnswerCard', () => {
  it('shows take-home, salary and amount taken off', () => {
    render(<AnswerCard {...base} />);
    expect(
      screen.getByRole('region', { name: strings.answer.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText('53,468.68')).toBeInTheDocument();
    expect(screen.getByText('70,000.00')).toBeInTheDocument();
    expect(screen.getByText('16,531.32')).toBeInTheDocument();
    expect(screen.getByText(strings.answer.per.annually)).toBeInTheDocument();
  });

  it('words the card as an estimate, never as checked', () => {
    render(<AnswerCard {...base} />);
    expect(screen.getByText(strings.answer.estimateNote)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/CRA|checked/i);
  });

  it('shows an amount it cannot divide as sent instead of failing', () => {
    render(<AnswerCard {...base} payPeriod="monthly" takeHome="53468.555" />);
    expect(screen.getByText('53468.555')).toBeInTheDocument();
  });

  it('shows the notice only when provisional is true', () => {
    const { rerender } = render(<AnswerCard {...base} />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    rerender(<AnswerCard {...base} provisional />);
    expect(screen.getByRole('note')).toHaveTextContent(
      strings.answer.provisional,
    );
  });

  it('shows weekly amounts and reports a period change', async () => {
    const changed: string[] = [];
    render(
      <AnswerCard
        {...base}
        payPeriod="weekly"
        onPayPeriodChange={(p) => changed.push(p)}
      />,
    );
    expect(screen.getByText('1,028.24')).toBeInTheDocument();
    expect(screen.getByText('1,346.15')).toBeInTheDocument();
    expect(screen.getByText('317.91')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('radio', { name: strings.payPeriod.monthly }),
    );
    expect(changed).toEqual(['monthly']);
  });
});
