import {
  compareAmounts,
  halfOf,
  ratioText,
  roundToWhole,
  subtractAmounts,
  timesTenThousand,
  isBeyond,
  nearestAmountIndex,
  nearestIndex,
  niceAxis,
  pointerPosition,
  scalePosition,
} from './scale';

describe('scalePosition', () => {
  it('places the ends of the axis on the coordinates given', () => {
    expect(scalePosition('0', '0', '500000', 56, 408)).toBe('56.0');
    expect(scalePosition('500000', '0', '500000', 56, 408)).toBe('408.0');
  });

  it('places $70,000 exactly, rounding the tenth half up', () => {
    // 56 + 70000/500000 * 352 = 105.28
    expect(scalePosition('70000', '0', '500000', 56, 408)).toBe('105.3');
    // 56 + 1000/500000 * 352 = 56.704
    expect(scalePosition('1000', '0', '500000', 56, 408)).toBe('56.7');
  });

  it('runs a vertical axis upward (to is smaller than from)', () => {
    expect(scalePosition('0', '0', '100', 206, 10)).toBe('206.0');
    expect(scalePosition('100', '0', '100', 206, 10)).toBe('10.0');
    expect(scalePosition('50', '0', '100', 206, 10)).toBe('108.0');
  });

  it('handles fractions without a float: 0.2965 on 0 to 0.5', () => {
    // 206 - 0.2965/0.5 * 196 = 89.772
    expect(scalePosition('0.2965', '0', '0.5', 206, 10)).toBe('89.8');
  });

  it('rounds a tie up on a rising and a falling axis alike', () => {
    expect(scalePosition('0.05', '0', '1', 0, 10)).toBe('0.5');
    expect(scalePosition('0.05', '0', '1', 10, 0)).toBe('9.5');
    expect(scalePosition('0.005', '0', '1', 10, 0)).toBe('10.0');
    expect(scalePosition('0.995', '0', '1', 10, 0)).toBe('0.1');
  });

  it('refuses a number far longer than any amount', () => {
    expect(() => scalePosition('1'.repeat(40), '0', '5', 0, 10)).toThrow();
  });

  it('handles values below zero', () => {
    expect(scalePosition('-500', '-1000', '1000', 100, 0)).toBe('75.0');
  });

  it('refuses an empty range, text that is not a decimal and fractional coordinates', () => {
    expect(() => scalePosition('1', '5', '5', 0, 10)).toThrow();
    expect(() => scalePosition('1e3', '0', '5', 0, 10)).toThrow();
    expect(() => scalePosition('1', '0', '5', 0.5, 10)).toThrow();
  });
});

describe('pointerPosition and nearestIndex', () => {
  it('turns a pointer offset into a position', () => {
    expect(pointerPosition(100, 200, 420)).toBe('210.0');
    expect(pointerPosition(1, 3, 420)).toBe('140.0');
  });

  it('refuses an empty box', () => {
    expect(() => pointerPosition(1, 0, 420)).toThrow();
  });

  it('picks the nearest position, the earlier one on a tie', () => {
    const xs = ['56.0', '56.7', '57.4', '100.0'];
    expect(nearestIndex(xs, '56.3')).toBe(0);
    expect(nearestIndex(xs, '56.4')).toBe(1);
    expect(nearestIndex(xs, '90.0')).toBe(3);
    expect(nearestIndex(xs, '0.0')).toBe(0);
    expect(nearestIndex(['10.0', '20.0'], '15.0')).toBe(0);
  });

  it('compares positions', () => {
    expect(isBeyond('252.1', '252.0')).toBe(true);
    expect(isBeyond('252.0', '252.0')).toBe(false);
  });
});

describe('niceAxis', () => {
  it('rounds dollars up to 1, 2 or 5 times a power of ten', () => {
    expect(niceAxis(['0', '53468.68', '180000'])).toEqual({
      min: '0',
      max: '200000',
      ticks: ['0', '50000', '100000', '150000', '200000'],
    });
  });

  it('works for rates written as fractions', () => {
    expect(niceAxis(['0.1', '0.2965', '0.43'])).toEqual({
      min: '0',
      max: '0.5',
      ticks: ['0', '0.1', '0.2', '0.3', '0.4', '0.5'],
    });
  });

  it('includes values below zero', () => {
    const axis = niceAxis(['-3200', '1500', '40000']);
    expect(axis.min).toBe('-10000');
    expect(axis.max).toBe('40000');
    expect(axis.ticks[0]).toBe('-10000');
  });

  it('keeps a range that straddles zero within five steps', () => {
    const axis = niceAxis(['-150', '350']);
    expect(axis.ticks.length).toBeLessThanOrEqual(6);
    expect(axis).toEqual({
      min: '-200',
      max: '400',
      ticks: ['-200', '0', '200', '400'],
    });
  });

  it('gives a flat chart of zeros an axis of its own', () => {
    expect(niceAxis(['0', '0'])).toEqual({
      min: '0',
      max: '1',
      ticks: ['0', '1'],
    });
  });
});

describe('compareAmounts', () => {
  it('compares exactly, whatever the number of decimals', () => {
    expect(compareAmounts('70000.00', '70000')).toBe(0);
    expect(compareAmounts('0.29650', '0.2965')).toBe(0);
    expect(compareAmounts('0.2965', '0.29651')).toBe(-1);
    expect(compareAmounts('10000', '9999.99')).toBe(1);
  });

  it('orders negative amounts below zero and below smaller negatives', () => {
    expect(compareAmounts('-0.01', '0')).toBe(-1);
    expect(compareAmounts('-2', '-1.5')).toBe(-1);
    expect(compareAmounts('-0.00', '0')).toBe(0);
  });

  it('refuses text that is not an amount', () => {
    expect(() => compareAmounts('abc', '1')).toThrow('Not a decimal amount');
  });
});

describe('nearestAmountIndex', () => {
  const steps = ['1000.00', '2000.00', '3000.00', '255000.00', '260000.00'];

  it('finds the nearest amount exactly, whatever the number of decimals', () => {
    expect(nearestAmountIndex(steps, '2400')).toBe(1);
    expect(nearestAmountIndex(steps, '2600.5')).toBe(2);
    expect(nearestAmountIndex(steps, '2000')).toBe(1);
    expect(nearestAmountIndex(steps, '0')).toBe(0);
    expect(nearestAmountIndex(steps, '999999')).toBe(4);
  });

  it('takes the earlier amount on a tie, and tells a cent apart', () => {
    expect(nearestAmountIndex(steps, '1500')).toBe(0);
    expect(nearestAmountIndex(steps, '1500.01')).toBe(1);
    expect(nearestAmountIndex(steps, '257500')).toBe(3);
    expect(nearestAmountIndex(steps, '257500.01')).toBe(4);
    expect(nearestAmountIndex(steps, '1499.99')).toBe(0);
  });

  it('refuses no amounts, and text that is not an amount', () => {
    expect(() => nearestAmountIndex([], '1')).toThrow('No amounts');
    expect(() => nearestAmountIndex(steps, 'abc')).toThrow('Not a decimal');
  });
});

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
