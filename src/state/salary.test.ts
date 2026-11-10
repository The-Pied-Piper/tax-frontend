import { checkSalary } from './salary';

describe('checkSalary', () => {
  it.each([
    ['70000', 'ok'],
    ['70000.00', 'ok'],
    ['70000.5', 'ok'],
    ['0.50', 'ok'],
    ['007', 'ok'],
    [' 70000 ', 'ok'],
    ['', 'empty'],
    ['   ', 'empty'],
    ['70,000', 'invalid'],
    ['$70000', 'invalid'],
    ['70000.', 'invalid'],
    ['.5', 'invalid'],
    ['70000.123', 'invalid'],
    ['-5', 'invalid'],
    ['1e5', 'invalid'],
    ['abc', 'invalid'],
    ['0', 'zero'],
    ['0.00', 'zero'],
    ['000', 'zero'],
    ['0.0', 'zero'],
  ])('%j is %s', (text, expected) => {
    expect(checkSalary(text)).toBe(expected);
  });
});
