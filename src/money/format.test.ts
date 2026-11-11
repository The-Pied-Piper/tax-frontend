import { displayMoney, groupThousands, withSymbol } from './format';

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

describe('displayMoney', () => {
  it('puts the symbol in front of the grouped amount', () => {
    expect(displayMoney('53468.68', 'annually', '$')).toBe('$53,468.68');
    expect(displayMoney('53468.68', 'monthly', '$')).toBe('$4,455.72');
  });

  it('shows an unreadable amount as sent, without the symbol', () => {
    expect(displayMoney('53468.555', 'monthly', '$')).toBe('53468.555');
  });

  it('keeps a minus sign in front of the symbol', () => {
    expect(withSymbol('-1,000.00', '$')).toBe('-$1,000.00');
  });
});
