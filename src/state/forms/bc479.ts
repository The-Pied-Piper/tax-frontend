import { figuresOf, type FormPageSpec } from '../formPage';

const { result } = figuresOf('ca-bc/bc479');

/** Form BC479 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const bc479: FormPageSpec = {
  id: 'bc479',
  name: 'Form BC479: British Columbia credits',
  province: 'ca-bc',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form BC479: British Columbia credits, in plain words',
  description:
    'What Form BC479 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This form adds up the credits you can get from British Columbia. We count only the sales tax credit, which helps people on lower pay.',
  sections: [
    {
      id: 'income',
      heading: 'Your income',
      lines: 'Lines 1–8',
      paragraph:
        'The form starts with your income. It takes off {threshold}, because the sales tax credit only shrinks on income above that.',
      example: 'Your income is {income}. Less {threshold}, that leaves {over}.',
      figures: {
        income: result('$69,335', 'bc479_adjusted_family_net_income_line_6'),
        threshold: result('$15,000', 'bc479_threshold_line_7'),
        over: result('$54,335', 'bc479_income_for_sales_tax_credit_line_8'),
      },
    },
    {
      id: 'sales-tax',
      heading: 'The sales tax credit',
      lines: 'Lines 9–13',
      paragraph:
        'The sales tax credit starts at {credit}. It shrinks by {rate} of your income over {threshold}. This credit is refundable. That means it can be paid to you even if you owe no BC tax. At very low incomes, this can make take-home pay higher than the salary.',
      example:
        '{credit} less {cut} is below zero, so the sales tax credit is {paid}.',
      figures: {
        credit: result('$75', 'bc479_basic_sales_tax_credit_line_9'),
        rate: result('2%', 'bc479_income_reduction_line_12'),
        threshold: result('$15,000', 'bc479_threshold_line_7'),
        cut: result('$1,086.70', 'bc479_income_reduction_line_12'),
        paid: result('$0', 'bc479_sales_tax_credit_line_13'),
      },
    },
    {
      id: 'total',
      heading: 'Your BC credits',
      lines: 'Lines 15, 35 and 45',
      paragraph:
        "The form adds the credits together. We count only the sales tax credit. The form also has a renter's tax credit and credits for home renovation, venture capital, mining exploration, clean buildings and training. We do not use them. The renter's credit can still pay something on income well above where the sales tax credit stops. The total goes onto line 47900 of your return.",
      example: 'Your BC credits come to {total}.',
      figures: {
        total: result('$0', 'bc479_british_columbia_credits_line_45'),
      },
    },
  ],
};
