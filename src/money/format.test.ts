import type { Unit } from '../api';
import { cad, months, percent } from '../test/units';
import {
  displayMoney,
  displayRate,
  displayRateOneDecimal,
  displayRoundedMoney,
  displayWholeMoney,
  groupThousands,
  isDollarUnit,
  withCents,
  displayTick,
  withUnit,
} from './format';

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
    expect(withUnit('3,956.75', cad)).toBe('$3,956.75');
    expect(withUnit('53,468.68', cad)).toBe('$53,468.68');
  });

  it('puts the unit after the amount with one space', () => {
    expect(withUnit('12', months)).toBe('12 months');
    expect(withUnit('2', months)).toBe('2 months');
  });

  it('keeps a minus sign first, in front of a symbol', () => {
    expect(withUnit('-1,028.24', cad)).toBe('-$1,028.24');
    expect(withUnit('-1,000.00', cad)).toBe('-$1,000.00');
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
      as_percentage: false,
    };
    expect(withUnit('1.00', dollars)).toBe('S$1.00');
    expect(withUnit('2.00', dollars)).toBe('P$2.00');
    expect(withUnit('-1.00', dollars)).toBe('-P$1.00');
  });
});

describe('displayMoney', () => {
  it('puts the unit in front of the grouped amount', () => {
    expect(displayMoney('53468.68', 'annually', cad)).toBe('$53,468.68');
    expect(displayMoney('53468.68', 'monthly', cad)).toBe('$4,455.72');
  });

  it('keeps the unit of the yearly figure for every pay period', () => {
    expect(displayMoney('53468.68', 'biweekly', cad)).toBe('$2,056.49');
    expect(displayMoney('53468.68', 'weekly', cad)).toBe('$1,028.24');
    expect(displayMoney('70000.00', 'monthly', cad)).toBe('$5,833.33');
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
    expect(displayMoney('-53468.68', 'weekly', cad)).toBe('-$1,028.24');
  });

  it('shows an unreadable amount as sent, without the unit', () => {
    expect(displayMoney('53468.555', 'monthly', cad)).toBe('53468.555');
    expect(displayMoney('53468.555', 'monthly', months)).toBe('53468.555');
  });
});

describe('displayRate', () => {
  const pct = { ...percent, as_percentage: true };
  it.each([
    ['0.1642', '16.42%'],
    ['0.2965', '29.65%'],
    ['0.1', '10%'],
    ['0.0905', '9.05%'],
    ['0.50', '50%'],
    ['0', '0%'],
    ['1', '100%'],
    ['0.123456', '12.3456%'],
    // Below zero: a benefit paid on filing is bigger than the tax.
    ['-0.2537', '-25.37%'],
    ['-0.25', '-25%'],
    ['-1.5', '-150%'],
    ['-0.0001', '-0.01%'],
    ['-0.0000', '0%'],
    ['-0', '0%'],
  ])('shows %s as %s', (amount, shown) => {
    expect(displayRate(amount, pct)).toBe(shown);
  });
  it('leaves the amount as it is when the unit is not a percentage', () => {
    expect(displayRate('16.42', { ...percent, as_percentage: false })).toBe(
      '16.42%',
    );
  });
  it('shows text it cannot read as sent', () => {
    expect(displayRate('abc', pct)).toBe('abc');
  });
});

describe('displayRateOneDecimal', () => {
  const pct = { ...percent, as_percentage: true };
  it.each([
    ['0.2316', '23.2%'],
    ['0.2315', '23.2%'],
    ['0.2314', '23.1%'],
    ['0', '0.0%'],
    ['1', '100.0%'],
    ['-0.2537', '-25.4%'],
    ['-0.0001', '0.0%'],
    ['-0.0004', '0.0%'],
    ['-0.0005', '-0.1%'],
    ['0.5353', '53.5%'],
    ['0.7327', '73.3%'],
  ])('shows %s as %s', (amount, shown) => {
    expect(displayRateOneDecimal(amount, pct)).toBe(shown);
  });
  it('shows a unit that is not a percentage, and unreadable text, as displayRate does', () => {
    expect(
      displayRateOneDecimal('16.42', { ...percent, as_percentage: false }),
    ).toBe('16.42%');
    expect(displayRateOneDecimal('abc', pct)).toBe('abc');
  });
});

describe('displayRoundedMoney', () => {
  const dollar: Unit = { ...cad, singular: '$', plural: '$' };
  it.each([
    ['53786.25', 'annually', '$53,786'],
    ['53786.50', 'annually', '$53,787'],
    ['0.00', 'annually', '$0'],
    ['-812.05', 'annually', '-$812'],
    ['-0.40', 'annually', '$0'],
    ['53786.25', 'monthly', '$4,482'],
    ['-812.05', 'monthly', '-$68'],
  ] as const)('shows %s %s as %s', (amount, period, shown) => {
    expect(displayRoundedMoney(amount, period, dollar)).toBe(shown);
  });
  it('shows text it cannot read as sent', () => {
    expect(displayRoundedMoney('abc', 'annually', dollar)).toBe('abc');
  });
});

describe('displayWholeMoney', () => {
  const dollar: Unit = { ...cad, singular: '$', plural: '$' };

  it.each([
    ['70000', '$70,000'],
    ['70000.00', '$70,000'],
    ['0.00', '$0'],
    ['1000000', '$1,000,000'],
    ['-5000.00', '-$5,000'],
  ])('drops the cents of a whole-dollar %s', (amount, expected) => {
    expect(displayWholeMoney(amount, 'annually', dollar)).toBe(expected);
  });

  it.each([
    ['70000.50', '$70,000.50'],
    ['70000.05', '$70,000.05'],
    ['70000.10', '$70,000.10'],
    ['53468.68', '$53,468.68'],
  ])('keeps the cents of %s', (amount, expected) => {
    expect(displayWholeMoney(amount, 'annually', dollar)).toBe(expected);
  });

  it('works on the amount for the pay period, as displayMoney does', () => {
    expect(displayWholeMoney('52000', 'weekly', dollar)).toBe('$1,000');
    expect(displayWholeMoney('70000', 'monthly', dollar)).toBe('$5,833.33');
  });

  it('shows an amount it cannot read as sent', () => {
    expect(displayWholeMoney('lots', 'annually', dollar)).toBe('lots');
  });
});

describe('withCents', () => {
  it.each([
    ['70000', '70000.00'],
    ['1471', '1471.00'],
    ['1471.5', '1471.50'],
    ['-1000', '-1000.00'],
    ['0', '0.00'],
    ['70000.00', '70000.00'],
    ['0.125', '0.125'],
    ['not money', 'not money'],
  ])('writes %s as %s', (input, expected) => {
    expect(withCents(input)).toBe(expected);
  });
});

describe('isDollarUnit', () => {
  it('is true for the dollar and false for months and percent', () => {
    expect(isDollarUnit(cad)).toBe(true);
    expect(isDollarUnit(months)).toBe(false);
    expect(isDollarUnit(percent)).toBe(false);
  });
});

describe('displayTick', () => {
  it('shortens whole hundreds from a thousand up and groups the rest', () => {
    expect(displayTick('0', cad)).toBe('$0');
    expect(displayTick('500', cad)).toBe('$500');
    expect(displayTick('2500', cad)).toBe('$2.5k');
    expect(displayTick('50000', cad)).toBe('$50k');
    expect(displayTick('1050', cad)).toBe('$1,050');
    expect(displayTick('-5000', cad)).toBe('-$5k');
    expect(displayTick('500000', cad)).toBe('$500k');
    expect(displayTick('1000000', cad)).toBe('$1,000k');
  });

  it('puts the unit where the unit says', () => {
    expect(displayTick('50000', months)).toBe('50k months');
    expect(displayTick('1000', months)).toBe('1k months');
  });

  it('shows a rate as the unit says, nothing rounded', () => {
    expect(displayTick('0.2', percent)).toBe('20%');
    expect(displayTick('0', percent)).toBe('0%');
    expect(displayTick('0.125', percent)).toBe('12.5%');
  });
});
