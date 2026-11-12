import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnswerCard } from './AnswerCard';
import { strings } from '../strings';
import { cad } from '../test/units';

const base = {
  salary: '70000.00',
  totalDeductions: '16531.32',
  takeHome: '53468.68',
  place: 'Ontario',
  year: 2025,
  payPeriod: 'annually' as const,
  onPayPeriodChange: () => {},
  unit: cad,
};

describe('AnswerCard', () => {
  it('shows take-home, salary and amount taken off', () => {
    render(<AnswerCard {...base} />);
    expect(
      screen.getByRole('region', { name: strings.answer.heading }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('CA$53,468.68')).toHaveLength(2);
    expect(screen.getByText('CA$70,000.00')).toBeInTheDocument();
    expect(screen.getByText('CA$16,531.32')).toBeInTheDocument();
    expect(screen.getByText(strings.answer.label.annually)).toBeInTheDocument();
    expect(
      screen.getByText('out of CA$70,000.00, Ontario, 2025'),
    ).toBeInTheDocument();
  });

  it('words the card as an estimate, never as checked', () => {
    render(<AnswerCard {...base} />);
    expect(screen.getByText(strings.answer.estimateNote)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/CRA|checked/i);
  });

  it('shows an amount it cannot divide as sent instead of failing', () => {
    render(<AnswerCard {...base} payPeriod="monthly" takeHome="53468.555" />);
    expect(screen.getAllByText('53468.555')[0]).toBeInTheDocument();
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
    expect(screen.getAllByText('CA$1,028.24')).toHaveLength(2);
    expect(screen.getByText('CA$1,346.15')).toBeInTheDocument();
    expect(
      screen.getByText('out of CA$1,346.15, Ontario, 2025'),
    ).toBeInTheDocument();
    expect(screen.getByText('CA$317.91')).toBeInTheDocument();
    expect(screen.getByText(strings.answer.label.weekly)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('radio', { name: strings.payPeriod.monthly }),
    );
    expect(changed).toEqual(['monthly']);
  });

  it.each([
    ['annually', 'CA$70,000.00'],
    ['monthly', 'CA$5,833.33'],
    ['biweekly', 'CA$2,692.31'],
    ['weekly', 'CA$1,346.15'],
  ] as const)('shows the %s gross in the "out of" line', (payPeriod, gross) => {
    render(<AnswerCard {...base} payPeriod={payPeriod} />);
    expect(
      screen.getByText(`out of ${gross}, Ontario, 2025`),
    ).toBeInTheDocument();
  });

  it('shows take-home with the unit before it, no space, a minus first', () => {
    render(<AnswerCard {...base} />);
    expect(screen.getAllByText('CA$53,468.68')).toHaveLength(2);
    expect(document.body.textContent).not.toMatch(/(?<!CA)\$\d/);
    render(<AnswerCard {...base} takeHome="-53468.68" />);
    expect(screen.getAllByText('-CA$53,468.68')).toHaveLength(2);
  });

  it('keeps the unit when the pay period changes', () => {
    render(<AnswerCard {...base} payPeriod="monthly" />);
    expect(screen.getAllByText('CA$4,455.72')).toHaveLength(2);
    expect(screen.getByText('CA$5,833.33')).toBeInTheDocument();
    expect(screen.getByText('CA$1,377.61')).toBeInTheDocument();
  });

  it('shows the fallback unit when the response carried none', () => {
    render(<AnswerCard {...base} unit={strings.fallbackUnit} />);
    expect(screen.getAllByText('$53,468.68')).toHaveLength(2);
    expect(screen.getByText('$70,000.00')).toBeInTheDocument();
    expect(screen.getByText('$16,531.32')).toBeInTheDocument();
  });
});
