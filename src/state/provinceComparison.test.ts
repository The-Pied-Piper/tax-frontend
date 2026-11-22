import { separatorsFor } from '../money/salaryInput';
import { SAMPLE_SALARIES, sampleSweeps } from '../test/comparisonData';
import { sweepSalaries } from './hubCharts';
import {
  comparisonRows,
  DEFAULT_SALARY,
  MEASURES,
  nearestSalaryIndex,
  typedSalaryIndex,
} from './provinceComparison';

const english = separatorsFor('en');
const french = separatorsFor('fr');
// The full sweep, as the build writes it: salaries are quantized amounts.
const full = sweepSalaries().map((salary) => `${salary}.00`);

describe('the measures', () => {
  it('are take-home pay, income tax and the average rate, in that order', () => {
    expect(MEASURES).toEqual(['takeHome', 'incomeTax', 'averageRate']);
  });
});

describe('nearestSalaryIndex', () => {
  it('finds the default salary of $70,000 in the full sweep', () => {
    expect(DEFAULT_SALARY).toBe('70000');
    expect(full[nearestSalaryIndex(full, DEFAULT_SALARY)]).toBe('70000.00');
  });

  it('snaps to the nearest point, the lower one on a tie', () => {
    expect(full[nearestSalaryIndex(full, '70499.99')]).toBe('70000.00');
    expect(full[nearestSalaryIndex(full, '70500')]).toBe('70000.00');
    expect(full[nearestSalaryIndex(full, '70500.01')]).toBe('71000.00');
    // Past $250,000 the points are $5,000 apart.
    expect(full[nearestSalaryIndex(full, '252499.99')]).toBe('250000.00');
    expect(full[nearestSalaryIndex(full, '252500')]).toBe('250000.00');
    expect(full[nearestSalaryIndex(full, '252500.01')]).toBe('255000.00');
  });

  it('works on the points it is given, whatever their number', () => {
    expect(SAMPLE_SALARIES[nearestSalaryIndex(SAMPLE_SALARIES, '60000')]).toBe(
      '70000.00',
    );
    expect(SAMPLE_SALARIES[nearestSalaryIndex(SAMPLE_SALARIES, '45000')]).toBe(
      '30000.00',
    );
  });
});

describe('typedSalaryIndex', () => {
  const index = (typed: string, separators = english) => {
    const at = typedSalaryIndex(typed, full, separators);
    return at === null ? null : full[at];
  };

  it('snaps a typed salary to the nearest point', () => {
    expect(index('70000')).toBe('70000.00');
    expect(index('70,400')).toBe('70000.00');
    expect(index('70,600.50')).toBe('71000.00');
    expect(index('$70,000'.replace('$', ''))).toBe('70000.00');
    expect(index('253000')).toBe('255000.00');
  });

  it('reads the typed text the way the language writes it', () => {
    expect(index('70 000,50', french)).toBe('70000.00');
  });

  it('accepts the ends of the sweep, $1,000 and $500,000', () => {
    expect(index('1000')).toBe('1000.00');
    expect(index('500000')).toBe('500000.00');
  });

  it('reads a salary typed with leading zeros as the salary without them', () => {
    expect(index('070000')).toBe('70000.00');
    expect(index('00070000')).toBe('70000.00');
    expect(index('0070 000,50', french)).toBe('70000.00');
    expect(index('000')).toBeNull();
  });

  it('refuses a salary outside the sweep', () => {
    expect(index('999.99')).toBeNull();
    expect(index('0')).toBeNull();
    expect(index('500000.01')).toBeNull();
    expect(index('9999999999')).toBeNull();
  });

  it('refuses text that is not a salary', () => {
    for (const typed of [
      '',
      ' ',
      'abc',
      '-70000',
      '7e4',
      '70000.123',
      '1.2.3',
    ]) {
      expect(index(typed), typed).toBeNull();
    }
  });

  it('refuses a number far longer than any salary without reading it', () => {
    expect(index('1'.repeat(40))).toBeNull();
  });
});

describe('comparisonRows', () => {
  // Index 3 of the sample points is $70,000.
  const at70000 = 3;

  it('puts the highest take-home first, with the figure as the engine wrote it', () => {
    const rows = comparisonRows(sampleSweeps, at70000, 'takeHome');
    expect(rows.map((row) => [row.slug, row.value])).toEqual([
      ['ca-bc', '54348.15'],
      ['ca-ab', '54107.20'],
      ['ca-on', '53786.25'],
      ['ca-sk', '52669.31'],
      ['ca-mb', '51899.32'],
      ['ca-nl', '51703.00'],
    ]);
  });

  it('puts the highest income tax first', () => {
    const rows = comparisonRows(sampleSweeps, at70000, 'incomeTax');
    expect(rows.map((row) => [row.slug, row.value])).toEqual([
      ['ca-nl', '13217.18'],
      ['ca-mb', '13020.86'],
      ['ca-sk', '12250.87'],
      ['ca-on', '11133.93'],
      ['ca-ab', '10812.98'],
      ['ca-bc', '10572.03'],
    ]);
  });

  it('puts the highest average rate first, in the rate unit', () => {
    const rows = comparisonRows(sampleSweeps, at70000, 'averageRate');
    expect(rows.map((row) => [row.slug, row.value])).toEqual([
      ['ca-nl', '0.1888'],
      ['ca-mb', '0.1860'],
      ['ca-sk', '0.1750'],
      ['ca-on', '0.1591'],
      ['ca-ab', '0.1545'],
      ['ca-bc', '0.1510'],
    ]);
    expect(rows.every((row) => row.unit.as_percentage === true)).toBe(true);
    const money = comparisonRows(sampleSweeps, at70000, 'takeHome');
    expect(money.every((row) => row.unit.as_percentage !== true)).toBe(true);
  });

  it('draws the longest bar at 100 and the others in proportion, to a tenth', () => {
    const rows = comparisonRows(sampleSweeps, at70000, 'takeHome');
    expect(rows[0]?.width).toBe('100.0');
    // 51703.00 / 54348.15 = 95.13 %
    expect(rows[5]?.width).toBe('95.1');
  });

  it('keeps the order of the list for provinces with the same figure', () => {
    const [on, ab] = sampleSweeps;
    if (!on || !ab) throw new Error('sample sweeps');
    const same = { ...ab, slug: 'ca-xx', points: on.points };
    const rows = comparisonRows([on, same, ab], at70000, 'incomeTax');
    expect(rows.map((row) => row.slug)).toEqual(['ca-on', 'ca-xx', 'ca-ab']);
  });

  it('draws no bar for a figure of zero or less, and none at all when every figure is zero', () => {
    const [on, ab] = sampleSweeps;
    if (!on || !ab) throw new Error('sample sweeps');
    // Income tax at $1,000 is nil in Ontario.
    const rows = comparisonRows([on, ab], 0, 'incomeTax');
    expect(rows.map((row) => row.value)).toEqual(['0.00', '0.00']);
    expect(rows.map((row) => row.width)).toEqual(['0.0', '0.0']);
    const negative = {
      ...on,
      points: [
        ['1000.00', '1000.00', '0.00', '-50.00', '0.0000', '0.0505'],
      ] as typeof on.points,
    };
    const mixed = comparisonRows(
      [
        negative,
        {
          ...ab,
          points: [['1000.00', '1000.00', '0.00', '20.00', '0.02', '0.05']],
        },
      ],
      0,
      'incomeTax',
    );
    expect(mixed.map((row) => [row.value, row.width])).toEqual([
      ['20.00', '100.0'],
      ['-50.00', '0.0'],
    ]);
  });
});
