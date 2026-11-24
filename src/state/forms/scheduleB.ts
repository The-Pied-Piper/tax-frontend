import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-qc/schedule_b');

/** Quebec Schedule B in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const scheduleB: FormPageSpec = {
  id: 'schedule-b',
  name: 'Schedule B: Tax Relief Measures',
  province: 'ca-qc',
  year: 2025,
  exampleSalary: '70000',
  title: 'Schedule B: Tax Relief Measures, in plain words',
  description:
    'What Schedule B is for, including living alone, age, retirement income and medical expenses, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'Schedule B can lower your Québec tax through amounts for living alone, age and retirement income, and through medical expenses and an independent living credit for seniors. The first three shrink as your family income grows. For a person living alone with a $70,000 salary, the living-alone amount comes to nothing.',
  sections: [
    {
      id: 'income',
      heading: 'Your family income',
      lines: 'Lines 10–15',
      paragraph:
        'The schedule starts with your net income from your return. If you have a spouse, it adds their net income, because the break depends on the income of the whole family. We do not ask about a spouse, so your family income is your own net income.',
      example:
        'Your net income is {netIncome}, so your family income is {familyIncome}.',
      figures: {
        netIncome: result('$67,915', 'schedule_b_line_10'),
        familyIncome: result('$67,915', 'schedule_b_line_10'),
      },
    },
    {
      id: 'threshold',
      heading: 'Income above the set amount',
      lines: 'Lines 16–18',
      paragraph:
        'The break starts to shrink once your family income goes above a set amount. The form takes your family income less that amount, not below zero.',
      example:
        'Your family income of {familyIncome} less {threshold} leaves {over}.',
      figures: {
        familyIncome: result('$67,915', 'schedule_b_line_10'),
        threshold: result('$42,090', 'schedule_b_threshold_line_16'),
        over: result('$25,825', 'schedule_b_line_18'),
      },
    },
    {
      id: 'living-alone',
      heading: 'Living alone',
      lines: 'Line 20',
      paragraph:
        'If you lived alone, only with people under 18, or only with your children or grandchildren who are full-time students, you can claim an amount for living alone. We assume you did not, so we claim nothing. The form also stops the claim if your income above the set amount is over a limit.',
      example: 'Living alone is answered no, so the amount is {livingAlone}.',
      figures: {
        livingAlone: result('$0', 'schedule_b_line_20'),
      },
    },
    {
      id: 'unused',
      heading: 'Amounts we do not use',
      lines: 'Lines 21–28',
      paragraph:
        'The schedule has other amounts, such as for single parents, for age and for retirement income, which has its own work chart. We do not use them. We also do not use the parts for medical expenses, the refundable credit for medical expenses and the credit for independent living for seniors.',
      example: 'These add nothing to your example.',
      figures: {},
    },
    {
      id: 'reduction',
      heading: 'Taking off part of your income',
      lines: 'Lines 30–32',
      paragraph:
        'The form adds up your amounts, then takes {reductionRate} of your income above the set amount. That is taken away from the total. If it is more than the total, the result is zero.',
      example:
        'Your amounts add up to {amounts}. {reductionRate} of {over} is {reduction}. The total less that is {afterReduction}, which cannot go below zero.',
      figures: {
        amounts: result('$0', 'schedule_b_line_30'),
        reductionRate: printed('18.75%', '18.75% of line 18'),
        over: result('$25,825', 'schedule_b_line_18'),
        reduction: result('$4,842.19', 'schedule_b_line_31'),
        afterReduction: result('$0', 'schedule_b_line_32'),
      },
    },
    {
      id: 'result',
      heading: 'Your result',
      lines: 'Lines 33–34',
      paragraph:
        'If your spouse claimed some of the amount, it is taken off. What is left goes to line 361 of your Québec return.',
      example:
        'Your spouse claimed {spouseClaim}, so your result is {result}. It goes to line 361 of Form TP-1.',
      figures: {
        spouseClaim: result('$0', 'schedule_b_line_33'),
        result: result('$0', 'schedule_b_line_34'),
      },
    },
  ],
};
