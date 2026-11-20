import { compareReferences, sortByReference } from './lineOrder';

const order = (refs: (string | null)[]) =>
  sortByReference(refs.map((reference) => ({ reference }))).map(
    (l) => l.reference,
  );

describe('line order', () => {
  it('sorts plain numbers as numbers, not as text', () => {
    expect(order(['105', '8', '63', '25700', '9'])).toEqual([
      '8',
      '9',
      '63',
      '105',
      '25700',
    ]);
  });

  it('sorts a number with a suffix by its number, then the suffix', () => {
    expect(
      order(['66 box B', '5 (column 2)', '5 (column 1)', '66 box A', '6']),
    ).toEqual(['5 (column 1)', '5 (column 2)', '6', '66 box A', '66 box B']);
  });

  it('puts a plain number before the same number with a suffix', () => {
    expect(order(['64 box A', '64'])).toEqual(['64', '64 box A']);
  });

  it('puts references with no number last, in alphabetical order', () => {
    expect(order(['B', '12', 'A', '3'])).toEqual(['3', '12', 'A', 'B']);
  });

  it('keeps the API order for equal references', () => {
    const lines = [
      { reference: '5', id: 1 },
      { reference: '5', id: 2 },
      { reference: '4', id: 3 },
    ];
    expect(sortByReference(lines).map((l) => l.id)).toEqual([3, 1, 2]);
  });

  it('puts a missing reference last', () => {
    expect(order([null, '2'])).toEqual(['2', null]);
    expect(compareReferences('', '1')).toBeGreaterThan(0);
  });
});
