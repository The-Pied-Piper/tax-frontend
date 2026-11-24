import { figuresOf, type FormPageSpec } from '../formPage';

const { result } = figuresOf('ca-qc/tp1_schedule_k');

/** Schedule K in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const scheduleK: FormPageSpec = {
  id: 'schedule-k',
  name: 'Schedule K: Premium Payable Under the Quebec Prescription Drug Insurance Plan',
  province: 'ca-qc',
  year: 2025,
  exampleSalary: '70000',
  title:
    'Schedule K: Quebec Prescription Drug Insurance Premium, in plain words',
  description:
    'What Schedule K is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    "Quebec's public drug insurance plan covers people who are not in a group plan, usually one through work. If that is you, you pay a yearly premium when you file your Quebec return. This schedule works it out. We assume you have no group plan.",
  sections: [
    {
      id: 'income',
      heading: 'The income used to work out the premium',
      lines: 'Lines 36–48',
      paragraph:
        'The premium depends on your income. The schedule starts with your net income from your return. We assume you have no spouse. It takes off a starting amount, which is higher if you have children. What is left is the income the premium is worked out on. If nothing is left, you pay no premium.',
      example:
        'Your net income of {netIncome} less the starting amount of {startAmount} leaves {premiumIncome}.',
      figures: {
        netIncome: result('$67,915', 'schedule_k_net_income_line_36'),
        startAmount: result('$19,890', 'schedule_k_amount_line_41'),
        premiumIncome: result('$48,025', 'schedule_k_premium_income_line_48'),
      },
    },
    {
      id: 'months',
      heading: 'Months you do not pay',
      lines: 'Lines 50–62',
      paragraph:
        'You do not pay the premium for months when a group plan covered your drug costs. It can be a plan through your work, your spouse, your father or your mother. Several other situations also count, such as being under 18, being a full-time student aged 18 to 25 with no spouse, or getting last-resort financial assistance. A month counts if the situation lasted at least one day of it. We ask only about the group plan, and we assume you have none, so no months are taken off.',
      example: 'No group plan is claimed, so no months are taken off.',
      figures: {},
    },
    {
      id: 'premium',
      heading: 'Working out the premium',
      lines: 'Lines 77–90',
      paragraph:
        'The premium goes up with your income. At lower incomes the schedule takes a share of the income over a starting amount and adds a fixed amount. Above the top step, the form skips that and sets the premium at its yearly top figure. It then takes off months you do not pay. You cannot pay more than the most for 2025, so the form takes the smaller figure.',
      example:
        'Your income used for the premium is {premiumIncome}, which is above the top step. So the form enters the top figure, {line83}. No months are taken off, so it stays {line86}. The most for 2025 is {maximum}, which is less, so your premium is {premium}.',
      figures: {
        premiumIncome: result('$48,025', 'schedule_k_premium_income_line_48'),
        line83: result('$766', 'schedule_k_column_premium_line_83'),
        line86: result('$766', 'schedule_k_premium_after_months_line_86'),
        maximum: result('$755', 'schedule_k_maximum_premium_line_87'),
        premium: result('$755', 'schedule_k_premium_line_90'),
      },
    },
    {
      id: 'total',
      heading: 'Your premium',
      lines: 'Line 98',
      paragraph:
        'Your premium goes to line 447 of your Quebec return, where it is added to your tax. This site counts it in your take-home pay, because you pay it when you file.',
      example: 'Your premium is {premium}. It goes to line 447 of Form TP-1.',
      figures: {
        premium: result('$755', 'schedule_k_premium_payable_line_98'),
      },
    },
  ],
};
