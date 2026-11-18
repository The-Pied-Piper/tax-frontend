import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-mb/mb428_a');

/** Schedule MB428-A in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const mb428a: FormPageSpec = {
  id: 'mb428-a',
  name: 'Schedule MB428-A: Manitoba Family Tax Benefit',
  province: 'ca-mb',
  year: 2025,
  exampleSalary: '70000',
  title: 'Schedule MB428-A: Family Tax Benefit, in plain words',
  description:
    'What Schedule MB428-A is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'The Family Tax Benefit lowers your Manitoba tax if your income is low. You do not need a spouse or a child to claim it. It is not paid to you as cash. At $70,000 it is zero.',
  sections: [
    {
      id: 'starting-amount',
      heading: 'Where the benefit starts',
      lines: 'Lines 1 and 10',
      paragraph:
        'Every filer starts with a basic amount of {basic}. The form has more lines that add to it, for a spouse or partner, a dependant, a child, age and disability. This page follows a filer with none of those, so the starting amount stays {basic}.',
      example:
        'The basic amount is {basic}. With nothing added to it, the total on line 10 is {total}.',
      figures: {
        basic: result('$2,065', 'mb428_a_basic_amount_line_1'),
        total: result('$2,065', 'mb428_a_line_10'),
      },
    },
    {
      id: 'income',
      heading: 'Less benefit as income rises',
      lines: 'Line 11',
      paragraph:
        'The form takes {rate} of your net income. Net income is the figure on line 23600 of your return. The more you earn, the more is taken away.',
      example: 'Your net income is {income}. {rate} of that is {cut}.',
      figures: {
        rate: printed('9%', '9% of line 11'),
        income: result('$69,335', 'mb428_a_net_income_line_11'),
        cut: result('$6,240.15', 'mb428_a_line_11'),
      },
    },
    {
      id: 'benefit',
      heading: 'What is left',
      lines: 'Line 12',
      paragraph:
        'The form takes the amount taken away on line 11 off the starting amount on line 10. If the answer is below zero, the form enters 0. What is left is your Family Tax Benefit. It goes on line 61470 of Form MB428 and lowers your Manitoba tax. It is not paid to you as cash.',
      example:
        '{total} less {cut} is below zero, so your Family Tax Benefit is {benefit}.',
      figures: {
        total: result('$2,065', 'mb428_a_line_10'),
        cut: result('$6,240.15', 'mb428_a_line_11'),
        benefit: result('$0', 'mb428_a_family_tax_benefit_line_12'),
      },
    },
  ],
};
