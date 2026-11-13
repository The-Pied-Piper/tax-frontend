import {
  salaryPageText,
  type SalaryPageText,
} from '../../src/state/salaryPageText';
import type { SalaryPageData } from '../../src/state/useTakeHome';

export type PageMeta = SalaryPageText;

/** The text of one pre-built page: place name from the province list, year from the data. */
export function pageMeta(data: SalaryPageData): PageMeta {
  const place =
    data.jurisdictions.find((j) => j.code === data.jurisdictionCode)?.name ??
    data.jurisdictionCode;
  return salaryPageText(
    data.response,
    place.trim() || data.jurisdictionCode,
    data.year,
  );
}
