import { pickDefaultYear } from './defaultYear';

const listed = (...years: number[]) => years.map((year) => ({ year }));

describe('pickDefaultYear', () => {
  it('takes the current year when it is listed', () => {
    expect(pickDefaultYear(listed(2025, 2026), 2026)).toBe(2026);
    expect(pickDefaultYear(listed(2025, 2026), 2025)).toBe(2025);
  });

  it('does not depend on the order of the list', () => {
    expect(pickDefaultYear(listed(2026, 2025), 2026)).toBe(2026);
  });

  it('takes the nearest listed year when the current year is after them all', () => {
    expect(pickDefaultYear(listed(2025, 2026), 2027)).toBe(2026);
    expect(pickDefaultYear(listed(2025, 2026), 2031)).toBe(2026);
  });

  it('takes the nearest listed year when the current year is before them all', () => {
    expect(pickDefaultYear(listed(2025, 2026), 2024)).toBe(2025);
  });

  it('takes the nearer year when the current year falls between two', () => {
    expect(pickDefaultYear(listed(2024, 2025, 2028), 2027)).toBe(2028);
    expect(pickDefaultYear(listed(2024, 2025, 2028), 2026)).toBe(2025);
  });

  it('gives a tie to the earlier year', () => {
    expect(pickDefaultYear(listed(2024, 2026), 2025)).toBe(2024);
    expect(pickDefaultYear(listed(2026, 2024), 2025)).toBe(2024);
  });

  it('takes the only year of a single-year place', () => {
    expect(pickDefaultYear(listed(2025), 2026)).toBe(2025);
    expect(pickDefaultYear(listed(2025), 2025)).toBe(2025);
  });

  it('is null when the place lists no year', () => {
    expect(pickDefaultYear([], 2026)).toBeNull();
  });
});
