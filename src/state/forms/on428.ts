import { figuresOf, type FormPageSpec } from '../formPage';
import { contentPath, formSlug } from '../siteLinks';

const { result, printed } = figuresOf('ca-on/on428');

/** Form ON428 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const on428: FormPageSpec = {
  id: 'on428',
  name: 'Form ON428: Ontario Tax',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form ON428: Ontario Tax, in plain words',
  description:
    'What Form ON428 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the form that works out how much income tax you owe Ontario. If you lived in Ontario at the end of the year, it is the Ontario part of your tax return.',
  sections: [
    {
      id: 'income',
      heading: 'Your taxable income',
      lines: 'Line 1',
      paragraph:
        'Taxable income is the part of your income that tax is charged on. This form does not work it out. It copies the number from the federal part of your return. Some things are taken off first, like part of your pension plan payments.',
      example:
        '{taken}, the extra part of your pension plan payments, is taken off first. That leaves a taxable income of {income}.',
      figures: {
        income: result('$69,335', 'on428_taxable_income_line_1'),
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
        "Ontario does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. Lower slices are taxed less. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice's rate on the rest of your income.",
      example:
        'Your income reaches the slice that starts at {start}. That slice is taxed at {rate}. The tax on the slices below it comes to {below}. The {above} of your income above {start} adds {added}. Ontario tax before credits: {tax}.',
      figures: {
        start: result('$52,886', 'on428_bracket_lower_bound_line_3'),
        rate: result('9.15%', 'on428_bracket_column_rate_line_5'),
        below: result('$2,670.74', 'on428_tax_at_column_start_line_7'),
        above: result(
          '$16,449',
          'on428_taxable_income_over_lower_bound_line_4',
        ),
        added: result('$1,505.08', 'on428_excess_times_column_rate_line_6'),
        tax: result('$4,175.82', 'on428_tax_on_taxable_income_line_8'),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 9–50',
      paragraph:
        'A credit lowers your tax bill. The form starts with a list of amounts: the basic personal amount that everyone gets ({basic} in 2025), the main part of your pension plan payments, and your EI payments. It adds them up, then takes {rate} of the total. That is your discount. A credit can bring your Ontario tax down to zero, but not below it.',
      example:
        'The amounts add up to {total}. {rate} of that is {discount}. Your tax drops from {before} to {after}.',
      figures: {
        basic: result('$12,747', 'basic_personal_amount'),
        rate: printed('5.05%', '5.05% of line 44'),
        total: result('$17,116.23', 'on428_total_credit_amounts_line_44'),
        discount: result(
          '$864.37',
          'on428_credit_amounts_at_credit_rate_line_46',
        ),
        before: result('$4,175.82', 'on428_tax_on_taxable_income_line_8'),
        after: result('$3,311.45', 'on428_tax_minus_credits_line_53'),
      },
    },
    {
      id: 'surtax',
      heading: 'Surtax on higher Ontario tax',
      lines: 'Lines 65–69',
      paragraph:
        'A surtax is an extra tax. It only applies when your Ontario tax is already high. The form tests your Ontario tax after credits, before the health premium. In 2025 the surtax starts once that tax is over {first}. It then adds {firstRate} of the amount over {first}. Once your tax is over {second}, it adds another {secondRate} of the amount over {second}. If your tax is under {first}, you pay no surtax.',
      example:
        'Your Ontario tax after credits is {tax}. That is under {first}, so the surtax is {surtax}.',
      figures: {
        first: printed('$5,710', 'over 5710.00'),
        firstRate: printed('20%', '20% of the part of line 65'),
        second: printed('$7,307', 'over 7307.00'),
        secondRate: printed('36%', '36% of the part of line 65'),
        tax: result('$3,311.45', 'on428_surtax_base_line_65'),
        surtax: result('$0', 'on428_surtax_total_line_68'),
      },
    },
    {
      id: 'reduction',
      heading: 'Reduction for low Ontario tax',
      lines: 'Lines 74–81',
      paragraph:
        'If your Ontario tax is small, Ontario can lower it further. The form starts with a set amount ({set} in 2025) and doubles it to {doubled}. It then takes away your Ontario tax after credits and surtax. Whatever is left is your reduction. If your tax is more than {doubled}, the reduction is zero.',
      example:
        '{doubled} less your tax of {tax} is below zero, so the reduction is {reduction}.',
      figures: {
        set: result('$294', 'on428_basic_reduction_line_74'),
        doubled: result('$588', 'on428_tax_reduction_doubled_line_78'),
        tax: result('$3,311.45', 'on428_tax_with_minimum_tax_addition_line_73'),
        reduction: result('$0', 'on428_ontario_tax_reduction_line_80'),
      },
    },
    {
      id: 'lift',
      heading: 'The LIFT credit',
      lines: 'Line 85',
      paragraph:
        'LIFT stands for Low-income Individuals and Families Tax credit. It lowers the tax of people on lower pay. This line copies the amount from Schedule ON428-A.',
      example: 'At this pay the amount is {credit}.',
      figures: {
        credit: result('$0', 'on428_lift_credit_line_85'),
      },
      links: [
        {
          label: 'See how the LIFT credit is worked out on its own schedule',
          href: contentPath(formSlug('on428-a')),
        },
      ],
    },
    {
      id: 'total',
      heading: 'Health premium and your Ontario tax',
      lines: 'Lines 89–90',
      paragraph:
        'The Ontario health premium is a yearly charge based on your income. Lower incomes pay little or nothing, and the amount goes up in steps as income rises. The form adds it to your tax after credits. The total is your Ontario tax, which goes onto your return.',
      example:
        '{tax} plus a health premium of {premium} gives an Ontario tax of {total}.',
      figures: {
        tax: result(
          '$3,311.45',
          'on428_tax_after_farmers_food_donation_credit_line_88',
        ),
        premium: result('$600', 'on428_ontario_health_premium_line_89'),
        total: result('$3,911.45', 'on428_ontario_tax_line_90'),
      },
    },
  ],
};
