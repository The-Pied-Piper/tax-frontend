// Same rule as the API's salary field: whole dollars, or dollars with one or
// two decimals. The API also requires an amount above zero.
const SALARY_PATTERN = /^(0*[1-9][0-9]*|[0-9]+\.[0-9]{1,2})$/;
const ONLY_ZEROS = /^[0.]*$/;

export type SalaryCheck = 'ok' | 'empty' | 'invalid' | 'zero';

/** Checks the text as typed; the text itself is sent unchanged (money is text). */
export function checkSalary(text: string): SalaryCheck {
  const value = text.trim();
  if (value === '') return 'empty';
  if (!SALARY_PATTERN.test(value)) return 'invalid';
  if (ONLY_ZEROS.test(value)) return 'zero';
  return 'ok';
}
