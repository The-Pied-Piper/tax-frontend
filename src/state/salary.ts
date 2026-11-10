// Same rule as the API's salary field: whole dollars, or dollars with one or
// two decimals. The API also requires an amount above zero.
const SALARY_PATTERN = /^(0*[1-9][0-9]*|[0-9]+\.[0-9]{1,2})$/;
const ZERO = /^0+(\.0*)?$/;

export type SalaryCheck = 'ok' | 'empty' | 'invalid' | 'zero';

/** Checks the text with surrounding spaces trimmed; that trimmed text is what gets sent (money is text, never parsed). */
export function checkSalary(text: string): SalaryCheck {
  const value = text.trim();
  if (value === '') return 'empty';
  if (ZERO.test(value)) return 'zero';
  if (!SALARY_PATTERN.test(value)) return 'invalid';
  return 'ok';
}
