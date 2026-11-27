import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-ns/ns428');
const income = figuresOf('ca/t1_taxable_income');

/** Form NS428 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const ns428: FormPageSpec = {
  id: 'ns428',
  name: 'Form NS428: Nova Scotia Tax',
  province: 'ca-ns',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form NS428: Nova Scotia Tax, in plain words',
  description:
    'What Form NS428 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the form that works out how much income tax you owe Nova Scotia. If you lived in Nova Scotia at the end of the year, it is the Nova Scotia part of your tax return.',
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
        income: result('$69,335', 'ns428_taxable_income_line_1'),
        taken: income.result('$665', 'deductions_from_total_income'),
      },
    },
    {
      id: 'brackets',
      heading: 'Tax on your income, slice by slice',
      lines: 'Lines 2–8',
      paragraph:
        'Nova Scotia does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice’s rate on the rest of your income.',
      example:
        'Your income reaches the slice that starts at {start}. That slice is taxed at {rate}. The tax on the slices below it comes to {below}. The {above} of your income above {start} adds {added}. Nova Scotia tax before credits: {tax}.',
      figures: {
        start: result('$61,015', 'ns428_bracket_lower_bound_line_3'),
        rate: result('16.67%', 'ns428_bracket_rate_line_5'),
        below: result('$7,242.51', 'ns428_bracket_tax_at_start_line_7'),
        above: result('$8,320', 'ns428_taxable_income_over_lower_bound_line_4'),
        added: result('$1,386.94', 'ns428_tax_on_excess_line_6'),
        tax: result('$8,629.45', 'ns428_tax_on_taxable_income_line_8'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 9–52',
      paragraph:
        'A credit lowers your tax bill. The form starts with a list of amounts. Most people get a basic personal amount ({basic} in 2025). The list also has the main part of your pension plan payments and your EI payments. The form has other amounts too, such as for a spouse, a dependant, an age amount, medical costs and student loan interest. We do not use them. The form adds the amounts up, then takes {rate} of the total. That is your discount. Gifts to charity are worked out on their own lines after that, and we do not use them.',
      example:
        'The basic amount, {cpp} for the main part of your pension plan payments and {ei} of EI payments add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: result('$11,744', 'basic_personal_amount'),
        cpp: result('$3,291.75', 'ns428_cpp_contributions_line_21'),
        ei: result('$1,077.48', 'ns428_ei_premiums_line_23'),
        total: result('$16,113.23', 'ns428_credits_total_line_46'),
        rate: printed('8.79%', '8.79% of line 46'),
        discount: result('$1,416.35', 'ns428_credits_at_rate_line_48'),
      },
    },
    {
      id: 'after-credits',
      heading: 'Your tax after credits',
      lines: 'Lines 53–64',
      paragraph:
        'Now the form takes your credits away from your tax. The tax can go down to zero, but not below it. The form has more lines here, for tax on split income, a dividend tax credit, minimum tax and a foreign tax credit. We do not use them.',
      example: 'Your tax of {tax} less credits of {credits} leaves {after}.',
      figures: {
        tax: result('$8,629.45', 'ns428_tax_line_55'),
        credits: result('$1,416.35', 'ns428_non_refundable_credits_line_52'),
        after: result('$7,213.10', 'ns428_tax_after_credits_line_64'),
      },
    },
    {
      id: 'reduction',
      heading: 'A reduction for lower incomes',
      lines: 'Lines 65–85',
      paragraph:
        'Nova Scotia lowers the tax of people on lower incomes. The reduction starts at {set}. The form then takes your income over {threshold} and finds {rate} of it. That amount is taken away from the reduction. If nothing is left, the reduction is zero. So the higher your income, the smaller the reduction, until it reaches zero. The form also lets a spouse, an eligible dependant or children add to the reduction. We do not use those lines.',
      example:
        'Your income is {over} over {threshold}. {rate} of that is {clawback}, which is more than {set}, so the reduction is {reduction}.',
      figures: {
        set: result('$300', 'ns428_low_income_reduction_line_74'),
        threshold: result('$15,000', 'low_income_reduction_base_amount'),
        over: result('$54,335', 'ns428_line_81'),
        rate: printed('5%', '5% of line 81'),
        clawback: result('$2,716.75', 'ns428_line_83'),
        reduction: result('$0', 'ns428_low_income_reduction_line_84'),
      },
    },
    {
      id: 'total',
      heading: 'Your Nova Scotia tax',
      lines: 'Lines 86–99',
      paragraph:
        'The last line is your Nova Scotia tax. It is your tax after credits, less the reduction for lower incomes, and it cannot go below zero. The total goes onto your return. The lines in between are for a political contribution credit, a food bank credit for farmers and investment credits. There is also a credit for people born in 1959 or earlier with a low income. We do not use them.',
      example:
        'Your tax after credits of {tax} less a reduction of {reduction} leaves your Nova Scotia tax of {total}.',
      figures: {
        tax: result('$7,213.10', 'ns428_tax_after_credits_line_64'),
        reduction: result('$0', 'ns428_low_income_reduction_line_84'),
        total: result('$7,213.10', 'ns428_nova_scotia_tax_line_99'),
      },
    },
  ],
};
