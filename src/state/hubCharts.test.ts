import { subtractAmounts } from '../money/amounts';
import { compareAmounts } from '../money/scale';
import { fullHubCharts } from '../test/hubNotesData';
import {
  CHART_COLUMN,
  defaultIndex,
  parseHubChartsData,
  SALARY_AXIS,
  regularIndexes,
  regularSalaries,
  sweepSalaries,
  type SweepPoint,
} from './hubCharts';

const unit = {
  name: 'CAD',
  placement: 'before',
  singular: '$',
  plural: '$',
  spaced: false,
};
const sweep = {
  slug: 'ca-on',
  year: 2026,
  provisional: true,
  unit,
  rateUnit: { ...unit, as_percentage: true },
  points: [['1000', '1000.00', '0.00', '0.00', '0.0000', '0.0505']],
  edges: [['20000', '20160', '20170', '0.2640']],
  facts: { surtax_first: '5818' },
};

describe('regularSalaries', () => {
  const steps = regularSalaries();

  it('starts at $1,000, because the API takes no salary of 0', () => {
    expect(steps[0]).toBe('1000');
  });

  it('goes up $1,000 at a time to $250,000, then $5,000 at a time to $500,000', () => {
    const expected: string[] = [];
    for (let n = 1000; n <= 250000; n += 1000) expected.push(n.toString());
    for (let n = 255000; n <= 500000; n += 5000) expected.push(n.toString());
    expect(steps).toEqual(expected);
    expect(steps).toHaveLength(300);
    expect(steps[249]).toBe('250000');
    expect(steps[250]).toBe('255000');
    expect(steps[299]).toBe('500000');
  });
});

describe('sweepSalaries', () => {
  const steps = sweepSalaries();

  it('is the regular salaries plus twenty-seven extra ones, lowest first', () => {
    expect(steps).toHaveLength(327);
    expect(
      steps.filter((salary) => !regularSalaries().includes(salary)),
    ).toEqual([
      '1990',
      '2020',
      '2040',
      '32570',
      '32580',
      '32790',
      '32800',
      '36320',
      '36340',
      '38840',
      '38860',
      '48440',
      '48460',
      '49050',
      '49070',
      '72680',
      '72700',
      '73290',
      '73310',
      '201100',
      '201120',
      '201140',
      '201200',
      '201700',
      '201720',
      '201740',
      '201800',
    ]);
    expect(steps.slice(0, 5)).toEqual(['1000', '1990', '2000', '2020', '2040']);
    expect(steps).toEqual([...steps].sort(compareAmounts));
  });
});

describe('regularIndexes', () => {
  it('points at the regular salaries only, which the comparison slider steps through', () => {
    const points = sweepSalaries().map((salary) => point(`${salary}.00`));
    const indexes = regularIndexes(points);
    expect(indexes).toHaveLength(300);
    expect(indexes.map((at) => points[at]?.[0])).toEqual(
      regularSalaries().map((salary) => `${salary}.00`),
    );
  });
});

describe('parseHubChartsData', () => {
  it('reads a block of province sweeps', () => {
    const parsed = parseHubChartsData(JSON.stringify({ provinces: [sweep] }));
    expect(parsed?.provinces[0]?.points).toEqual(sweep.points);
  });

  it("reads the salaries of a province's own salary pages, and a sweep with none", () => {
    const parsed = parseHubChartsData(
      JSON.stringify({ provinces: [{ ...sweep, salaryPages: ['30000'] }] }),
    );
    expect(parsed?.provinces[0]?.salaryPages).toEqual(['30000']);
    expect(
      parseHubChartsData(JSON.stringify({ provinces: [sweep] })),
    ).not.toBeNull();
  });

  it('reads provinces that share their salaries and their year', () => {
    const other = { ...sweep, slug: 'ca-ab' };
    expect(
      parseHubChartsData(JSON.stringify({ provinces: [sweep, other] }))
        ?.provinces,
    ).toHaveLength(2);
  });

  it.each([
    ['no text', null],
    ['blank text', '  '],
    ['text that is not JSON', '{'],
    ['no provinces', '{}'],
    ['an empty list of provinces', JSON.stringify({ provinces: [] })],
    [
      'a province with no points',
      JSON.stringify({ provinces: [{ ...sweep, points: [] }] }),
    ],
    [
      'a point of numbers',
      JSON.stringify({
        provinces: [{ ...sweep, points: [[1, 2, 3, 4, 5, 6]] }],
      }),
    ],
    [
      'a point with four figures',
      JSON.stringify({
        provinces: [{ ...sweep, points: [['1', '2', '3', '4', '5']] }],
      }),
    ],
    [
      'a figure that is not a decimal',
      JSON.stringify({
        provinces: [
          { ...sweep, points: [['1000', '<b>', '0', '0', '0', '0']] },
        ],
      }),
    ],
    ['no unit', JSON.stringify({ provinces: [{ ...sweep, unit: null }] })],
    [
      'an edge with three figures',
      JSON.stringify({
        provinces: [{ ...sweep, edges: [['20000', '20160', '20170']] }],
      }),
    ],
    [
      'an edge that is not a decimal',
      JSON.stringify({
        provinces: [{ ...sweep, edges: [['20000', '20160', '<b>', '0.2']] }],
      }),
    ],
    [
      'no edges',
      JSON.stringify({ provinces: [{ ...sweep, edges: undefined }] }),
    ],
    [
      'a fact that is not a decimal',
      JSON.stringify({ provinces: [{ ...sweep, facts: { a: '<b>' } }] }),
    ],
    [
      'a fact with a name that is not a name',
      JSON.stringify({ provinces: [{ ...sweep, facts: { '../a': '1' } }] }),
    ],
    [
      'no facts',
      JSON.stringify({ provinces: [{ ...sweep, facts: undefined }] }),
    ],
    [
      'a year as text',
      JSON.stringify({ provinces: [{ ...sweep, year: '2026' }] }),
    ],
    [
      'provinces whose points are at different salaries',
      JSON.stringify({
        provinces: [
          sweep,
          {
            ...sweep,
            slug: 'ca-ab',
            points: [
              ['2000.00', '1000.00', '0.00', '0.00', '0.0000', '0.0505'],
            ],
          },
        ],
      }),
    ],
    [
      'a figure with a leading zero',
      JSON.stringify({
        provinces: [
          { ...sweep, points: [['1000', '01000.00', '0', '0', '0', '0']] },
        ],
      }),
    ],
    [
      'a figure longer than money/ reads',
      JSON.stringify({
        provinces: [
          { ...sweep, points: [['1000', '1'.repeat(31), '0', '0', '0', '0']] },
        ],
      }),
    ],
    [
      'salaries that do not rise',
      JSON.stringify({
        provinces: [
          {
            ...sweep,
            points: [
              ['2000', '1', '0', '0', '0', '0'],
              ['1000', '1', '0', '0', '0', '0'],
            ],
          },
        ],
      }),
    ],
    [
      'a salary of zero',
      JSON.stringify({
        provinces: [{ ...sweep, points: [['0', '1', '0', '0', '0', '0']] }],
      }),
    ],
    [
      'a slug that is not a slug',
      JSON.stringify({ provinces: [{ ...sweep, slug: '/evil.com' }] }),
    ],
    [
      'two provinces with the same slug',
      JSON.stringify({ provinces: [sweep, sweep] }),
    ],
    [
      'salary pages that are not whole-dollar salaries',
      JSON.stringify({
        provinces: [{ ...sweep, salaryPages: ['30000', '/evil'] }],
      }),
    ],
    [
      'salary pages that are not a list',
      JSON.stringify({ provinces: [{ ...sweep, salaryPages: '30000' }] }),
    ],
    [
      'provinces of different years',
      JSON.stringify({
        provinces: [sweep, { ...sweep, slug: 'ca-ab', year: 2025 }],
      }),
    ],
  ])('refuses %s', (_name, text) => {
    expect(parseHubChartsData(text)).toBeNull();
  });
});

const point = (salary: string): SweepPoint => [salary, '0', '0', '0', '0', '0'];

describe('the card constants', () => {
  it('starts the marker on the $70,000 point, or the first point when there is none', () => {
    const points = sweepSalaries().map((salary) => point(`${salary}.00`));
    expect(points[defaultIndex(points)]?.[0]).toBe('70000.00');
    expect(defaultIndex([point('1000.00'), point('2000.00')])).toBe(0);
  });

  it('puts the salary axis ticks inside the axis, in order', () => {
    expect(SALARY_AXIS.min).toBe('0');
    expect(SALARY_AXIS.ticks[SALARY_AXIS.ticks.length - 1]).toBe(
      SALARY_AXIS.max,
    );
  });

  it('ends the phone salary axis at the axis end', () => {
    expect(SALARY_AXIS.phoneTicks[SALARY_AXIS.phoneTicks.length - 1]).toBe(
      SALARY_AXIS.max,
    );
  });

  it('reads each chart from its own place of a point', () => {
    expect(CHART_COLUMN).toEqual({
      takeHome: 1,
      averageRate: 4,
      marginalRate: 5,
    });
  });
});

describe('the spike edges of the sweep', () => {
  // A narrow band (the Ontario Health Premium steps) is drawn at its true place and width only when the sweep has a
  // salary just before and just after each edge, because the lines join the points.
  it('has a point within $30 of both edges of every Ontario band under $700 wide, and of the second health premium step', () => {
    const [sweep] = fullHubCharts(['ca-on']).provinces;
    if (!sweep) throw new Error('no sweep');
    const salaries = sweep.points.map((point) => point[0]);
    const edges = sweep.edges.map((edge) => ({ start: edge[2], end: edge[1] }));
    const narrow = edges.flatMap((edge, at) => {
      const next = edges[at + 1];
      return next !== undefined &&
        compareAmounts(subtractAmounts(next.end, edge.start), '700') < 0
        ? [edge.start, next.end]
        : [];
    });
    expect(narrow).toHaveLength(10);
    for (const edge of [...narrow, '36329', '38854']) {
      const within = (from: string, to: string) =>
        salaries.some(
          (salary) =>
            compareAmounts(salary, from) >= 0 &&
            compareAmounts(salary, to) <= 0,
        );
      expect(within(subtractAmounts(edge, '30'), edge), `before ${edge}`).toBe(
        true,
      );
      expect(
        within(edge, subtractAmounts('30', `-${edge}`)),
        `after ${edge}`,
      ).toBe(true);
    }
  });
});
