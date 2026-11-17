import { figuresOf, type FormPageSpec } from '../formPage';

const { result } = figuresOf('ca/t1_taxable_income');

/** The first half of the T1 return in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const t1Income: FormPageSpec = {
  id: 't1-income',
  name: 'T1 return, steps 2 to 4',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  title: 'T1 return, steps 2 to 4, in plain words',
  description:
    'How the T1 tax return finds your taxable income, step by step in plain words, with a worked example for a $70,000 salary.',
  intro:
    'The T1 is the federal tax return. These steps start with your pay and take things off it, until what is left is your taxable income, the amount your tax is charged on.',
  sections: [
    {
      id: 'total-income',
      heading: 'Your total income',
      lines: 'Lines 10100, 10400 and 15000',
      paragraph:
        'Total income is all the money you earned in the year. Your pay from your job goes on one line. Other work income goes on another. The form adds them together.',
      example:
        'Your pay and other work income together come to {total}, and {other} of that is other work income. Total income: {total}.',
      figures: {
        other: result('$0', 'other_employment_income'),
        total: result('$70,000', 'total_income'),
      },
    },
    {
      id: 'deductions',
      heading: 'What you take off',
      lines: 'Line 23300',
      paragraph:
        'A deduction is an amount you are allowed to take off your income before tax is worked out. Here, the form takes off the extra part of your pension plan payments, plus any second payment, copied from Schedule 8.',
      example: 'The amount taken off is {taken}.',
      figures: {
        taken: result('$665', 'deductions_from_total_income'),
      },
    },
    {
      id: 'net-income',
      heading: 'Your net income',
      lines: 'Lines 23400–23600',
      paragraph:
        'Net income is your total income less what you take off. The form can also take off money you had to pay back from certain government benefits. If the answer would be below zero, it is shown as zero.',
      example:
        '{total} less {taken} is {net}. No other amounts apply, so net income stays {net}.',
      figures: {
        total: result('$70,000', 'total_income'),
        taken: result('$665', 'deductions_from_total_income'),
        net: result('$69,335', 'net_income'),
      },
    },
    {
      id: 'taxable-income',
      heading: 'Your taxable income',
      lines: 'Lines 25700 and 26000',
      paragraph:
        'Some people take off a few more amounts at this step. What is left is your taxable income, and it cannot be below zero. It is the amount your federal tax and your Ontario tax are worked out from.',
      example:
        'The other amounts are {other}, so your taxable income is {taxable}.',
      figures: {
        other: result('$0', 'deductions_from_net_income'),
        taxable: result('$69,335', 'taxable_income'),
      },
    },
  ],
};
