import { figuresOf, type FormPageSpec } from '../formPage';

const { result } = figuresOf('ca/t2204');

/** Form T2204 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const t2204: FormPageSpec = {
  id: 't2204',
  name: 'Form T2204: EI overpayment',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  federal: true,
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
        'EI is only charged on pay up to a yearly limit, which is {max} in 2025. The form takes your insured pay, which is the pay EI counts, added up from all your T4 slips, and cuts it off at that limit. There is one exception. If you had no self-employment income and your insured pay is under {exempt}, the form enters zero, so none of it counts and all of your EI payments come back to you. The form also works out your insured pay minus {exempt}, never below zero. It uses that to decide your refund and your EI credit.',
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
        'EI payments are {rate} of the pay that EI counts, up to a top amount for the year. The form works out the most you should have paid. Then it compares that with what your employer took off your pay.',
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
        'If your employer took off more than the most you owe, the extra is an overpayment, and it comes back to you as a refund. If not, there is no refund. A refund is only paid if the overpayment is more than $1. Line 16 is a different amount. It is the EI credit figure, the smallest of three amounts on the form, and it goes onto line 31200 of your return and line 58300 of your provincial form.',
      example:
        'Your employer took off {taken}. The most you owe is {most}. The difference, your overpayment, is {extra}.',
      figures: {
        taken: result('$1,077.48', 't2204_premiums_deducted'),
        most: result('$1,077.48', 't2204_line_10'),
        extra: result('$0', 'ei_overpayment'),
      },
    },
  ],
};
