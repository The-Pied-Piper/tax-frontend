import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-mb/mb428_credits');
const main = figuresOf('ca-mb/mb428');
const sheet = figuresOf('ca-mb/worksheet_mb428');

/** Form MB428 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const mb428: FormPageSpec = {
  id: 'mb428',
  name: 'Form MB428: Manitoba Tax',
  province: 'ca-mb',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form MB428: Manitoba Tax, in plain words',
  description:
    'What Form MB428 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the form that works out how much income tax you owe Manitoba. If you lived in Manitoba at the end of the year, it is the Manitoba part of your tax return.',
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
        income: result('$69,335', 'mb428_taxable_income_line_1'),
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
        'Manitoba does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice’s rate on the rest of your income.',
      example:
        'Your income reaches the slice that starts at {start}. That slice is taxed at {rate}. The tax on the slices below it comes to {below}. The {above} of your income above {start} adds {added}. Manitoba tax before credits: {tax}.',
      figures: {
        start: result('$47,000', 'mb428_bracket_lower_bound_line_3'),
        rate: result('12.75%', 'mb428_bracket_rate_line_5'),
        below: result('$5,076', 'mb428_bracket_tax_at_start_line_7'),
        above: result(
          '$22,335',
          'mb428_taxable_income_over_lower_bound_line_4',
        ),
        added: result('$2,847.71', 'mb428_tax_on_excess_line_6'),
        tax: result('$7,923.71', 'mb428_tax_on_taxable_income_line_8'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 9–57',
      paragraph:
        'A credit lowers your tax bill. The form starts with a list of amounts. Most people get a basic personal amount ({basic} in 2025). It shrinks at high incomes and is zero at very high ones. The list also has the main part of your pension plan payments and your EI payments. The form has other amounts too, such as medical costs and tuition. We do not use them. The form adds the amounts up, then takes {rate} of the total. That is your discount. One line is for the Family Tax Benefit, which comes from its own schedule and is added to the list before the discount is worked out. Gifts to charity are worked out separately after that, and we do not use them.',
      example:
        'The basic amount, {cpp} for the main part of your pension plan payments and {ei} of EI payments add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: result('$15,780', 'mb428_basic_personal_amount_line_9'),
        rate: printed('10.8%', '10.8% of line 51'),
        cpp: result('$3,291.75', 'mb428_cpp_contributions_line_19'),
        ei: result('$1,077.48', 'mb428_ei_premiums_line_21'),
        total: result('$20,149.23', 'mb428_credits_total_line_51'),
        discount: result('$2,176.12', 'mb428_credits_at_rate_line_53'),
      },
    },
    {
      id: 'basic-amount',
      heading: 'The basic personal amount worksheet',
      lines: 'Line 9',
      paragraph:
        'Line 9 of the form is the basic personal amount, and it comes from a short worksheet. The full amount is {full}. If your net income is under {threshold}, the worksheet sends you straight to the full amount. Net income is the amount on line 23600 of your return. If it is {threshold} or more, the worksheet takes part of the amount off. It divides the part of your net income above {threshold} by {range}. That share of the full amount is taken off, so the amount shrinks as income grows, and it is zero at very high incomes. The result goes onto line 9.',
      example:
        'Your net income is {income}. That is under {threshold}, so you keep the full {basic}.',
      figures: {
        full: sheet.result('$15,780', 'worksheet_mb428_line_1'),
        threshold: sheet.result('$200,000', 'worksheet_mb428_line_3'),
        range: sheet.result('$200,000', 'worksheet_mb428_line_5'),
        income: sheet.result('$69,335', 'worksheet_mb428_line_2'),
        basic: sheet.result(
          '$15,780',
          'worksheet_mb428_basic_personal_amount_line_9',
        ),
      },
    },
    {
      id: 'after-credits',
      heading: 'Your tax after credits',
      lines: 'Lines 58–65',
      paragraph:
        'Now the form takes your credits away from your tax. The tax can go down to zero, but not below it. The form has a few more lines here, for tax on split income, the dividend tax credit and a minimum tax carryover. We do not use them.',
      example: 'Your tax of {tax} less credits of {credits} leaves {after}.',
      figures: {
        tax: main.result('$7,923.71', 'mb428_tax_before_credits_line_60'),
        credits: main.result('$2,176.12', 'mb428_credits_total_line_64'),
        after: main.result('$5,747.59', 'mb428_tax_after_credits_line_65'),
      },
    },
    {
      id: 'total',
      heading: 'Your Manitoba tax',
      lines: 'Lines 66–82',
      paragraph:
        'The last line is your Manitoba tax. The lines before it cover extra tax for minimum tax purposes, and credits like political contributions, a foreign tax credit and investing in a Manitoba business. We do not use them. The total then goes onto your return. Manitoba’s refundable credits are on a different form, Form MB479, and do not go here.',
      example: 'Your Manitoba tax is {total}.',
      figures: {
        total: main.result('$5,747.59', 'mb428_manitoba_tax_line_82'),
      },
    },
  ],
};
