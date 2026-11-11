import {
  caretFor,
  separatorsFor,
  significantBefore,
  toDisplaySalary,
  toPlainSalary,
} from './salaryInput';

const en = separatorsFor('en');
const fr = separatorsFor('fr');

describe('separatorsFor', () => {
  it('reads the marks of each language', () => {
    expect(en).toEqual({ group: ',', decimal: '.' });
    expect(fr.decimal).toBe(',');
    expect(fr.group).toMatch(/^[\s\u00a0\u202f]$/);
  });
});

describe('toDisplaySalary', () => {
  it.each([
    ['70000', '70,000'],
    ['70000.50', '70,000.50'],
    ['1234567.8', '1,234,567.8'],
    ['70000.', '70,000.'],
    ['', ''],
    ['abc', 'abc'],
  ])('shows %s as %s in English', (plain, shown) => {
    expect(toDisplaySalary(plain, en)).toBe(shown);
  });

  it('uses the French marks', () => {
    expect(toDisplaySalary('70000.50', fr)).toBe(`70${fr.group}000,50`);
  });
});

describe('toPlainSalary', () => {
  it.each([
    ['70,000', '70000'],
    ['70,000.50', '70000.50'],
    ['70000.50', '70000.50'],
    [' 70 000 ', '70000'],
    ['70,000.123', '70000.123'],
    ['7a', '7a'],
    ['70 000,50', '70000.50'],
    ['1,5', '1.5'],
    ['1,000', '1000'],
    ['1,000,50', '1000.50'],
    ['1,000.5', '1000.5'],
  ])('reads %s in English as %s', (typed, plain) => {
    expect(toPlainSalary(typed, en)).toBe(plain);
  });

  it('reads French and plain input', () => {
    expect(toPlainSalary(`70${fr.group}000,50`, fr)).toBe('70000.50');
    expect(toPlainSalary('70 000,50', fr)).toBe('70000.50');
    expect(toPlainSalary('70000.50', fr)).toBe('70000.50');
  });

  it('round-trips what it shows', () => {
    for (const plain of ['1', '999', '1000', '70000.50', '1234567.89']) {
      expect(toPlainSalary(toDisplaySalary(plain, en), en)).toBe(plain);
      expect(toPlainSalary(toDisplaySalary(plain, fr), fr)).toBe(plain);
    }
  });
});

describe('caret', () => {
  it('keeps the caret after the same digit when a separator appears', () => {
    // typed a 4th digit at the end: "7000" -> "7,000"
    const count = significantBefore('7000', 4, en);
    expect(caretFor('7,000', count, en)).toBe(5);
    // caret after the first "7" of "70,000" stays after that "7"
    expect(caretFor('70,000', significantBefore('70000', 1, en), en)).toBe(1);
    // caret after the second zero: "70,0|00"
    expect(caretFor('70,000', significantBefore('70000', 3, en), en)).toBe(4);
  });

  it('handles the start and an empty box', () => {
    expect(caretFor('70,000', 0, en)).toBe(0);
    expect(caretFor('', 0, en)).toBe(0);
  });
});
