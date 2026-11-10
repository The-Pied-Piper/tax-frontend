import { describe, expect, it } from 'vitest';
import { sumAmounts } from './sum';

describe('sumAmounts', () => {
  it.each([
    [['3291.75', '665.00'], '3956.75'],
    [['0.10', '0.20'], '0.30'],
    [['5'], '5.00'],
    [[], '0.00'],
    [['10.00', '-2.50'], '7.50'],
    [['1.00', '-1.00'], '0.00'],
    [['99999999999.99', '0.01'], '100000000000.00'],
  ])('adds %j to %s', (amounts, expected) => {
    expect(sumAmounts(amounts)).toBe(expected);
  });

  it('refuses text that is not an amount', () => {
    expect(() => sumAmounts(['1', 'abc'])).toThrow(/Not a money amount/);
  });
});
