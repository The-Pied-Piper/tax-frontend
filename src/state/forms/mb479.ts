import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-mb/mb479');

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
    'This form adds up the Manitoba credits you can claim, even if you do not have to pay any tax. We count only the personal tax credit.',
  sections: [
    {
      id: 'income',
      heading: 'Your income',
      lines: 'Lines 1–6',
      paragraph:
        'The form starts with your income and builds it into your family income. It starts from your net income. It can also count the income of a spouse or partner, and adjust for some child and disability benefits. We use none of those, so for us your family income is your net income. Some credits get smaller as your family income goes up.',
      example:
        'Your net income is {income}. With no spouse or partner and none of those benefits, that is also your family income.',
      figures: {
        income: result('$69,335', 'mb479_net_income_line_1'),
      },
    },
    {
      id: 'personal',
      heading: 'The personal tax credit',
      lines: 'Lines 7–19',
      paragraph:
        'The form starts with a basic credit of {basic}. It has extra credits for a spouse or partner, a dependant, a disability, children, and being 65 or older. We count only the basic credit. Then the credit shrinks. It takes off {rate} of your family income, and it cannot go below zero.',
      example:
        'We count only the {basic} basic credit. {rate} of {income} is {cut}. That is more than {basic}, so your personal tax credit is {credit}.',
      figures: {
        basic: result('$195', 'mb479_basic_credit_line_7'),
        rate: printed('1%', '1% of line 6'),
        income: result('$69,335', 'mb479_family_income_line_6'),
        cut: result('$693.35', 'mb479_reduction_line_18'),
        credit: result('$0', 'mb479_personal_tax_credit_line_19'),
      },
    },
    {
      id: 'total',
      heading: 'Your Manitoba credits',
      lines: 'Lines 20–81',
      paragraph:
        'Most of lines 20 to 80 are other Manitoba credits, such as those for homeowners, renters, seniors, caregivers, teachers, fertility treatment, paid work experience, green energy, book publishing and some Manitoba businesses. We do not count them. If one applies to you, you may be owed more than we show. Lines 53 to 57 add up the credits so far, including your personal tax credit. For people who get certain Manitoba income assistance or disability support payments, the form also multiplies that total. We do not use that. Line 81 is the total, which goes onto line 47900 of your return. If your credits come to more than the tax you owe, you may get a refund for the difference.',
      example: 'The Manitoba credits we count come to {total}.',
      figures: {
        total: result('$0', 'mb479_manitoba_credits_line_81'),
      },
    },
  ],
};
