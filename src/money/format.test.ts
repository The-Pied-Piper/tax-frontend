import type { Unit } from '../api';
import { cad, months } from '../test/units';
import { displayMoney, groupThousands, withUnit } from './format';

describe('groupThousands', () => {
  it.each([
    ['53468.68', '53,468.68'],
    ['70000.00', '70,000.00'],
    ['16531.32', '16,531.32'],
    ['167749.14', '167,749.14'],
    ['1234567.89', '1,234,567.89'],
    ['999.99', '999.99'],
    ['0.00', '0.00'],
    ['-1028.24', '-1,028.24'],
    ['70000', '70,000'],
    ['-1000.5', '-1,000.5'],
    ['123456789012345678901234.50', '123,456,789,012,345,678,901,234.50'],
    ['00012.50', '00012.50'],
    ['not money', 'not money'],
  ])('writes %s as %s', (input, expected) => {
    expect(groupThousands(input)).toBe(expected);
  });
});

describe('withUnit', () => {
  it('puts a symbol before the amount with no space', () => {
    expect(withUnit('3,956.75', cad)).toBe('CA$3,956.75');
    expect(withUnit('53,468.68', cad)).toBe('CA$53,468.68');
  });

  it('puts the unit after the amount with one space', () => {
    expect(withUnit('12', months)).toBe('12 months');
    expect(withUnit('2', months)).toBe('2 months');
  });

  it('keeps a minus sign first, in front of a symbol', () => {
    expect(withUnit('-1,028.24', cad)).toBe('-CA$1,028.24');
    expect(withUnit('-1,000.00', cad)).toBe('-CA$1,000.00');
  });

  it('keeps a minus sign first when the unit goes after', () => {
    expect(withUnit('-1', months)).toBe('-1 months');
    expect(withUnit('-12', months)).toBe('-12 months');
  });

  it.each(['1', '1.0', '1.00'])('uses the singular for %s', (amount) => {
    expect(withUnit(amount, months)).toBe(`${amount} month`);
  });

  it.each(['2', '12', '0.00', '0', '1.01', '10', '11', '100.00'])(
    'uses the plural for %s',
    (amount) => {
      expect(withUnit(amount, months)).toBe(`${amount} months`);
    },
  );

  it('uses the plural for -1, which is not exactly 1', () => {
    expect(withUnit('-1', months)).toBe('-1 months');
    expect(withUnit('-1.00', months)).toBe('-1.00 months');
  });

  it('picks the singular or plural text of a symbol unit as well', () => {
    const dollars: Unit = {
      name: 'x',
      placement: 'before',
      singular: 'S$',
      plural: 'P$',
      spaced: false,
    };
    expect(withUnit('1.00', dollars)).toBe('S$1.00');
    expect(withUnit('2.00', dollars)).toBe('P$2.00');
    expect(withUnit('-1.00', dollars)).toBe('-P$1.00');
  });
});

describe('displayMoney', () => {
  it('puts the unit in front of the grouped amount', () => {
    expect(displayMoney('53468.68', 'annually', cad)).toBe('CA$53,468.68');
    expect(displayMoney('53468.68', 'monthly', cad)).toBe('CA$4,455.72');
  });

  it('keeps the unit of the yearly figure for every pay period', () => {
    expect(displayMoney('53468.68', 'biweekly', cad)).toBe('CA$2,056.49');
    expect(displayMoney('53468.68', 'weekly', cad)).toBe('CA$1,028.24');
    expect(displayMoney('70000.00', 'monthly', cad)).toBe('CA$5,833.33');
  });

  it('places the unit after the amount, two decimals, one space', () => {
    expect(displayMoney('12', 'annually', months)).toBe('12.00 months');
    expect(displayMoney('1.00', 'annually', months)).toBe('1.00 month');
  });

  it('uses the singular only for exactly 1', () => {
    expect(displayMoney('1', 'annually', months)).toBe('1.00 month');
    expect(displayMoney('1.0', 'annually', months)).toBe('1.00 month');
    expect(displayMoney('0.00', 'annually', months)).toBe('0.00 months');
    expect(displayMoney('-1', 'annually', months)).toBe('-1.00 months');
    expect(displayMoney('12', 'monthly', months)).toBe('1.00 month');
  });

  it('keeps a minus sign in front of the unit', () => {
    expect(displayMoney('-53468.68', 'weekly', cad)).toBe('-CA$1,028.24');
  });

  it('shows an unreadable amount as sent, without the unit', () => {
    expect(displayMoney('53468.555', 'monthly', cad)).toBe('53468.555');
    expect(displayMoney('53468.555', 'monthly', months)).toBe('53468.555');
  });
});
