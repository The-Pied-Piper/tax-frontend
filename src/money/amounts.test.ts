import {
  roundToFourDecimals,
  roundToHalfPoint,
  ratioText,
  roundToWhole,
  subtractAmounts,
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

describe('roundToHalfPoint', () => {
  it('rounds a rate to the nearest half point, a half going up', () => {
    expect(roundToHalfPoint('0.0758')).toBe('0.075');
    expect(roundToHalfPoint('0.2052')).toBe('0.205');
    expect(roundToHalfPoint('0.5911')).toBe('0.59');
    expect(roundToHalfPoint('0.7327')).toBe('0.735');
    expect(roundToHalfPoint('0.0125')).toBe('0.015');
    expect(roundToHalfPoint('0')).toBe('0');
    expect(roundToHalfPoint('1')).toBe('1');
  });
});

describe('ratioText', () => {
  it('writes a fraction to four decimals, half up', () => {
    expect(ratioText('273077.60', '500000')).toBe('0.5462');
    expect(ratioText('1', '3')).toBe('0.3333');
    expect(() => ratioText('1', '0')).toThrow();
  });
});

describe('roundToFourDecimals', () => {
  it('rounds a rate to four decimals, a half going up', () => {
    expect(roundToFourDecimals('0.4647041')).toBe('0.4647');
    expect(roundToFourDecimals('0.46475')).toBe('0.4648');
    expect(roundToFourDecimals('0.3435')).toBe('0.3435');
    expect(roundToFourDecimals('0.5')).toBe('0.5');
    expect(roundToFourDecimals('1')).toBe('1');
  });
});
