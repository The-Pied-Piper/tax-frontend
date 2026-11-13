import { render, screen, within } from '@testing-library/react';
import { displayMoney } from '../money/format';
import { strings } from '../strings';
import {
  indexUnit,
  ontarioIndex,
  twoProvinceIndex,
} from '../test/salaryIndexData';
import type { SalaryIndex } from '../state/salaryIndex';
import { SalaryIndexNav } from './SalaryIndexNav';

const money = (salary: string) => displayMoney(salary, 'annually', indexUnit);

function show(index: SalaryIndex) {
  return render(<SalaryIndexNav index={index} />);
}

describe('SalaryIndexNav', () => {
  it('is one nav landmark named Popular salaries', () => {
    show(ontarioIndex);
    expect(strings.salaryIndex.label).toBe('Popular salaries');
    expect(
      screen.getAllByRole('navigation', { name: 'Popular salaries' }),
    ).toHaveLength(1);
  });

  it('lists every page of a province as a plain link, lowest first, under its name', () => {
    show(ontarioIndex);
    const list = screen.getByRole('list', { name: 'Ontario' });
    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(25);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      ontarioIndex.groups[0]?.pages.map((p) => p.href),
    );
    expect(links[0]).toHaveAttribute('href', '/ca-on/30000/');
    expect(links[24]).toHaveAttribute('href', '/ca-on/150000/');
  });

  it('names each link by the salary and the province, with no claim', () => {
    show(ontarioIndex);
    const link = screen.getByRole('link', {
      name: strings.salaryIndex.link(money('75000'), 'Ontario'),
    });
    expect(link).toHaveAttribute('href', '/ca-on/75000/');
    expect(link).toHaveTextContent(`${money('75000')} in Ontario`);
  });

  it('groups provinces by name, one heading and one list each, in the index order', () => {
    show(twoProvinceIndex);
    const nav = screen.getByRole('navigation', { name: 'Popular salaries' });
    expect(
      within(nav)
        .getAllByRole('heading')
        .map((h) => h.textContent),
    ).toEqual(['Ontario', 'Xland']);
    const xland = within(nav).getByRole('list', { name: 'Xland' });
    expect(
      within(xland)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/ca-xx/10000/', '/ca-xx/15000/', '/ca-xx/20000/']);
  });

  it('uses plain links: every link has an href, none opens a new tab, none is hidden', () => {
    show(twoProvinceIndex);
    const nav = screen.getByRole('navigation');
    expect(nav.closest('[hidden], [aria-hidden="true"]')).toBeNull();
    for (const a of screen.getAllByRole('link')) {
      expect(a).toHaveAttribute('href');
      expect(a).not.toHaveAttribute('target');
      expect(a).not.toHaveAttribute('aria-hidden');
    }
  });

  it('is a disclosure closed on load, with every link already in the markup', () => {
    const { container } = show(ontarioIndex);
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
    expect(details?.querySelector('summary')).toHaveTextContent(
      strings.salaryIndex.label,
    );
    expect(details?.querySelectorAll('a[href]')).toHaveLength(25);
  });

  it('renders nothing when the index has no groups', () => {
    const { container } = show({ groups: [] });
    expect(container).toBeEmptyDOMElement();
  });
});
