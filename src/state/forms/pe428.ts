import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-pe/pe428');

/** Form PE428 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const pe428: FormPageSpec = {
  id: 'pe428',
  name: 'Form PE428: Prince Edward Island Tax',
  province: 'ca-pe',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form PE428: Prince Edward Island Tax, in plain words',
  description:
    'What Form PE428 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the form that works out how much income tax you owe Prince Edward Island. If you lived in Prince Edward Island at the end of the year, it is the Prince Edward Island part of your tax return.',
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
        income: result('$69,335', 'pe428_taxable_income_line_1'),
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
      lines: 'Lines 2–8',
      paragraph:
        'Prince Edward Island does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice’s rate on the rest of your income.',
      example:
        'Your income reaches the slice that starts at {start}. That slice is taxed at {rate}. The tax on the slices below it comes to {below}. The {above} of your income above {start} adds {added}. Prince Edward Island tax before credits: {tax}.',
      figures: {
        start: result('$64,656', 'pe428_bracket_lower_bound_line_3'),
        rate: result('16.6%', 'pe428_bracket_rate_line_5'),
        below: result('$7,386.04', 'pe428_bracket_tax_at_start_line_7'),
        above: result('$4,679', 'pe428_taxable_income_over_lower_bound_line_4'),
        added: result('$776.71', 'pe428_tax_on_excess_line_6'),
        tax: result('$8,162.75', 'pe428_tax_on_taxable_income_line_8'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 9–54',
      paragraph:
        'A credit lowers your tax bill. The form starts with a list of amounts. Most people get a basic personal amount ({basic} in 2025). The list also has the main part of your pension plan payments and your EI payments. The form has other amounts too, such as for a spouse, a dependant, an age amount, medical costs and student loan interest. We do not use them. The form adds the amounts up, then takes {rate} of the total. That is your discount. Gifts to charity are worked out on their own lines after that, and we do not use them.',
      example:
        'The basic amount, {cpp} for the main part of your pension plan payments and {ei} of EI payments add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: result('$14,650', 'basic_personal_amount'),
        cpp: result('$3,291.75', 'pe428_cpp_contributions_line_20'),
        ei: result('$1,077.48', 'pe428_ei_premiums_line_22'),
        total: result('$19,019.23', 'pe428_credits_total_line_48'),
        rate: printed('9.5%', '9.5% of line 48'),
        discount: result('$1,806.83', 'pe428_credits_at_rate_line_50'),
      },
    },
    {
      id: 'after-credits',
      heading: 'Your tax after credits',
      lines: 'Lines 55–67',
      paragraph:
        'Now the form takes your credits away from your tax. The tax can go down to zero, but not below it. The form has more lines here, for tax on split income, a dividend tax credit, minimum tax carryover, extra minimum tax and a reduction passed from a spouse. We do not use them.',
      example: 'Your tax of {tax} less credits of {credits} leaves {after}.',
      figures: {
        tax: result('$8,162.75', 'pe428_tax_on_taxable_income_line_8'),
        credits: result('$1,806.83', 'pe428_non_refundable_credits_line_54'),
        after: result('$6,355.92', 'pe428_tax_line_59'),
      },
    },
    {
      id: 'reduction',
      heading: 'A reduction for lower incomes',
      lines: 'Lines 68–88',
      paragraph:
        'Prince Edward Island lowers the tax of people on lower incomes. The reduction starts at {set}. The form then takes your income over {threshold} and finds {rate} of it. That amount is taken away from the reduction. If nothing is left, the reduction is zero. So the higher your income, the smaller the reduction, until it reaches zero. The form also lets a spouse, an eligible dependant, children or an age claim add to the reduction. We do not use those lines.',
      example:
        'Your income is {over} over {threshold}. {rate} of that is {clawback}, which is more than {set}, so the reduction is {reduction}.',
      figures: {
        set: result('$350', 'pe428_low_income_reductions_total_line_81'),
        threshold: result('$22,650', 'low_income_reduction_base_amount'),
        over: result('$46,685', 'pe428_income_over_base_amount_line_84'),
        rate: printed('5%', '5% of line 84'),
        clawback: result('$2,334.25', 'pe428_reduction_phase_out_line_86'),
        reduction: result('$0', 'pe428_low_income_tax_reduction_line_87'),
      },
    },
    {
      id: 'total',
      heading: 'Your Prince Edward Island tax',
      lines: 'Lines 89–97',
      paragraph:
        'The last line is your Prince Edward Island tax. It is your tax after credits, less the reduction for lower incomes, and it cannot go below zero. The total goes onto your return. The lines in between are for a foreign tax credit, a political contribution credit and equity tax credits. The last lines work out any unused reduction a spouse could claim. A separate part of the form has a credit for volunteer firefighters and search and rescue volunteers. We do not use any of them.',
      example:
        'Your tax after credits of {tax} less a reduction of {reduction} leaves your Prince Edward Island tax of {total}.',
      figures: {
        tax: result('$6,355.92', 'pe428_tax_line_67'),
        reduction: result('$0', 'pe428_low_income_tax_reduction_line_87'),
        total: result('$6,355.92', 'pe428_prince_edward_island_tax_line_97'),
      },
    },
  ],
};
