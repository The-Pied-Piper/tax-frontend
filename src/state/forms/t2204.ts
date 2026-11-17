import { figuresOf, type FormPageSpec } from '../formPage';

const { result } = figuresOf('ca/t2204');

/** Form T2204 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const t2204: FormPageSpec = {
  id: 't2204',
  name: 'Form T2204: EI overpayment',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form T2204: EI overpayment, in plain words',
  description:
    'What Form T2204 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This form works out whether you paid too much into Employment Insurance, or EI, during the year. If you did, the extra comes back to you, but only if it is more than $1.',
  sections: [
    {
      id: 'earnings',
      heading: 'Pay that EI counts',
      lines: 'Lines 1–3',
      paragraph:
        'EI is only charged on pay up to a yearly limit. The form takes your pay and cuts it off at that limit, which is {max} in 2025. Insured pay under {exempt} is entered as zero, so none of it counts, and all of your EI payments come back to you. The form also works out your pay less {exempt}, never below zero. It uses that to decide your refund and your EI credit.',
      example:
        'Your pay is more than the limit, so EI counts only {counted} of it.',
      figures: {
        max: result('$65,700', 't2204_line_3'),
        exempt: result('$2,000', 't2204_exemption'),
        counted: result('$65,700', 't2204_line_3'),
      },
    },
    {
      id: 'premiums',
      heading: 'EI payments for the year',
      lines: 'Lines 4 and 10',
      paragraph:
        'EI payments are {rate} of the pay that EI counts, up to a set most for the year. The form works out the most you should have paid. It then compares that with what your employer took off your pay.',
      example:
        'The most you can owe for the year is {most}. Your employer took off {taken}.',
      figures: {
        rate: result('1.64%', 't2204_line_10'),
        most: result('$1,077.48', 't2204_line_10'),
        taken: result('$1,077.48', 't2204_premiums_deducted'),
      },
    },
    {
      id: 'refund',
      heading: 'Your EI refund',
      lines: 'Lines 13–16',
      paragraph:
        'If your employer took off more than the most you owe, the extra is an overpayment. It comes back to you as a refund. If not, the refund is zero. The refund is paid only if the overpayment is more than $1. Line 16 is the amount that goes onto the EI credit line (31200) of your return and onto your provincial form.',
      example:
        'The amount taken off is {taken}, less the most you owe of {most}. The overpayment is {extra}.',
      figures: {
        taken: result('$1,077.48', 't2204_premiums_deducted'),
        most: result('$1,077.48', 't2204_line_10'),
        extra: result('$0', 'ei_overpayment'),
      },
    },
  ],
};
