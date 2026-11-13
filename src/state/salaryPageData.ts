import type { SalaryPageData } from './useTakeHome';

export const SALARY_PAGE_DATA_ID = 'salary-page-data';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isUnit(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    (value.placement === 'before' || value.placement === 'after') &&
    typeof value.singular === 'string' &&
    typeof value.plural === 'string' &&
    typeof value.spaced === 'boolean' &&
    typeof value.as_percentage === 'boolean'
  );
}

function isRate(value: unknown): boolean {
  return (
    isRecord(value) && typeof value.amount === 'string' && isUnit(value.unit)
  );
}

function isResponse(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.salary === 'string' &&
    typeof value.total_deductions === 'string' &&
    typeof value.take_home === 'string' &&
    isUnit(value.unit) &&
    isRate(value.average_income_tax_rate) &&
    isRate(value.marginal_income_tax_rate)
  );
}

function isJurisdiction(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.years) &&
    value.years.every((y: unknown) => isRecord(y) && typeof y.year === 'number')
  );
}

/** A path on this site: one leading slash, not a protocol-relative or outside address, no whitespace or control characters. */
export function isSitePath(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    /^\/(?![/\\])(?!.*\s)[\u0021-\uffff]*$/.test(value)
  );
}

function isLink(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.salary === 'string' &&
    isSitePath(value.href)
  );
}

function isLinks(value: unknown): boolean {
  return (
    isRecord(value) &&
    isSitePath(value.calculator) &&
    (value.previous === null || isLink(value.previous)) &&
    (value.next === null || isLink(value.next)) &&
    Array.isArray(value.others) &&
    value.others.every(isLink)
  );
}

function isSalaryPageData(value: unknown): value is SalaryPageData {
  return (
    isRecord(value) &&
    Array.isArray(value.jurisdictions) &&
    value.jurisdictions.every(isJurisdiction) &&
    isResponse(value.response) &&
    typeof value.jurisdictionCode === 'string' &&
    typeof value.year === 'number' &&
    typeof value.salary === 'string' &&
    (value.links === undefined || isLinks(value.links))
  );
}

/**
 * The text of a pre-built page's data block, checked before it is trusted, or
 * null for no block, text that is not JSON, or a shape the page does not expect.
 */
export function parseSalaryPageData(
  text: string | null,
): SalaryPageData | null {
  if (text === null || text.trim() === '') return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return isSalaryPageData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
