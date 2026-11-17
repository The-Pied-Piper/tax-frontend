import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-bc/bc428');

/** Form BC428 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const bc428: FormPageSpec = {
  id: 'bc428',
  name: 'Form BC428: British Columbia Tax',
  province: 'ca-bc',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form BC428: British Columbia Tax, in plain words',
  description:
    'What Form BC428 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the form that works out how much income tax you owe British Columbia. If you lived in British Columbia at the end of the year, it is the British Columbia part of your tax return.',
  sections: [
    {
      id: 'income',
      heading: 'Your taxable income',
      lines: 'Line 1',
      paragraph:
        'Taxable income is the part of your pay that tax is charged on. This form does not work it out. It copies the number from the federal part of your return. Some things are taken off first, like part of your pension plan payments.',
      example:
        'Taxable income is {income}, because {taken}, the extra part of your pension plan payments, is taken off first.',
      figures: {
        income: result('$69,335', 'bc428_taxable_income_line_1'),
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
      lines: 'Lines 3–8',
      paragraph:
        'British Columbia does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the highest slice your income reaches, adds the tax on all the slices below it, then charges that slice’s rate on the rest.',
      example:
        'Your income reaches the slice that starts at {start}, taxed at {rate}. The slices below it come to {below}. The {above} above {start} adds {added}. British Columbia tax on your income: {tax}.',
      figures: {
        start: result('$49,279', 'bc428_bracket_lower_bound_line_3'),
        rate: result('7.7%', 'bc428_bracket_rate_line_5'),
        below: result('$2,493.52', 'bc428_bracket_tax_at_start_line_7'),
        above: result(
          '$20,056',
          'bc428_taxable_income_over_lower_bound_line_4',
        ),
        added: result('$1,544.31', 'bc428_bracket_tax_line_6'),
        tax: result('$4,037.83', 'bc428_tax_on_taxable_income_line_8'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 16–60',
      paragraph:
        'A credit is a discount on your tax bill. Everyone gets a basic personal amount ({basic} in 2025). You also get credit for the main part of your pension plan payments and for your EI payments. The form adds these amounts up, then takes {rate} of the total. That is your discount.',
      example:
        'The basic amount, {cpp} for the main part of your pension plan payments and {ei} of EI payments add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: result('$12,932', 'basic_personal_amount'),
        rate: printed('5.06%', '5.06% of line 54'),
        cpp: result('$3,291.75', 'bc428_cpp_contributions_line_27'),
        ei: result('$1,077.48', 'bc428_ei_premiums_line_29'),
        total: result('$17,301.23', 'bc428_total_line_54'),
        discount: result('$875.44', 'bc428_at_rate_line_56'),
      },
    },
    {
      id: 'after-credits',
      heading: 'Your tax after credits',
      lines: 'Lines 61–68',
      paragraph:
        'Now the form takes your credits away from your tax. A credit can bring your tax down to zero, but not below it.',
      example: 'Your tax of {tax} less credits of {credits} leaves {after}.',
      figures: {
        tax: result('$4,037.83', 'bc428_tax_with_split_income_line_63'),
        credits: result('$875.44', 'bc428_total_line_67'),
        after: result('$3,162.39', 'bc428_tax_after_credits_line_68'),
      },
    },
    {
      id: 'reduction',
      heading: 'Reduction for lower income',
      lines: 'Lines 73–80',
      paragraph:
        'British Columbia can reduce the tax of people on lower income. The reduction starts at {set}. The form then takes your net income above {base} and charges {rate} on it. It takes that away from the reduction. If the answer is below zero, the reduction is zero. It is also zero once your net income is high enough that this charge is bigger than the starting amount.',
      example:
        'Your net income is {over} above {base}. {rate} of that is {clawback}, which is more than {set}. The reduction is {reduction}.',
      figures: {
        set: result('$562', 'bc428_basic_reduction_line_73'),
        base: result('$25,020', 'bc428_base_amount_line_75'),
        rate: printed('3.56%', '3.56% of line 76'),
        over: result('$44,315', 'bc428_net_income_over_base_line_76'),
        clawback: result('$1,577.61', 'bc428_reduction_clawback_line_78'),
        reduction: result('$0', 'bc428_british_columbia_tax_reduction_line_79'),
      },
    },
    {
      id: 'total',
      heading: 'Your British Columbia tax',
      lines: 'Line 91',
      paragraph:
        'The last line is your British Columbia tax. It is your tax after credits and the reduction. The form has lines for other credits, like logging or political gifts. We do not use them. The total then goes onto your return.',
      example: 'Your British Columbia tax is {total}.',
      figures: {
        total: result('$3,162.39', 'bc428_british_columbia_tax_line_91'),
      },
    },
  ],
};
