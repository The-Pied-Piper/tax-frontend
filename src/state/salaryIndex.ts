import type { Unit } from '../adapters';
import { toCents } from '../money/payPeriod';
import type { SalaryPageLink } from './useTakeHome';
import { isRecord, isSitePath, isUnit } from './salaryPageData';

export const SALARY_INDEX_ID = 'salary-pages-index';

/** One province's pre-built pages, lowest salary first. */
export type SalaryIndexGroup = {
  /** The API's jurisdiction code. */
  code: string;
  name: string;
  unit: Unit;
  pages: SalaryPageLink[];
};

/** Every pre-built page of the site, by province: the one list of links. */
export type SalaryIndex = { groups: SalaryIndexGroup[] };

function isMoneyText(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    toCents(value);
    return true;
  } catch {
    return false;
  }
}

function isPage(value: unknown): value is SalaryPageLink {
  return isRecord(value) && isMoneyText(value.salary) && isSitePath(value.href);
}

function isGroup(value: unknown): value is SalaryIndexGroup {
  return (
    isRecord(value) &&
    typeof value.code === 'string' &&
    typeof value.name === 'string' &&
    isUnit(value.unit) &&
    Array.isArray(value.pages) &&
    value.pages.every(isPage)
  );
}

function isSalaryIndex(value: unknown): value is SalaryIndex {
  return (
    isRecord(value) &&
    Array.isArray(value.groups) &&
    value.groups.every(isGroup)
  );
}

/**
 * The text of the index data block, checked before it is trusted, or null for
 * no block, text that is not JSON, or a shape the page does not expect.
 */
export function parseSalaryIndex(text: string | null): SalaryIndex | null {
  if (text === null || text.trim() === '') return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return isSalaryIndex(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
