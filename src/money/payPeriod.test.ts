import { amountForPeriod } from './payPeriod';

// 2025 Ontario take-home at $70,000 (the engine's figure for the fixtures).
const TAKE_HOME = '53468.68';

describe('amountForPeriod', () => {
  it('divides $70,000 take-home by 52 (weekly)', () => {
    expect(amountForPeriod(TAKE_HOME, 'weekly')).toBe('1028.24');
  });

  it('divides $70,000 take-home by 26 (bi-weekly)', () => {
    expect(amountForPeriod(TAKE_HOME, 'biweekly')).toBe('2056.49');
  });

  it('divides $70,000 take-home by 12 (monthly)', () => {
    expect(amountForPeriod(TAKE_HOME, 'monthly')).toBe('4455.72');
  });

  it('returns the yearly amount with two decimals for annually', () => {
    expect(amountForPeriod(TAKE_HOME, 'annually')).toBe('53468.68');
    expect(amountForPeriod('70000', 'annually')).toBe('70000.00');
    expect(amountForPeriod('70000.5', 'annually')).toBe('70000.50');
  });

  it('rounds half up at exactly half a cent', () => {
    // 0.06 / 12 = 0.005 -> 0.01; 0.05 / 12 = 0.00416... -> 0.00
    expect(amountForPeriod('0.06', 'monthly')).toBe('0.01');
    expect(amountForPeriod('0.05', 'monthly')).toBe('0.00');
    // 1.30 / 26 = 0.05 exactly; 1.29 / 26 = 0.04961... -> 0.05
    expect(amountForPeriod('1.30', 'biweekly')).toBe('0.05');
  });

  it('rounds negatives half away from zero', () => {
    expect(amountForPeriod('-0.06', 'monthly')).toBe('-0.01');
    expect(amountForPeriod('-0.05', 'monthly')).toBe('0.00');
    expect(amountForPeriod('-53468.68', 'monthly')).toBe('-4455.72');
  });

  it('never returns a negative zero', () => {
    expect(amountForPeriod('-0', 'monthly')).toBe('0.00');
    expect(amountForPeriod('-0.00', 'weekly')).toBe('0.00');
  });

  it('rejects an unknown period', () => {
    // @ts-expect-error a period outside the type
    expect(() => amountForPeriod('1.00', 'daily')).toThrow(
      'Unknown pay period',
    );
  });

  it('is exact for amounts too large for a float', () => {
    expect(amountForPeriod('9007199254740993.00', 'annually')).toBe(
      '9007199254740993.00',
    );
    expect(amountForPeriod('900719925474099300.12', 'monthly')).toBe(
      '75059993789508275.01',
    );
  });

  it('rejects text that is not a money amount', () => {
    for (const bad of [
      '',
      'abc',
      '1,000.00',
      '1.234',
      '.5',
      '1e3',
      ' 5',
      '007',
      '00.5',
    ]) {
      expect(() => amountForPeriod(bad, 'monthly')).toThrow();
    }
  });
});
