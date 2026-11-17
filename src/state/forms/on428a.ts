import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-on/on428_a');

/** Schedule ON428-A in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const on428a: FormPageSpec = {
  id: 'on428-a',
  name: 'Schedule ON428-A: LIFT credit',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  title: 'Schedule ON428-A: LIFT credit, in plain words',
  description:
    'What Schedule ON428-A is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'LIFT stands for Low-income Individuals and Families Tax credit. It lowers Ontario tax for people on lower pay. At $70,000 it is zero.',
  sections: [
    {
      id: 'credit',
      heading: 'The most you could get',
      lines: 'Lines 3–5',
      paragraph:
        'The LIFT credit starts at {rate} of what you earned from work. It can never be more than {max}.',
      example:
        '{rate} of {pay} is {before}. That is more than the top amount of {max}, so the credit, before your income is taken into account, is {max}.',
      figures: {
        rate: printed('5.05%', '5.05% of line 3'),
        max: result('$875', 'lift_maximum_credit'),
        pay: result('$70,000', 'lift_employment_income'),
        before: result('$3,535', 'lift_credit_before_maximum'),
      },
    },
    {
      id: 'reduction',
      heading: 'Less credit as income rises',
      lines: 'Lines 6–20',
      paragraph:
        "The credit shrinks as your income goes up. Once your income is over {threshold}, the form takes away {rate} of the part above it. If that takes away all of the credit, you get nothing. These are the amounts for a single person. With a spouse or partner, the form uses your family's income and a different threshold. The credit goes onto line 85 of Form ON428.",
      example:
        'Your income is {income}, which is {over} over {threshold}. {rate} of that is {cut}. {max} less {cut} is below zero, so the credit is {credit}.',
      figures: {
        threshold: result('$32,500', 'lift_individual_income_threshold'),
        rate: result('5%', 'lift_reduction'),
        income: result('$69,335', 'lift_adjusted_net_income'),
        over: result('$36,835', 'lift_single_excess_over_threshold'),
        cut: result('$1,841.75', 'lift_reduction'),
        max: result('$875', 'lift_maximum_credit'),
        credit: result('$0', 'lift_credit_single'),
      },
    },
  ],
};
