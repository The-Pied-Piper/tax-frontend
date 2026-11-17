import {
  syntheticOntarioPages,
  syntheticTakeHomes,
} from '../../src/test/syntheticPages';
import { OTHERS_LIMIT, salaryLinks } from './links';

// All 25 Ontario steps, as the strings the generator uses for a salary.
const all = syntheticOntarioPages().map((p) => p.salary);
const takeHomes = syntheticTakeHomes();
const th = (salary: string) => takeHomes[salary] as string;
const salaries = (links: { salary: string }[]) => links.map((l) => l.salary);

/** A copy of the record without one salary's entry. */
const without = (record: Record<string, string>, salary: string) =>
  Object.fromEntries(Object.entries(record).filter(([key]) => key !== salary));

describe('salaryLinks(slug, salaries, salary, takeHomes)', () => {
  it('links the $70,000 page to $65,000 and $75,000 and to the calculator', () => {
    const links = salaryLinks('ca-on', all, '70000', takeHomes);
    expect(links.calculator).toBe('/');
    expect(links.previous).toEqual({
      salary: '65000',
      href: '/ca-on/65000/',
      takeHome: th('65000'),
    });
    expect(links.next).toEqual({
      salary: '75000',
      href: '/ca-on/75000/',
      takeHome: th('75000'),
    });
  });

  it('has no previous link on the first page and no next link on the last', () => {
    const first = salaryLinks('ca-on', all, '30000', takeHomes);
    expect(first.previous).toBeNull();
    expect(first.next).toEqual({
      salary: '35000',
      href: '/ca-on/35000/',
      takeHome: th('35000'),
    });
    const last = salaryLinks('ca-on', all, '150000', takeHomes);
    expect(last.next).toBeNull();
    expect(last.previous).toEqual({
      salary: '145000',
      href: '/ca-on/145000/',
      takeHome: th('145000'),
    });
  });

  it('lists the other pages nearest first, capped, without the page or its neighbours', () => {
    const { others } = salaryLinks('ca-on', all, '70000', takeHomes);
    expect(OTHERS_LIMIT).toBe(6);
    expect(salaries(others)).toEqual([
      '60000',
      '80000',
      '55000',
      '85000',
      '50000',
      '90000',
    ]);
    expect(others[0]?.href).toBe('/ca-on/60000/');
  });

  it('gives an edge page the nearest pages on its one side, after the neighbour', () => {
    expect(
      salaryLinks('ca-on', all, '30000', takeHomes).others.map((l) => l.salary),
    ).toEqual(['40000', '45000', '50000', '55000', '60000', '65000']);
    expect(
      salaryLinks('ca-on', all, '150000', takeHomes).others.map(
        (l) => l.salary,
      ),
    ).toEqual(['140000', '135000', '130000', '125000', '120000', '115000']);
  });

  it('never repeats a link between previous, next and others', () => {
    const links = salaryLinks('ca-on', all, '70000', takeHomes);
    const hrefs = [
      links.previous?.href,
      links.next?.href,
      ...links.others.map((l) => l.href),
      '/ca-on/70000/',
    ];
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('links only to the salaries it is given', () => {
    const links = salaryLinks(
      'ca-on',
      ['30000', '40000', '50000'],
      '40000',
      takeHomes,
    );
    expect(links.previous?.salary).toBe('30000');
    expect(links.next?.salary).toBe('50000');
    expect(links.others).toEqual([]);
  });

  it('has nothing to link to when the page is the only one', () => {
    expect(salaryLinks('ca-on', ['70000'], '70000', takeHomes)).toEqual({
      calculator: '/',
      previous: null,
      next: null,
      others: [],
    });
  });

  it('uses the slug it is given, so a second province needs nothing else', () => {
    const links = salaryLinks('ca-xx', ['10000', '15000', '20000'], '15000', {
      '10000': '1.00',
      '15000': '2.00',
      '20000': '3.00',
    });
    expect(links.previous?.href).toBe('/ca-xx/10000/');
    expect(links.next?.href).toBe('/ca-xx/20000/');
  });

  it('gives previous, next and every other link the take-home of the page it points to', () => {
    const links = salaryLinks('ca-on', all, '70000', takeHomes);
    expect(links.previous?.takeHome).toBe(th('65000'));
    expect(links.next?.takeHome).toBe(th('75000'));
    expect(links.others).toHaveLength(OTHERS_LIMIT);
    for (const other of links.others) {
      expect(other.takeHome, other.salary).toBe(th(other.salary));
    }
    // Distinct pages, distinct figures: nothing is copied from the current page.
    expect(new Set(links.others.map((l) => l.takeHome)).size).toBe(
      OTHERS_LIMIT,
    );
    expect(links.previous?.takeHome).not.toBe(th('70000'));
  });

  it('carries the figure as the string it was given, without parsing or rounding it', () => {
    const links = salaryLinks('ca-on', ['10000', '20000', '30000'], '20000', {
      '10000': '8123.4',
      '20000': '1e3',
      '30000': '0030000.250',
    });
    expect(links.previous?.takeHome).toBe('8123.4');
    expect(links.next?.takeHome).toBe('0030000.250');
  });

  it('throws an error naming the salary when a linked page has no take-home', () => {
    const withoutPrevious = without(takeHomes, '65000');
    expect(() => salaryLinks('ca-on', all, '70000', withoutPrevious)).toThrow(
      /65000/,
    );
    const withoutOther = without(takeHomes, '60000');
    expect(() => salaryLinks('ca-on', all, '70000', withoutOther)).toThrow(
      /60000/,
    );
  });

  it('does not need the take-home of the page itself', () => {
    const withoutSelf = without(takeHomes, '70000');
    expect(() => salaryLinks('ca-on', all, '70000', withoutSelf)).not.toThrow();
  });
});
