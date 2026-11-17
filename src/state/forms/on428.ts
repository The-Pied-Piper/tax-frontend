import { figuresOf, type FormPageSpec } from '../formPage';

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
        'Taxable income is the part of your pay that tax is charged on. This form does not work it out. It copies the number from the federal part of your return. Some things are taken off first, like part of your pension plan payments.',
      example:
        'Taxable income is {income}, because {taken}, the extra part of your pension plan payments, is taken off first.',
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
        'Ontario does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. Lower slices are taxed less. The form finds the highest slice your income reaches, adds the tax on all the slices below it, then charges that slice’s rate on the rest.',
      example:
        'Your income reaches the slice that starts at {start}, taxed at {rate}. The slices below it come to {below}. The {above} above {start} adds {added}. Ontario tax on your income: {tax}.',
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
        'A credit is a discount on your tax bill. Everyone gets a basic personal amount ({basic} in 2025). You also get credit for the main part of your pension plan payments and for your EI payments. The form adds these amounts up, then takes {rate} of the total. That is your discount. A credit can bring your Ontario tax down to zero, but not below it.',
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
        'A surtax is an extra tax added only when your Ontario tax is already high. In 2025 it starts at {first} of Ontario tax, and adds {firstRate} of the part above that. Above {second} it adds another {secondRate} of the part above that. If your tax is below {first}, you pay no surtax.',
      example:
        'Your Ontario tax so far is {tax}, which is under {first}. Surtax: {surtax}.',
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
        'If your Ontario tax is small, Ontario can reduce it. The form doubles a set amount ({set} in 2025, so {doubled}) and takes your tax away from it. If your tax is bigger than that, the reduction is zero.',
      example:
        '{doubled} less {tax} is below zero, so the reduction is {reduction}.',
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
    },
    {
      id: 'total',
      heading: 'Health premium and your Ontario tax',
      lines: 'Lines 89–90',
      paragraph:
        'The Ontario health premium is a yearly charge that depends on your income. It is a set amount, not a rate. The form adds it to your tax after credits. The total is your Ontario tax, which then goes onto your return.',
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
