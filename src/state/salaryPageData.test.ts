import type { ComputeTakeHomeCalculationResponse } from '../api';
import computeFixture from '../api/fixtures/compute-on-2026-70000.json';
import jurisdictions from '../api/fixtures/jurisdictions.json';
import { parseSalaryPageData, SALARY_PAGE_DATA_ID } from './salaryPageData';

const response = computeFixture as ComputeTakeHomeCalculationResponse;

const valid = {
  jurisdictions: jurisdictions.jurisdictions,
  response,
  jurisdictionCode: 'CA-ON',
  year: 2026,
  salary: '70000',
};

function parse(value: unknown) {
  return parseSalaryPageData(JSON.stringify(value));
}

describe('parseSalaryPageData', () => {
  it('names the element it is read from', () => {
    expect(SALARY_PAGE_DATA_ID).toBe('salary-page-data');
  });

  it('returns the data of a good block', () => {
    expect(parse(valid)).toEqual(valid);
  });

  it('is null when there is no block or it is empty', () => {
    expect(parseSalaryPageData(null)).toBeNull();
    expect(parseSalaryPageData('')).toBeNull();
    expect(parseSalaryPageData('   ')).toBeNull();
  });

  it('is null for text that is not JSON', () => {
    expect(parseSalaryPageData('{"jurisdictions": [')).toBeNull();
    expect(parseSalaryPageData('hello')).toBeNull();
  });

  it('is null for JSON that is not an object', () => {
    expect(parse(null)).toBeNull();
    expect(parse([])).toBeNull();
    expect(parse('70000')).toBeNull();
    expect(parse(7)).toBeNull();
  });

  it('is null when a field has the wrong type', () => {
    expect(parse({ ...valid, year: '2026' })).toBeNull();
    expect(parse({ ...valid, salary: 70000 })).toBeNull();
    expect(parse({ ...valid, jurisdictionCode: 5 })).toBeNull();
    expect(parse({ ...valid, jurisdictions: {} })).toBeNull();
    expect(parse({ ...valid, response: 'x' })).toBeNull();
  });

  it('is null when a field is missing', () => {
    const without = Object.fromEntries(
      Object.entries(valid).filter(([key]) => key !== 'salary'),
    );
    expect(parse(without)).toBeNull();
  });

  it('is null when the response has only take_home', () => {
    expect(parse({ ...valid, response: { take_home: '1' } })).toBeNull();
  });

  it.each([
    'salary',
    'total_deductions',
    'take_home',
    'unit',
    'average_income_tax_rate',
    'marginal_income_tax_rate',
  ])('is null when the response lacks %s', (field) => {
    const broken = Object.fromEntries(
      Object.entries(response).filter(([key]) => key !== field),
    );
    expect(parse({ ...valid, response: broken })).toBeNull();
  });

  it('is null when a rate has no text amount', () => {
    expect(
      parse({
        ...valid,
        response: {
          ...response,
          average_income_tax_rate: { amount: 0.1591, unit: response.unit },
        },
      }),
    ).toBeNull();
    expect(
      parse({
        ...valid,
        response: { ...response, marginal_income_tax_rate: 'high' },
      }),
    ).toBeNull();
  });

  it('is null when an amount is a number, so money never turns to a float', () => {
    expect(
      parse({ ...valid, response: { ...response, take_home: 53786.25 } }),
    ).toBeNull();
  });

  it('is null when a jurisdiction entry is hostile or malformed', () => {
    expect(parse({ ...valid, jurisdictions: [null] })).toBeNull();
    expect(parse({ ...valid, jurisdictions: [7] })).toBeNull();
    expect(
      parse({ ...valid, jurisdictions: [{ code: 'CA-ON', name: 'Ontario' }] }),
    ).toBeNull();
    expect(
      parse({
        ...valid,
        jurisdictions: [{ code: 'CA-ON', name: 'Ontario', years: [null] }],
      }),
    ).toBeNull();
  });
});

describe('parseSalaryPageData links (#81)', () => {
  const links = {
    calculator: '/',
    previous: { salary: '65000', href: '/ca-on/65000/' },
    next: { salary: '75000', href: '/ca-on/75000/' },
    others: [{ salary: '60000', href: '/ca-on/60000/' }],
  };

  it('keeps good links', () => {
    expect(parse({ ...valid, links })).toEqual({ ...valid, links });
  });

  it('still accepts a block with no links, as written before', () => {
    expect(parse(valid)).toEqual(valid);
  });

  it('accepts no neighbour on either end', () => {
    const ends = { ...links, previous: null, next: null, others: [] };
    expect(parse({ ...valid, links: ends })).toEqual({
      ...valid,
      links: ends,
    });
  });

  it.each([
    ['not an object', 'x'],
    ['null', null],
    ['no calculator', { ...links, calculator: undefined }],
    ['calculator not text', { ...links, calculator: 1 }],
    ['previous missing', { ...links, previous: undefined }],
    ['previous not a link', { ...links, previous: '65000' }],
    ['link without href', { ...links, next: { salary: '75000' } }],
    ['link salary not text', { ...links, next: { salary: 75000, href: '/' } }],
    ['others not a list', { ...links, others: {} }],
    ['others holding a non-link', { ...links, others: [null] }],
  ])('is null when links are bad: %s', (_why, bad) => {
    expect(parse({ ...valid, links: bad })).toBeNull();
  });
});
