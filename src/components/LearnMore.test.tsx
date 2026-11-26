import { render, screen } from '@testing-library/react';
import { strings } from '../strings';
import { LearnMore } from './LearnMore';

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

  it('shows no rates line when there is no rates page', () => {
    render(<LearnMore links={links} rates={null} />);
    expect(screen.queryByText(strings.ratesLink.salaryLead)).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
