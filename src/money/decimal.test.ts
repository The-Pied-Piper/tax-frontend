import { divideHalfUp, parse, parseAll, unitsText } from './decimal';

describe('parse', () => {
  it('reads an amount onto whole units and counts its decimals', () => {
    expect(parse('70000.00')).toEqual({ units: 7000000n, digits: 2 });
    expect(parse('-0.1942')).toEqual({ units: -1942n, digits: 4 });
    expect(parse('5')).toEqual({ units: 5n, digits: 0 });
  });

  it('refuses text that is not a plain decimal, or is longer than 30 characters', () => {
    expect(() => parse('1,000')).toThrow(/Not a decimal/);
    expect(() => parse('01')).toThrow();
    expect(() => parse('')).toThrow();
    expect(() => parse(`1${'0'.repeat(30)}`)).toThrow();
  });
});

describe('parseAll', () => {
  it('puts several amounts on the longest scale', () => {
    expect(parseAll(['1', '0.5', '2.25'])).toEqual({
      units: [100n, 50n, 225n],
      digits: 2,
    });
  });
});

describe('divideHalfUp', () => {
  it('rounds a tie to the larger value, whatever the sign', () => {
    expect(divideHalfUp(5n, 2n)).toBe(3n);
    expect(divideHalfUp(-5n, 2n)).toBe(-2n);
    expect(divideHalfUp(1n, 3n)).toBe(0n);
    expect(divideHalfUp(2n, 3n)).toBe(1n);
  });

  it('divides by a negative number', () => {
    expect(divideHalfUp(5n, -2n)).toBe(-2n);
    expect(divideHalfUp(-5n, -2n)).toBe(3n);
  });
});

describe('unitsText', () => {
  it('writes the units back, dropping trailing zeros of the fraction', () => {
    expect(unitsText(5000n, 2)).toBe('50');
    expect(unitsText(1942n, 4)).toBe('0.1942');
    expect(unitsText(-1942n, 4)).toBe('-0.1942');
    expect(unitsText(7n, 0)).toBe('7');
  });

  it('never writes a negative zero', () => {
    expect(unitsText(0n, 2)).toBe('0');
    expect(unitsText(-0n, 4)).toBe('0');
  });
});
