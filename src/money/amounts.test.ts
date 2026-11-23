import {
  halfOf,
  ratioText,
  roundToWhole,
  subtractAmounts,
  timesTenThousand,
} from './amounts';

describe('subtractAmounts', () => {
  it('subtracts exactly, keeping the cents', () => {
    expect(subtractAmounts('5769.52', '0')).toBe('5769.52');
    expect(subtractAmounts('1', '0.5353')).toBe('0.4647');
    expect(subtractAmounts('0.10', '0.25')).toBe('-0.15');
  });
});

describe('roundToWhole', () => {
  it('rounds to a whole dollar, a half going up', () => {
    expect(roundToWhole('11133.97')).toBe('11134');
    expect(roundToWhole('32.60')).toBe('33');
    expect(roundToWhole('10.50')).toBe('11');
    expect(roundToWhole('10.49')).toBe('10');
    expect(roundToWhole('0')).toBe('0');
  });
});

describe('halfOf', () => {
  it('halves exactly', () => {
    expect(halfOf('0.4538')).toBe('0.2269');
    expect(halfOf('3')).toBe('1.5');
  });
});

describe('timesTenThousand', () => {
  it('moves the decimal point four places', () => {
    expect(timesTenThousand('0.5353')).toBe('5353');
    expect(timesTenThousand('0.47')).toBe('4700');
  });
});

describe('ratioText', () => {
  it('writes a fraction to four decimals, half up', () => {
    expect(ratioText('273077.60', '500000')).toBe('0.5462');
    expect(ratioText('1', '3')).toBe('0.3333');
    expect(() => ratioText('1', '0')).toThrow();
  });
});
