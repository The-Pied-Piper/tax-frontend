import { figuresOf, type FormPageSpec } from '../formPage';

const { pending } = figuresOf('ca-nb/nb428');
const income = figuresOf('ca/t1_taxable_income');

/**
 * Form NB428 in plain words. Every figure is pending: the engine cannot compute this province's return for
 * the site yet, so there is no saved answer. Each names the engine step that will give it; they become `result` and
 * `printed` figures, at a $70,000 salary, when the saved answer is added.
 */
export const nb428: FormPageSpec = {
  id: 'nb428',
  name: 'Form NB428: New Brunswick Tax',
  province: 'ca-nb',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form NB428: New Brunswick Tax, in plain words',
  description:
    'What Form NB428 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the form that works out how much income tax you owe New Brunswick. If you lived in New Brunswick at the end of the year, it is the New Brunswick part of your tax return.',
  sections: [
    {
      id: 'income',
      heading: 'Your taxable income',
      lines: 'Line 1',
      paragraph:
        'Taxable income is the part of your income that tax is charged on. This form does not work it out. It copies the number from the federal part of your return. Some things are taken off first, like part of your pension plan payments.',
      example:
        '{taken}, the extra part of your pension plan payments, is taken off first. That leaves a taxable income of {income}.',
      figures: {
        income: pending('nb428_taxable_income_line_1'),
        taken: income.pending('deductions_from_total_income'),
      },
    },
    {
      id: 'brackets',
      heading: 'Tax on your income, slice by slice',
      lines: 'Lines 2–8',
      paragraph:
        'New Brunswick does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice’s rate on the rest of your income.',
      example:
        'Your income reaches the slice that starts at {start}. That slice is taxed at {rate}. The tax on the slices below it comes to {below}. The {above} of your income above {start} adds {added}. New Brunswick tax before credits: {tax}.',
      figures: {
        start: pending('nb428_bracket_lower_bound_line_3'),
        rate: pending('nb428_bracket_rate_line_5'),
        below: pending('nb428_bracket_tax_at_start_line_7'),
        above: pending('nb428_taxable_income_over_lower_bound_line_4'),
        added: pending('nb428_tax_on_excess_line_6'),
        tax: pending('nb428_tax_on_taxable_income_line_8'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 9–53',
      paragraph:
        'A credit lowers your tax bill. The form starts with a list of amounts. Most people get a basic personal amount ({basic} in 2025). The list also has the main part of your pension plan payments and your EI payments. The form has other amounts too, such as for a spouse, a dependant, medical costs and tuition. We do not use them. The form adds the amounts up, then takes {rate} of the total. That is your discount. Gifts to charity are worked out on their own lines after that, and we do not use them.',
      example:
        'The basic amount, {cpp} for the main part of your pension plan payments and {ei} of EI payments add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: pending('basic_personal_amount'),
        cpp: pending('nb428_cpp_contributions_line_19'),
        ei: pending('nb428_ei_premiums_line_21'),
        total: pending('nb428_credits_total_line_47'),
        rate: pending('nb428_credits_at_rate_line_49'),
        discount: pending('nb428_credits_at_rate_line_49'),
      },
    },
    {
      id: 'after-credits',
      heading: 'Your tax after credits',
      lines: 'Lines 54–67',
      paragraph:
        'Now the form takes your credits away from your tax. The tax can go down to zero, but not below it. The form has more lines here, for tax on split income, a dividend tax credit, minimum tax and a foreign tax credit. We do not use them.',
      example: 'Your tax of {tax} less credits of {credits} leaves {after}.',
      figures: {
        tax: pending('nb428_tax_before_credits_line_56'),
        credits: pending('nb428_non_refundable_credits_line_53'),
        after: pending('nb428_tax_line_67'),
      },
    },
    {
      id: 'reduction',
      heading: 'A reduction for lower incomes',
      lines: 'Lines 68–87',
      paragraph:
        'New Brunswick lowers the tax of people on lower incomes. The form gives it to a single person whose net income is under {limit}, and to some people with a spouse or a child. We use the single rule. The reduction starts at {set}. The form then takes your income over {threshold} and finds {rate} of it. That amount is taken away from the reduction. If nothing is left, the reduction is zero. So the higher your income, the smaller the reduction, until it reaches zero. The form also lets a spouse or an eligible dependant add to the reduction, and lets one spouse claim what the other did not use. We do not use those lines.',
      example:
        'Your income is {over} over {threshold}. {rate} of that is {clawback}, which is more than {set}, and your income is over {limit}, so the reduction is {reduction}.',
      figures: {
        limit: pending('low_income_reduction_single_income_limit'),
        set: pending('nb428_low_income_reduction_line_80'),
        threshold: pending('low_income_reduction_base_amount'),
        over: pending('nb428_line_83'),
        rate: pending('nb428_line_85'),
        clawback: pending('nb428_line_85'),
        reduction: pending('nb428_line_86'),
      },
    },
    {
      id: 'total',
      heading: 'Your New Brunswick tax',
      lines: 'Lines 88–97',
      paragraph:
        'The last line is your New Brunswick tax. It is your tax after credits, less the reduction for lower incomes, and it cannot go below zero. The total goes onto your return. The lines in between work out an unused amount a spouse could claim, a political contribution credit and two investment credits. We do not use them.',
      example:
        'Your tax after credits of {tax} less a reduction of {reduction} leaves your New Brunswick tax of {total}.',
      figures: {
        tax: pending('nb428_tax_line_67'),
        reduction: pending('nb428_line_86'),
        total: pending('nb428_tax_line_87'),
      },
    },
  ],
};
