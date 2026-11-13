import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('renders nothing when the index has no groups', () => {
    const { container } = show({ groups: [] });
    expect(container).toBeEmptyDOMElement();
  });

  describe('disclosure', () => {
    const details = (container: HTMLElement) =>
      container.querySelector('details') as HTMLDetailsElement;

    it('wraps the list in one details element that is closed on load', () => {
      const { container } = show(ontarioIndex);
      expect(container.querySelectorAll('details')).toHaveLength(1);
      expect(details(container).open).toBe(false);
      expect(details(container)).not.toHaveAttribute('open');
    });

    it('has a summary, as the first child of details, that names the list', () => {
      const { container } = show(ontarioIndex);
      const summary = details(container).querySelector('summary');
      expect(summary).not.toBeNull();
      expect(details(container).firstElementChild).toBe(summary);
      expect(summary?.textContent).toContain(strings.salaryIndex.label);
    });

    it('keeps all 25 links as anchors inside the details, not added by script', () => {
      const { container } = show(ontarioIndex);
      const anchors = [...details(container).querySelectorAll('a')];
      expect(anchors).toHaveLength(25);
      expect(anchors.map((a) => a.getAttribute('href'))).toEqual(
        ontarioIndex.groups[0]?.pages.map((p) => p.href),
      );
      expect(container.querySelectorAll('a')).toHaveLength(25);
    });

    it('does not hide the links with hidden, aria-hidden or inline display', () => {
      const { container } = show(ontarioIndex);
      expect(
        container.querySelector('[hidden], [aria-hidden="true"]'),
      ).toBeNull();
      expect(container.querySelector('[style*="display"]')).toBeNull();
    });

    it('opens and closes from the summary with the mouse', async () => {
      const user = userEvent.setup();
      const { container } = show(ontarioIndex);
      const summary = screen.getByText(strings.salaryIndex.label, {
        selector: 'summary, summary *',
      });
      await user.click(summary);
      expect(details(container).open).toBe(true);
      await user.click(summary);
      expect(details(container).open).toBe(false);
    });

    it('puts the summary first in the tab order, so the keyboard reaches it (the browser toggles it on Enter)', async () => {
      const user = userEvent.setup();
      show(ontarioIndex);
      await user.tab();
      expect(document.activeElement?.tagName).toBe('SUMMARY');
    });

    it('keeps a closed state for two provinces too: still one details, all 28 links', () => {
      const { container } = show(twoProvinceIndex);
      expect(container.querySelectorAll('details')).toHaveLength(1);
      expect(details(container).open).toBe(false);
      expect(details(container).querySelectorAll('a')).toHaveLength(28);
    });
  });
});
