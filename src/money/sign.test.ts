import { describe, expect, it } from 'vitest';
import { isPositive, isZero } from './sign';

describe('isPositive and isZero', () => {
  it.each([
    ['0', false, true],
    ['0.00', false, true],
    ['-0.00', false, true],
    ['0.01', true, false],
    ['1500.00', true, false],
    ['1500', true, false],
    ['99999999999999999.99', true, false],
    ['-0.01', false, false],
    ['-1500.00', false, false],
  ])('%s: positive %s, zero %s', (amount, positive, zero) => {
    expect(isPositive(amount)).toBe(positive);
    expect(isZero(amount)).toBe(zero);
  });

  it.each(['', 'abc', '1,500.00', '1.005', ' 1', '1e3'])(
    'refuses %j the same way toCents does',
    (text) => {
      expect(() => isPositive(text)).toThrow(/Not a money amount/);
      expect(() => isZero(text)).toThrow(/Not a money amount/);
    },
  );
});
