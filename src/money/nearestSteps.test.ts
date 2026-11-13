import { nearestSteps } from './nearestSteps';

// The steps are the salaries of a province's pre-built pages, lowest first,
// as plain text. Salaries are compared exactly (cents, not Number).
const steps = Array.from({ length: 25 }, (_, i) =>
  (30000 + i * 5000).toString(),
);

describe('nearestSteps', () => {
  it('gives the four nearest steps, nearest first', () => {
    expect(nearestSteps('82000', steps)).toEqual([
      '80000',
      '85000',
      '75000',
      '90000',
    ]);
  });

  it('puts a salary that is a step first, then its neighbours', () => {
    expect(nearestSteps('70000', steps)).toEqual([
      '70000',
      '65000',
      '75000',
      '60000',
    ]);
  });

  it('puts the lower step first on a tie', () => {
    expect(nearestSteps('82500', steps)).toEqual([
      '80000',
      '85000',
      '75000',
      '90000',
    ]);
    expect(nearestSteps('67500', steps).slice(0, 2)).toEqual([
      '65000',
      '70000',
    ]);
  });

  it('reads cents exactly', () => {
    expect(nearestSteps('82000.50', steps)).toEqual([
      '80000',
      '85000',
      '75000',
      '90000',
    ]);
    // 2,500.01 above 80,000 is nearer 85,000 than 80,000 by one cent only here:
    expect(nearestSteps('82500.01', steps).slice(0, 2)).toEqual([
      '85000',
      '80000',
    ]);
    expect(nearestSteps('82499.99', steps).slice(0, 2)).toEqual([
      '80000',
      '85000',
    ]);
    expect(nearestSteps('70000.00', steps)[0]).toBe('70000');
  });

  it('gives the lowest steps for a salary below the lowest step', () => {
    expect(nearestSteps('10000', steps)).toEqual([
      '30000',
      '35000',
      '40000',
      '45000',
    ]);
    expect(nearestSteps('0', steps)[0]).toBe('30000');
  });

  it('gives the highest steps, nearest first, for a salary above the highest step', () => {
    expect(nearestSteps('200000', steps)).toEqual([
      '150000',
      '145000',
      '140000',
      '135000',
    ]);
  });

  it('works at the edges themselves', () => {
    expect(nearestSteps('30000', steps)).toEqual([
      '30000',
      '35000',
      '40000',
      '45000',
    ]);
    expect(nearestSteps('150000', steps)).toEqual([
      '150000',
      '145000',
      '140000',
      '135000',
    ]);
  });

  it('gives fewer than four when there are fewer steps, and none for no steps', () => {
    expect(nearestSteps('82000', ['75000', '80000'])).toEqual([
      '80000',
      '75000',
    ]);
    expect(nearestSteps('82000', [])).toEqual([]);
  });

  it('takes the number wanted as a third argument', () => {
    expect(nearestSteps('82000', steps, 2)).toEqual(['80000', '85000']);
    expect(nearestSteps('82000', steps, 0)).toEqual([]);
  });

  it('does not change the list it is given', () => {
    const copy = [...steps];
    nearestSteps('82000', steps);
    expect(steps).toEqual(copy);
  });

  it('compares exactly, never as a float: beyond 2^53 one dollar still counts', () => {
    // As Numbers 9007199254740995 and 9007199254740997 are both 9007199254740996.
    expect(
      nearestSteps(
        '9007199254740995',
        ['9007199254740994', '9007199254740997'],
        1,
      ),
    ).toEqual(['9007199254740994']);
  });
});
