import { syntheticOntarioPages } from '../../src/test/syntheticPages';
import { OTHERS_LIMIT, salaryLinks } from './links';

// All 25 Ontario steps, as the strings the generator uses for a salary.
const all = syntheticOntarioPages().map((p) => p.salary);
const salaries = (links: { salary: string }[]) => links.map((l) => l.salary);

describe('salaryLinks(slug, salaries, salary)', () => {
  it('links the $70,000 page to $65,000 and $75,000 and to the calculator', () => {
    const links = salaryLinks('ca-on', all, '70000');
    expect(links.calculator).toBe('/');
    expect(links.previous).toEqual({ salary: '65000', href: '/ca-on/65000/' });
    expect(links.next).toEqual({ salary: '75000', href: '/ca-on/75000/' });
  });

  it('has no previous link on the first page and no next link on the last', () => {
    const first = salaryLinks('ca-on', all, '30000');
    expect(first.previous).toBeNull();
    expect(first.next).toEqual({ salary: '35000', href: '/ca-on/35000/' });
    const last = salaryLinks('ca-on', all, '150000');
    expect(last.next).toBeNull();
    expect(last.previous).toEqual({
      salary: '145000',
      href: '/ca-on/145000/',
    });
  });

  it('lists the other pages nearest first, capped, without the page or its neighbours', () => {
    const { others } = salaryLinks('ca-on', all, '70000');
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
      salaryLinks('ca-on', all, '30000').others.map((l) => l.salary),
    ).toEqual(['40000', '45000', '50000', '55000', '60000', '65000']);
    expect(
      salaryLinks('ca-on', all, '150000').others.map((l) => l.salary),
    ).toEqual(['140000', '135000', '130000', '125000', '120000', '115000']);
  });

  it('never repeats a link between previous, next and others', () => {
    const links = salaryLinks('ca-on', all, '70000');
    const hrefs = [
      links.previous?.href,
      links.next?.href,
      ...links.others.map((l) => l.href),
      '/ca-on/70000/',
    ];
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('links only to the salaries it is given', () => {
    const links = salaryLinks('ca-on', ['30000', '40000', '50000'], '40000');
    expect(links.previous?.salary).toBe('30000');
    expect(links.next?.salary).toBe('50000');
    expect(links.others).toEqual([]);
  });

  it('has nothing to link to when the page is the only one', () => {
    expect(salaryLinks('ca-on', ['70000'], '70000')).toEqual({
      calculator: '/',
      previous: null,
      next: null,
      others: [],
    });
  });

  it('uses the slug it is given, so a second province needs nothing else', () => {
    const links = salaryLinks('ca-xx', ['10000', '15000', '20000'], '15000');
    expect(links.previous?.href).toBe('/ca-xx/10000/');
    expect(links.next?.href).toBe('/ca-xx/20000/');
  });
});
