import { responseUnit } from '../adapters/fallback';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import { displayMoney, displayRate, displayWholeMoney } from '../money/format';
import { strings } from '../strings';

/** A title must be shorter than this many characters (the same limit as build/salaryPages/limits.ts). */
const TITLE_LIMIT = 60;

/** The text of one salary page, all built from that page's own answer. */
export type SalaryPageText = {
  title: string;
  description: string;
  heading: string;
  paragraph: string;
};

/**
 * Title, description, heading and paragraph for an answer. Amounts and rates
 * are shown as the API printed them (money/format.ts); nothing is calculated
 * or parsed here, and nothing is cut to fit a length (a title that is too long is replaced by the shorter wording).
 */
export function salaryPageText(
  response: ComputeTakeHomeCalculationResponse,
  rawPlace: string,
  year: number,
): SalaryPageText {
  const place = rawPlace.trim();
  const unit = responseUnit(response);
  const show = (amount: string) => displayMoney(amount, 'annually', unit);
  const salary = displayWholeMoney(response.salary, 'annually', unit);
  const takeHome = show(response.take_home);
  const text = strings.pageText;
  const fullTitle = text.title(salary, place, year);
  return {
    title:
      fullTitle.length < TITLE_LIMIT
        ? fullTitle
        : text.shortTitle(salary, place, year),
    description: text.description(salary, place, year, takeHome),
    heading: text.heading(salary, place, year),
    paragraph: text.paragraph(
      salary,
      place,
      year,
      takeHome,
      show(response.total_deductions),
      displayRate(
        response.average_income_tax_rate.amount,
        response.average_income_tax_rate.unit,
      ),
      displayRate(
        response.marginal_income_tax_rate.amount,
        response.marginal_income_tax_rate.unit,
      ),
    ),
  };
}
