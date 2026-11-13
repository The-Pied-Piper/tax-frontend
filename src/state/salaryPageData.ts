import type { SalaryPageData } from './useTakeHome';

export const SALARY_PAGE_DATA_ID = 'salary-page-data';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** The data block is read from the page, so check its shape before trusting it. */
export function isSalaryPageData(value: unknown): value is SalaryPageData {
  return (
    isRecord(value) &&
    Array.isArray(value.jurisdictions) &&
    isRecord(value.response) &&
    typeof value.response.take_home === 'string' &&
    typeof value.jurisdictionCode === 'string' &&
    typeof value.year === 'number' &&
    typeof value.salary === 'string'
  );
}

/** The data a pre-built page carries, or undefined on any other page or a bad block. */
export function readSalaryPageData(doc: Document): SalaryPageData | undefined {
  const text = doc.getElementById(SALARY_PAGE_DATA_ID)?.textContent;
  if (!text) return undefined;
  try {
    const parsed: unknown = JSON.parse(text);
    return isSalaryPageData(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
