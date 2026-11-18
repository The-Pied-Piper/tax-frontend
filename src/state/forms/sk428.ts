import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-sk/sk428_credits');
const main = figuresOf('ca-sk/sk428');

/** Form SK428 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const sk428: FormPageSpec = {
  id: 'sk428',
  name: 'Form SK428: Saskatchewan Tax',
  province: 'ca-sk',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form SK428: Saskatchewan Tax, in plain words',
  description:
    'What Form SK428 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the form that works out how much income tax you owe Saskatchewan. If you lived in Saskatchewan at the end of the year, it is the Saskatchewan part of your tax return.',
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
        income: result('$69,335', 'sk428_taxable_income_line_1'),
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
        'Saskatchewan does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice’s rate on the rest of your income.',
      example:
        'Your income reaches the slice that starts at {start}. That slice is taxed at {rate}. The tax on the slices below it comes to {below}. The {above} of your income above {start} adds {added}. Saskatchewan tax before credits: {tax}.',
      figures: {
        start: result('$53,463', 'sk428_bracket_lower_bound_line_3'),
        rate: result('12.5%', 'sk428_bracket_rate_line_5'),
        below: result('$5,613.62', 'sk428_bracket_tax_at_start_line_7'),
        above: result(
          '$15,872',
          'sk428_taxable_income_over_lower_bound_line_4',
        ),
        added: result('$1,984', 'sk428_tax_on_excess_line_6'),
        tax: result('$7,597.62', 'sk428_tax_on_taxable_income_line_8'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 9–57',
      paragraph:
        'A credit lowers your tax bill. The form starts with a list of amounts. Most people get a basic personal amount ({basic} in 2025). The list also has the main part of your pension plan payments and your EI payments. The form has other amounts too, such as for a spouse, children, medical costs and tuition. We do not use them. The form adds the amounts up, then takes {rate} of the total. That is your discount. Gifts to charity are worked out separately after that, and we do not use them.',
      example:
        'The basic amount, {cpp} for the main part of your pension plan payments and {ei} of EI payments add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: result('$19,491', 'basic_personal_amount'),
        rate: printed('10.5%', '10.5% of line 51'),
        cpp: result('$3,291.75', 'sk428_cpp_contributions_line_22'),
        ei: result('$1,077.48', 'sk428_ei_premiums_line_24'),
        total: result('$23,860.23', 'sk428_credits_total_line_51'),
        discount: result('$2,505.32', 'sk428_credits_at_rate_line_53'),
      },
    },
    {
      id: 'after-credits',
      heading: 'Your tax after credits',
      lines: 'Lines 58–67',
      paragraph:
        'Now the form takes your credits away from your tax. The tax can go down to zero, but not below it. The form has a few more lines here, for a farm capital gains credit, tax on split income, the dividend tax credit and a minimum tax carryover. We do not use them.',
      example: 'Your tax of {tax} less credits of {credits} leaves {after}.',
      figures: {
        tax: main.result('$7,597.62', 'sk428_tax_line_62'),
        credits: main.result('$2,505.32', 'sk428_credits_subtotal_line_66'),
        after: main.result('$5,092.30', 'sk428_tax_after_credits_line_67'),
      },
    },
    {
      id: 'total',
      heading: 'Your Saskatchewan tax',
      lines: 'Lines 68–82',
      paragraph:
        'The last line is your Saskatchewan tax. The lines before it cover extra tax for minimum tax purposes, and credits like a foreign tax credit, political contributions, investing in labour-sponsored venture capital corporations, mineral exploration and graduate tuition. We do not use them. The total then goes onto your return.',
      example: 'Your Saskatchewan tax is {total}.',
      figures: {
        total: main.result('$5,092.30', 'sk428_saskatchewan_tax_line_82'),
      },
    },
  ],
};
