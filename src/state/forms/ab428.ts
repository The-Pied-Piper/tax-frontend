import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-ab/ab428_credits');
const sheet = figuresOf('ca-ab/worksheet_ab428');
const main = figuresOf('ca-ab/ab428');

/** Form AB428 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const ab428: FormPageSpec = {
  id: 'ab428',
  name: 'Form AB428: Alberta Tax',
  province: 'ca-ab',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form AB428: Alberta Tax, in plain words',
  description:
    'What Form AB428 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the form that works out how much income tax you owe Alberta. If you lived in Alberta at the end of the year, it is the Alberta part of your tax return. A small worksheet goes with it.',
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
        income: result('$69,335', 'ab428_taxable_income_line_1'),
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
        'Alberta does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the highest slice your income reaches, adds the tax on all the slices below it, then charges that slice’s rate on the rest.',
      example:
        'Your income reaches the slice that starts at {start}, taxed at {rate}. The slices below it come to {below}. The {above} above {start} adds {added}. Alberta tax on your income: {tax}.',
      figures: {
        start: result('$60,000', 'ab428_bracket_lower_bound_line_3'),
        rate: result('10%', 'ab428_bracket_rate_line_5'),
        below: result('$4,800', 'ab428_bracket_tax_at_start_line_7'),
        above: result('$9,335', 'ab428_taxable_income_over_lower_bound_line_4'),
        added: result('$933.50', 'ab428_tax_on_excess_line_6'),
        tax: result('$5,733.50', 'ab428_tax_on_taxable_income_line_8'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 16–58',
      paragraph:
        'A credit is a discount on your tax bill. Everyone gets a basic personal amount ({basic} in 2025). You also get credit for the main part of your pension plan payments and for your EI payments. The form adds these amounts up, then takes {rate} of the total. That is your discount.',
      example:
        'The basic amount, {cpp} for the main part of your pension plan payments and {ei} of EI payments add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: result('$22,323', 'basic_personal_amount'),
        rate: printed('8%', '8% of line 52'),
        cpp: result('$3,291.75', 'ab428_cpp_contributions_line_27'),
        ei: result('$1,077.48', 'ab428_ei_premiums_line_29'),
        total: result('$26,692.23', 'ab428_credits_total_line_52'),
        discount: result('$2,135.38', 'ab428_credits_at_rate_line_54'),
      },
    },
    {
      id: 'after-credits',
      heading: 'Your tax after credits',
      lines: 'Lines 59–66',
      paragraph:
        'Now the form takes your credits away from your Alberta tax. A credit can bring your tax down to zero, but not below it.',
      example: 'Your tax of {tax} less credits of {credits} leaves {after}.',
      figures: {
        tax: main.result(
          '$5,733.50',
          'ab428_alberta_tax_on_taxable_income_line_59',
        ),
        credits: main.result('$2,135.38', 'ab428_credits_subtotal_line_65'),
        after: main.result('$3,598.12', 'ab428_tax_after_credits_line_66'),
      },
    },
    {
      id: 'supplement',
      heading: 'Extra credit for large credits',
      lines: 'Line 74',
      paragraph:
        'If you claim a lot of credits, you can get an extra credit. A short worksheet works it out. It takes your credit and takes away a set amount ({set}). If your credit is smaller than that, you get nothing extra. If it is bigger, you get {rate} of the difference.',
      example:
        'Your credit is {credit}. That is less than {set}, so the difference is {difference} and the extra credit is {extra}.',
      figures: {
        set: sheet.result('$4,800', 'worksheet_ab428_line_6'),
        rate: sheet.printed('25%', '25% of line 7'),
        credit: sheet.result('$2,135.38', 'worksheet_ab428_line_5'),
        difference: sheet.result('$0', 'worksheet_ab428_line_7'),
        extra: main.result('$0', 'ab428_supplemental_tax_credit_line_74'),
      },
    },
    {
      id: 'total',
      heading: 'Your Alberta tax',
      lines: 'Lines 73–75',
      paragraph:
        'The last line is your Alberta tax. It is your tax after credits, less the extra credit. It then goes onto your return.',
      example: '{after} less an extra credit of {extra} gives {total}.',
      figures: {
        after: main.result('$3,598.12', 'ab428_tax_line_73'),
        extra: main.result('$0', 'ab428_supplemental_tax_credit_line_74'),
        total: main.result('$3,598.12', 'ab428_alberta_tax_line_75'),
      },
    },
  ],
};
