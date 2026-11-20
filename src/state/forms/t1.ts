import { figuresOf, type FormPageSpec } from '../formPage';

const income = figuresOf('ca/t1_taxable_income');
const tax = figuresOf('ca/t1_tax_and_credits');

/** The T1 return in plain words, in its two step groups. The figures are the 2025 form's, at a $70,000 salary. */
export const t1: FormPageSpec = {
  id: 't1',
  name: 'T1 return',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  federal: true,
  title: 'T1 return in plain words',
  description:
    'How the T1 tax return finds your taxable income, works out federal tax and gives your total payable, in plain words, with a $70,000 salary example.',
  intro:
    'The T1 is the federal tax return. It starts with your pay and finds the income your tax is charged on. Then it works out your federal tax, takes off your credits and adds your provincial tax to give your total payable.',
  sections: [
    {
      group: 'Steps 2 to 4: your taxable income',
      id: 'total-income',
      heading: 'Your total income',
      lines: 'Lines 10100, 10400 and 15000',
      paragraph:
        'Total income is all the income you report for the year. For someone with only a salary, that is your pay. Your pay from your job goes on one line. Other work income goes on another. The form adds them together.',
      example:
        'Your pay plus other work income is {total}. Of that, {other} is other work income. Total income: {total}.',
      figures: {
        other: income.result('$0', 'other_employment_income'),
        total: income.result('$70,000', 'total_income'),
      },
    },
    {
      group: 'Steps 2 to 4: your taxable income',
      id: 'deductions',
      heading: 'What you take off',
      lines: 'Lines 22215 and 23300',
      paragraph:
        'A deduction is an amount you are allowed to take off your income before tax is worked out. Here, the form takes off the extra part of your pension plan payments, plus any second payment, copied from Schedule 8. It goes on line 22215. Line 23300 is the total of all your deductions.',
      example: 'The amount taken off is {taken}.',
      figures: {
        taken: income.result('$665', 'deductions_from_total_income'),
      },
    },
    {
      group: 'Steps 2 to 4: your taxable income',
      id: 'net-income',
      heading: 'Your net income',
      lines: 'Lines 23400–23600',
      paragraph:
        'Net income is your total income less what you take off. The form can also take off money you had to pay back from certain government benefits. If the answer would be below zero, it is shown as zero.',
      example:
        '{total} less {taken} is {net}. No other amounts apply, so net income stays {net}.',
      figures: {
        total: income.result('$70,000', 'total_income'),
        taken: income.result('$665', 'deductions_from_total_income'),
        net: income.result('$69,335', 'net_income'),
      },
    },
    {
      group: 'Steps 2 to 4: your taxable income',
      id: 'taxable-income',
      heading: 'Your taxable income',
      lines: 'Lines 25700 and 26000',
      paragraph:
        'Some people take off a few more amounts at this step. What is left is your taxable income, and it cannot be below zero. Your federal tax and your provincial tax are both worked out from it.',
      example:
        'The other amounts are {other}, so your taxable income is {taxable}.',
      figures: {
        other: income.result('$0', 'deductions_from_net_income'),
        taxable: income.result('$69,335', 'taxable_income'),
      },
    },
    {
      group: 'Steps 5 and 6: your tax and total payable',
      id: 'federal-tax',
      heading: 'Federal tax on your income',
      lines: 'Lines 70–76',
      paragraph:
        "Federal tax is charged in slices of income, called brackets, each with its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice's rate on the rest of your income.",
      example:
        'Taxable income is {income}. Your slice starts at {start} and is taxed at {rate}. The tax below it is {below}. The {over} above the start adds {added}. Federal tax: {tax}.',
      figures: {
        income: tax.result('$69,335', 'federal_tax_taxable_income_line_70'),
        start: tax.result('$57,375', 'federal_bracket_lower_bound_line_71'),
        rate: tax.result('20.5%', 'federal_bracket_column_rate_line_73'),
        below: tax.result('$8,319.38', 'federal_tax_at_column_start_line_75'),
        over: tax.result(
          '$11,960',
          'federal_taxable_income_over_lower_bound_line_72',
        ),
        added: tax.result(
          '$2,451.80',
          'federal_excess_times_column_rate_line_74',
        ),
        tax: tax.result('$10,771.18', 'federal_tax_on_taxable_income_line_76'),
      },
    },
    {
      group: 'Steps 5 and 6: your tax and total payable',
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 30000–35000',
      paragraph:
        'A credit lowers your tax bill. The form starts with a list of amounts: the basic personal amount that everyone gets (it shrinks at high incomes), the base part of your pension plan payments, your Employment Insurance (EI) payments, and the Canada employment amount. That last one is a set amount, or your job income if that is less. The form adds them up and takes {rate} of the total. That is your discount.',
      example:
        'The amounts are {basic}, {cpp}, {ei} and {job}. They add up to {total}. {rate} of that is {discount}.',
      figures: {
        basic: tax.result('$16,129', 'basic_personal_amount'),
        cpp: tax.result('$3,291.75', 'cpp_base_contributions_line_86'),
        ei: tax.result('$1,077.48', 'ei_premiums_line_88'),
        job: tax.result('$1,471', 'canada_employment_amount'),
        total: tax.result('$21,969.23', 'credit_amounts_line_98'),
        rate: tax.printed('14.5%', '14.5% of line 33500'),
        discount: tax.result('$3,185.54', 'credit_amounts_at_credit_rate'),
      },
    },
    {
      group: 'Steps 5 and 6: your tax and total payable',
      id: 'after-credits',
      heading: 'Federal tax after credits',
      lines: 'Lines 40400, 125 and 42900',
      paragraph:
        'The form takes your credit discount away from your federal tax. The answer cannot go below zero. What is left is your basic federal tax.',
      example: '{tax} less {discount} leaves a basic federal tax of {after}.',
      figures: {
        tax: tax.result('$10,771.18', 'federal_tax_with_split_income'),
        discount: tax.result('$3,185.54', 'credits_against_basic_federal_tax'),
        after: tax.result('$7,585.64', 'federal_tax_after_credits'),
      },
    },
    {
      group: 'Steps 5 and 6: your tax and total payable',
      id: 'provincial',
      heading: 'Your provincial tax',
      lines: 'Line 42800',
      paragraph:
        "Each province charges its own tax on its own form. Ontario's is Form ON428, and line 42800 copies the answer from that form onto your return.",
      example: 'In Ontario the provincial tax is {ontario}.',
      figures: {
        ontario: tax.result('$3,911.45', 'provincial_tax_line_42800'),
      },
    },
    {
      group: 'Steps 5 and 6: your tax and total payable',
      id: 'balance',
      heading: 'Total payable and refund or balance owing',
      lines: 'Lines 43500, 48200 and 167',
      paragraph:
        'Line 43500 mainly adds your federal tax and your provincial tax. That gives your total payable. The last step, line 167, takes away your total credits (line 48200) to show whether you owe money or get a refund. This page stops before that step. One of those credits is the tax your employer already took off your pay during the year (line 43700). We leave it out and count only the other credits.',
      example:
        "{federal} plus Ontario's {ontario} is a total payable of {total}. The other credits are {refundable}. Without the tax taken off your pay, the balance owing would be {total}.",
      figures: {
        federal: tax.result('$7,585.64', 'federal_tax_after_credits'),
        ontario: tax.result('$3,911.45', 'provincial_tax_line_42800'),
        total: tax.result('$11,497.09', 'total_payable'),
        refundable: tax.result('$0', 'total_credits'),
      },
    },
  ],
};
