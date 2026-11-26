import { render, screen } from '@testing-library/react';
import { strings } from '../strings';
import fixture from '../api/fixtures/compute-on-2026-70000.json';
import { LearnMore } from './LearnMore';

const saved = fixture as { unit: import('../money/format').MoneyUnit };
const links = [{ label: 'Ontario', href: '/ca-on/' }];

describe('LearnMore rates line', () => {
  it('shows one line with a link to the rates page, with the salary in its address', () => {
    render(
      <LearnMore
        links={links}
        rates={{
          label: 'Ontario tax rates by salary',
          href: '/ca-on/tax-rates/?salary=70000',
        }}
      />,
    );
    const link = screen.getByRole('link', {
      name: 'Ontario tax rates by salary',
    });
    expect(link).toHaveAttribute('href', '/ca-on/tax-rates/?salary=70000');
    expect(link.closest('p')).toHaveTextContent(
      `${strings.ratesLink.salaryLead} Ontario tax rates by salary.`,
    );
  });

  it('shows one line with a link to the compare page at this salary', () => {
    render(
      <LearnMore
        links={links}
        rates={null}
        unit={saved.unit}
        compare={{
          label: 'Take-home pay by province, 2026',
          href: '/compare-provinces/?salary=70000',
        }}
      />,
    );
    const link = screen.getByRole('link', {
      name: 'Take-home pay by province, 2026',
    });
    expect(link).toHaveAttribute('href', '/compare-provinces/?salary=70000');
    expect(link.closest('p')).toHaveTextContent(
      'See how a CA$70,000 salary compares across the provinces: Take-home pay by province, 2026.',
    );
  });

  it('shows no rates line when there is no rates page', () => {
    render(<LearnMore links={links} rates={null} />);
    expect(screen.queryByText(strings.ratesLink.salaryLead)).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
