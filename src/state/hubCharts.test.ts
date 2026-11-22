import { parseHubChartsData, sweepSalaries } from './hubCharts';

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
  points: [['1000', '1000.00', '0.00', '0.0000', '0.0505']],
};

describe('sweepSalaries', () => {
  const steps = sweepSalaries();

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

describe('parseHubChartsData', () => {
  it('reads a block of province sweeps', () => {
    const parsed = parseHubChartsData(JSON.stringify({ provinces: [sweep] }));
    expect(parsed?.provinces[0]?.points).toEqual(sweep.points);
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
      JSON.stringify({ provinces: [{ ...sweep, points: [[1, 2, 3, 4, 5]] }] }),
    ],
    [
      'a point with four figures',
      JSON.stringify({
        provinces: [{ ...sweep, points: [['1', '2', '3', '4']] }],
      }),
    ],
    [
      'a figure that is not a decimal',
      JSON.stringify({
        provinces: [{ ...sweep, points: [['1000', '<b>', '0', '0', '0']] }],
      }),
    ],
    ['no unit', JSON.stringify({ provinces: [{ ...sweep, unit: null }] })],
    [
      'a year as text',
      JSON.stringify({ provinces: [{ ...sweep, year: '2026' }] }),
    ],
  ])('refuses %s', (_name, text) => {
    expect(parseHubChartsData(text)).toBeNull();
  });
});
