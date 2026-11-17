import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca/t1_tax_and_credits');

/** The second half of the T1 return in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const t1Tax: FormPageSpec = {
  id: 't1-tax',
  name: 'T1 return, steps 5 and 6',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  title: 'T1 return, steps 5 and 6, in plain words',
  description:
    'How the T1 tax return works out federal tax, credits and total tax, step by step in plain words, with a $70,000 salary example.',
  intro:
    'These steps of the federal tax return work out the tax on your taxable income, take off your credits, and add the Ontario tax to give the total tax.',
  sections: [
    {
      id: 'federal-tax',
      heading: 'Federal tax on your income',
      lines: 'Lines 70–76',
      paragraph:
        'Federal tax is charged in slices of income, called brackets, each with its own rate. The form finds the slice your income reaches. It adds the tax on the slices below, then charges that slice’s rate on the rest.',
      example:
        'Taxable income is {income}. Your slice starts at {start} and is taxed at {rate}. The tax below it is {below}. The {over} above the start adds {added}. Federal tax: {tax}.',
      figures: {
        income: result('$69,335', 'federal_tax_taxable_income_line_70'),
        start: result('$57,375', 'federal_bracket_lower_bound_line_71'),
        rate: result('20.5%', 'federal_bracket_column_rate_line_73'),
        below: result('$8,319.38', 'federal_tax_at_column_start_line_75'),
        over: result(
          '$11,960',
          'federal_taxable_income_over_lower_bound_line_72',
        ),
        added: result('$2,451.80', 'federal_excess_times_column_rate_line_74'),
        tax: result('$10,771.18', 'federal_tax_on_taxable_income_line_76'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 30000–35000',
      paragraph:
        'A credit is a discount on your tax bill. You get one for a basic personal amount, for the base part of your pension plan payments, for your Employment Insurance (EI) payments, and for the Canada employment amount, a set amount for people with job income. The basic personal amount is one everyone gets, and it shrinks at high incomes. The form adds the amounts up and takes {rate} of the total.',
      example:
        'The amounts are {basic}, {cpp}, {ei} and {job}. They add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: result('$16,129', 'basic_personal_amount'),
        cpp: result('$3,291.75', 'cpp_base_contributions_line_86'),
        ei: result('$1,077.48', 'ei_premiums_line_88'),
        job: result('$1,471', 'canada_employment_amount'),
        total: result('$21,969.23', 'credit_amounts_line_98'),
        rate: printed('14.5%', '14.5% of line 33500'),
        discount: result('$3,185.54', 'credit_amounts_at_credit_rate'),
      },
    },
    {
      id: 'after-credits',
      heading: 'Federal tax after credits',
      lines: 'Lines 40400, 125 and 42900',
      paragraph:
        'The form takes your credit discount away from your federal tax. The answer cannot go below zero. What is left is your basic federal tax.',
      example: '{tax} less {discount} leaves a basic federal tax of {after}.',
      figures: {
        tax: result('$10,771.18', 'federal_tax_with_split_income'),
        discount: result('$3,185.54', 'credits_against_basic_federal_tax'),
        after: result('$7,585.64', 'federal_tax_after_credits'),
      },
    },
    {
      id: 'provincial',
      heading: 'Your Ontario tax',
      lines: 'Line 42800',
      paragraph:
        'Ontario charges its own tax, which is worked out on a separate Ontario form. This line copies the answer from that form onto your return.',
      example: 'The Ontario tax is {ontario}.',
      figures: {
        ontario: result('$3,911.45', 'provincial_tax_line_42800'),
      },
    },
    {
      id: 'balance',
      heading: 'Your total tax',
      lines: 'Lines 43500, 48200 and 167',
      paragraph:
        'The form adds your federal tax and your Ontario tax. That is your total tax. Line 167 then takes off credits that are paid out even if you owe no tax. This page does not look at tax already taken off your pay during the year.',
      example:
        '{federal} plus {ontario} is {total}. Those paid-out credits are {refundable} here, so the amount on line 167 is {total}.',
      figures: {
        federal: result('$7,585.64', 'federal_tax_after_credits'),
        ontario: result('$3,911.45', 'provincial_tax_line_42800'),
        total: result('$11,497.09', 'total_payable'),
        refundable: result('$0', 'total_credits'),
      },
    },
  ],
};
