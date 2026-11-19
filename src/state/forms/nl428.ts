import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-nl/nl428_credits');
const main = figuresOf('ca-nl/nl428');

/** Form NL428 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const nl428: FormPageSpec = {
  id: 'nl428',
  name: 'Form NL428: Newfoundland and Labrador Tax',
  province: 'ca-nl',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form NL428: Newfoundland and Labrador Tax, in plain words',
  description:
    'What Form NL428 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the form that works out how much income tax you owe Newfoundland and Labrador. If you lived in Newfoundland and Labrador at the end of the year, it is the Newfoundland and Labrador part of your tax return.',
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
        income: result('$69,335', 'nl428_taxable_income_line_1'),
        taken: result(
          '$665',
          'deductions_from_total_income',
          'ca/t1_taxable_income',
        ),
      },
    },
    {
      id: 'brackets',
      heading: 'Tax on your income, slice by slice',
      lines: 'Lines 2–15',
      paragraph:
        'Newfoundland and Labrador does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice’s rate on the rest of your income.',
      example:
        'Your income reaches the slice that starts at {start}. That slice is taxed at {rate}. The tax on the slices below it comes to {below}. The {above} of your income above {start} adds {added}. Newfoundland and Labrador tax before credits: {tax}.',
      figures: {
        start: result('$44,192', 'nl428_bracket_lower_bound_line_3'),
        rate: result('14.5%', 'nl428_bracket_rate_line_5'),
        below: result('$3,844.70', 'nl428_bracket_tax_at_start_line_7'),
        above: result(
          '$25,143',
          'nl428_taxable_income_over_lower_bound_line_4',
        ),
        added: result('$3,645.74', 'nl428_tax_on_excess_line_6'),
        tax: result('$7,490.44', 'nl428_tax_on_taxable_income_line_8'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 16–62',
      paragraph:
        'A credit lowers your tax bill. The form starts with a list of amounts. Most people get a basic personal amount ({basic} in 2025). The list also has the main part of your pension plan payments and your EI payments. The form has other amounts too, such as for a spouse, a dependant, medical costs and tuition. We do not use them. The form adds the amounts up, then takes {rate} of the total. That is your discount. Gifts to charity are worked out on their own lines after that, and we do not use them.',
      example:
        'The basic amount, {cpp} for the main part of your pension plan payments and {ei} of EI payments add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: result('$11,067', 'basic_personal_amount'),
        rate: printed('8.7%', '8.7% of line 56'),
        cpp: result('$3,291.75', 'nl428_cpp_contributions_line_27'),
        ei: result('$1,077.48', 'nl428_ei_premiums_line_29'),
        total: result('$15,436.23', 'nl428_credits_total_line_56'),
        discount: result('$1,342.95', 'nl428_credits_at_rate_line_58'),
      },
    },
    {
      id: 'after-credits',
      heading: 'Your tax after credits',
      lines: 'Lines 63–85',
      paragraph:
        'Now the form takes your credits away from your tax. The tax can go down to zero, but not below it. The form has more lines here, for tax on split income, the dividend tax credit, minimum tax, a foreign tax credit, political contributions and a few investment credits. We do not use them.',
      example: 'Your tax of {tax} less credits of {credits} leaves {after}.',
      figures: {
        tax: main.result('$7,490.44', 'nl428_tax_before_credits_line_65'),
        credits: main.result('$1,342.95', 'nl428_credits_total_line_69'),
        after: main.result('$6,147.49', 'nl428_tax_line_70'),
      },
    },
    {
      id: 'reduction',
      heading: 'A reduction for lower incomes',
      lines: 'Lines 86–104',
      paragraph:
        'Newfoundland and Labrador lowers the tax of people on lower incomes. The reduction starts at {set}. The form then takes your income over {threshold} and finds {rate} of it. That amount is taken away from the reduction. If nothing is left, the reduction is zero. So the higher your income, the smaller the reduction, until it reaches zero. The form also lets a spouse or an eligible dependant add to the reduction, and lets one spouse claim what the other did not use. We do not use those lines.',
      example:
        'Your income is {over} over {threshold}. {rate} of that is {clawback}, which is more than {set}, so the reduction is {reduction}.',
      figures: {
        set: main.result('$997', 'low_income_reduction_basic'),
        threshold: main.result(
          '$23,928',
          'nl428_low_income_threshold_line_100',
        ),
        over: main.result('$45,407', 'nl428_line_101'),
        rate: main.printed('16%', '16% of line 101'),
        clawback: main.result('$7,265.12', 'nl428_line_103'),
        reduction: main.result('$0', 'nl428_line_104'),
      },
    },
    {
      id: 'total',
      heading: 'Your Newfoundland and Labrador tax',
      lines: 'Lines 105–108',
      paragraph:
        'The last line is your Newfoundland and Labrador tax. It is your tax after credits, less the reduction for lower incomes, and it cannot go below zero. The total goes onto your return. The lines after it work out an unused amount that a spouse could claim. We do not use them.',
      example:
        'Your tax after credits of {tax} less a reduction of {reduction} leaves your Newfoundland and Labrador tax of {total}.',
      figures: {
        tax: main.result('$6,147.49', 'nl428_tax_line_87'),
        reduction: main.result('$0', 'nl428_line_104'),
        total: main.result(
          '$6,147.49',
          'nl428_newfoundland_and_labrador_tax_line_105',
        ),
      },
    },
  ],
};
