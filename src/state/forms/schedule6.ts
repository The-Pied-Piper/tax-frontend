import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca/schedule_6');

/** Schedule 6 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const schedule6: FormPageSpec = {
  id: 'schedule-6',
  name: 'Schedule 6: Canada Workers Benefit',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  title: 'Schedule 6: Canada Workers Benefit, in plain words',
  description:
    'What Schedule 6 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'The Canada Workers Benefit is a payment for people who work but earn low pay. It gets smaller as your income rises. At $70,000 it pays nothing.',
  sections: [
    {
      id: 'earnings',
      heading: 'What you earned from work',
      lines: 'Lines 1–6',
      paragraph:
        'The form starts with what you earned from working. It uses this to work out how much benefit you could get.',
      example: 'Your pay from work is {pay}.',
      figures: {
        pay: result('$70,000', 'cwb_family_working_income'),
      },
    },
    {
      id: 'benefit',
      heading: 'The most you could get',
      lines: 'Lines 17–22',
      paragraph:
        'You get nothing on the first {base} you earn. After that, the form gives you {rate} of the rest, up to a most of {max}.',
      example:
        'Your pay less {base} is {over}. {rate} of that is {share}, which is more than the most. So the benefit before income is checked is {basic}.',
      figures: {
        base: result('$3,000', 'cwb_base_amount'),
        rate: printed('27%', '27% of line 18'),
        max: result('$1,633', 'cwb_maximum'),
        over: result('$67,000', 'cwb_working_income_over_base_amount'),
        share: result('$18,090', 'cwb_working_income_rate_line_20'),
        basic: result('$1,633', 'cwb_basic_benefit_line_22'),
      },
    },
    {
      id: 'income',
      heading: 'Less benefit as income rises',
      lines: 'Lines 7–15 and 24–28',
      paragraph:
        'The benefit shrinks as your income goes up. Once your income is over {threshold}, the form takes away {rate} of the part above it. If that takes away all of the benefit, you get nothing.',
      example:
        'Your income is {income}, which is {over} over {threshold}. {rate} of that is {cut}. {basic} less {cut} is below zero, so the benefit is {benefit}.',
      figures: {
        threshold: result('$26,855', 'cwb_reduction_threshold'),
        rate: printed('15%', '15% of line 25'),
        income: result('$69,335', 'adjusted_family_net_income'),
        over: result('$42,480', 'cwb_net_income_over_base_amount'),
        cut: result('$6,372', 'cwb_reduction_line_27'),
        basic: result('$1,633', 'cwb_basic_benefit_line_22'),
        benefit: result('$0', 'cwb_benefit_line_28'),
      },
    },
  ],
};
