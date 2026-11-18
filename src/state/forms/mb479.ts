import { figuresOf, type FormPageSpec } from '../formPage';

const { result } = figuresOf('ca-mb/mb479');

/** Form MB479 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const mb479: FormPageSpec = {
  id: 'mb479',
  name: 'Form MB479: Manitoba credits',
  province: 'ca-mb',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form MB479: Manitoba credits, in plain words',
  description:
    'What Form MB479 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This form adds up the credits you can get from Manitoba. We count only the personal tax credit, which helps people on lower pay.',
  sections: [
    {
      id: 'income',
      heading: 'Your income',
      lines: 'Lines 1–6',
      paragraph:
        'The form starts with your income. Some credits get smaller as your income goes up, and the form uses your family income to work that out. It starts from your net income. It can also count the income of a spouse or partner, and adjust for some child and disability benefits. We use none of those.',
      example:
        'Your net income is {income}. The form calls that your family income.',
      figures: {
        income: result('$69,335', 'mb479_net_income_line_1'),
      },
    },
    {
      id: 'personal',
      heading: 'The personal tax credit',
      lines: 'Lines 7–19',
      paragraph:
        'Everyone starts with a basic credit of {basic}. The form has extra credits for a spouse or partner, a dependant, a disability, children, and being 65 or older. We count only the basic credit. Then the credit shrinks. It takes off {rate} of your family income, and it cannot go below zero. These credits can be paid to you even if you do not have to pay any tax.',
      example:
        '{rate} of {income} is {cut}. That is more than the {basic} basic credit, so your personal tax credit is {credit}.',
      figures: {
        basic: result('$195', 'mb479_basic_credit_line_7'),
        rate: result('1%', 'mb479_reduction_line_18'),
        income: result('$69,335', 'mb479_family_income_line_6'),
        cut: result('$693.35', 'mb479_reduction_line_18'),
        credit: result('$0', 'mb479_personal_tax_credit_line_19'),
      },
    },
    {
      id: 'other',
      heading: 'Credits we do not count',
      lines: 'Lines 20–52 and 58–80',
      paragraph:
        'The rest of the form is for credits that depend on facts a salary does not show. They help homeowners, renters, seniors, caregivers, teachers, and people who pay for fertility treatment. Others cover things like paid work experience, green energy purchases, book publishing and some Manitoba businesses. We do not count any of them, so they are left out of our total. If one applies to you, you may be owed more than we show.',
      example:
        'Leaving them out, the Manitoba credits we count come to {total}.',
      figures: {
        total: result('$0', 'mb479_manitoba_credits_line_81'),
      },
    },
    {
      id: 'total',
      heading: 'Your Manitoba credits',
      lines: 'Line 81',
      paragraph:
        'The form adds up the credits. The total goes onto line 47900 of your return, where it counts with your other credits. If your credits come to more than the tax you owe, you may get a refund.',
      example: 'Your Manitoba credits come to {total}.',
      figures: {
        total: result('$0', 'mb479_manitoba_credits_line_81'),
      },
    },
  ],
};
