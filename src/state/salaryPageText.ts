import { responseUnit } from '../adapters/fallback';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import { displayMoney, displayRate } from '../money/format';
import { strings } from '../strings';

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
 * or parsed here, and nothing is cut to fit a length.
 */
export function salaryPageText(
  response: ComputeTakeHomeCalculationResponse,
  rawPlace: string,
  year: number,
): SalaryPageText {
  const place = rawPlace.trim();
  const unit = responseUnit(response);
  const show = (amount: string) => displayMoney(amount, 'annually', unit);
  const salary = show(response.salary);
  const takeHome = show(response.take_home);
  const text = strings.pageText;
  return {
    title: text.title(salary, place, year),
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
