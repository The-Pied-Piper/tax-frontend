import compute70000 from '../api/fixtures/compute-on-2026-70000.json';
import { parseSalaryIndex, SALARY_INDEX_ID } from './salaryIndex';

const unit = compute70000.unit;

const valid = {
  groups: [
    {
      code: 'CA-ON',
      name: 'Ontario',
      unit,
      pages: [
        { salary: '30000', href: '/ca-on/30000/' },
        { salary: '35000', href: '/ca-on/35000/' },
      ],
    },
  ],
};

function parse(value: unknown) {
  return parseSalaryIndex(JSON.stringify(value));
}

function withPages(pages: unknown) {
  return { groups: [{ ...valid.groups[0], pages }] };
}

describe('parseSalaryIndex', () => {
  it('names the element it is read from', () => {
    expect(SALARY_INDEX_ID).toBe('salary-pages-index');
  });

  it('returns the index of a good block', () => {
    expect(parse(valid)).toEqual(valid);
  });

  it('accepts a block with no groups and a group with no pages', () => {
    expect(parse({ groups: [] })).toEqual({ groups: [] });
    expect(parse(withPages([]))).toEqual(withPages([]));
  });

  it('is null when there is no block or it is empty', () => {
    expect(parseSalaryIndex(null)).toBeNull();
    expect(parseSalaryIndex('')).toBeNull();
    expect(parseSalaryIndex('  ')).toBeNull();
  });

  it('is null for text that is not JSON', () => {
    expect(parseSalaryIndex('{"groups": [')).toBeNull();
    expect(parseSalaryIndex('hello')).toBeNull();
  });

  it.each([
    [null],
    [[]],
    ['text'],
    [7],
    [{}],
    [{ groups: 'x' }],
    [{ groups: {} }],
  ])('is null for JSON of the wrong shape: %j', (value) => {
    expect(parse(value)).toBeNull();
  });

  it.each([
    ['code missing', { ...valid.groups[0], code: undefined }],
    ['code not text', { ...valid.groups[0], code: 5 }],
    ['name missing', { ...valid.groups[0], name: undefined }],
    ['name not text', { ...valid.groups[0], name: ['Ontario'] }],
    ['unit missing', { ...valid.groups[0], unit: undefined }],
    ['unit not a unit', { ...valid.groups[0], unit: { name: 'CAD' } }],
    ['pages missing', { ...valid.groups[0], pages: undefined }],
    ['pages not a list', { ...valid.groups[0], pages: 'x' }],
  ])('is null when a group has %s', (_name, group) => {
    expect(parse({ groups: [group] })).toBeNull();
  });

  it('is null when one bad group is among good ones', () => {
    expect(parse({ groups: [valid.groups[0], { code: 'CA-XX' }] })).toBeNull();
  });

  it.each([
    ['salary not text', { salary: 30000, href: '/ca-on/30000/' }],
    ['salary missing', { href: '/ca-on/30000/' }],
    ['href missing', { salary: '30000' }],
    ['href not text', { salary: '30000', href: 5 }],
    ['an outside address', { salary: '30000', href: 'https://evil.test/' }],
    ['a protocol-relative address', { salary: '30000', href: '//evil.test/' }],
    ['a backslash host', { salary: '30000', href: '/\\evil.test/' }],
    ['a script address', { salary: '30000', href: 'javascript:alert(1)' }],
    ['a relative path', { salary: '30000', href: 'ca-on/30000/' }],
    ['an empty href', { salary: '30000', href: '' }],
    ['a tab in the host', { salary: '30000', href: '/\t/evil.com' }],
    ['a newline in the host', { salary: '30000', href: '/\n/evil.com' }],
    ['a carriage return', { salary: '30000', href: '/\r/x' }],
    ['a space', { salary: '30000', href: '/ /x' }],
    ['a space at the end', { salary: '30000', href: '/ca-on/30000/ ' }],
    ['a null character', { salary: '30000', href: '/\u0000/x' }],
    [
      'a salary that is markup',
      { salary: '<img src=x>', href: '/ca-on/30000/' },
    ],
    ['an empty salary', { salary: '', href: '/ca-on/30000/' }],
  ])('is null for a page with %s', (_name, page) => {
    expect(parse(withPages([page]))).toBeNull();
  });
});
