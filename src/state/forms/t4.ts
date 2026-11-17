import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca/schedule_8');
const slip = figuresOf('ca/t2204');

/** The T4 slip in plain words. The figures are the 2025 slip's, at a $70,000 salary. */
export const t4: FormPageSpec = {
  id: 't4',
  name: 'T4 slip',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  title: 'The T4 slip, in plain words',
  description:
    'What the boxes on a T4 slip mean and where each one goes on your return, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'A T4 is the yearly slip your employer gives you. It shows how much you were paid and what was taken off your pay. You use it to fill in your tax return.',
  sections: [
    {
      id: 'pay',
      heading: 'Your pay',
      lines: 'Box 14',
      paragraph:
        'Box 14 is your employment income. It is the total pay you earned from that employer in the year. You copy it to line 10100 of your tax return. All of your tax starts from this number.',
      example: 'If you earned {pay} in the year, box 14 shows {pay}.',
      figures: {
        pay: result('$70,000', 'total_income', 'ca/t1_taxable_income'),
      },
    },
    {
      id: 'pension',
      heading: 'Pension plan payments',
      lines: 'Boxes 16 and 26',
      paragraph:
        'Box 16 shows what was taken off your pay for the Canada Pension Plan. Box 26 shows the pay that pension plan payments are charged on. If box 26 is blank, use box 14. The plan charges {rate} on the first part and {extraRate} on an extra part.',
      example:
        'Your pay of {earnings} is charged. That gives {main} for the first part and {extra} for the extra part.',
      figures: {
        rate: printed('4.95%', '4.95% of the part of line 7'),
        extraRate: printed('1%', '1% of the part of line 7'),
        earnings: result(
          '$70,000',
          't4_cpp_pensionable_earnings_outside_quebec',
        ),
        main: result('$3,291.75', 'cpp_part_3_line_11'),
        extra: result('$665', 'cpp_part_3_line_12'),
      },
    },
    {
      id: 'ei',
      heading: 'Employment Insurance payments',
      lines: 'Boxes 18 and 24',
      paragraph:
        'Box 18 shows what was taken off your pay for Employment Insurance, or EI. Box 24 shows the pay that EI is charged on. If box 24 is blank, use box 14. EI charges {rate} of your pay, but only up to a top amount of {top}. Pay above that is not charged.',
      example:
        'Your pay of {earnings} is over {top}. So EI is charged on {top} only, and box 18 shows {premiums}.',
      figures: {
        rate: slip.printed('1.64%', '1.64% of the part of line 1'),
        top: slip.result('$65,700', 't2204_line_3'),
        earnings: slip.result('$70,000', 't2204_line_1'),
        premiums: slip.result('$1,077.48', 't2204_premiums_deducted'),
      },
    },
    {
      id: 'tax-deducted',
      heading: 'Income tax already taken off',
      lines: 'Line 43700',
      paragraph:
        'Your employer takes some income tax off each paycheque and sends it to the government. The slip shows the total in the box called Income tax deducted. You copy it to line 43700 of your return. It counts as tax you already paid. Our calculator does not use it. Our number shows the tax you owe for the whole year, not what your employer already took off.',
      example: 'At this pay, the tax you owe for the year is {owed}.',
      figures: {
        owed: result('$11,497.09', 'total_payable', 'ca-on/return'),
      },
    },
  ],
};
