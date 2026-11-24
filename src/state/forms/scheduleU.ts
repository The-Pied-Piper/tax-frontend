import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca-qc/tp1_schedule_u');

/** Schedule U (Part B) in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const scheduleU: FormPageSpec = {
  id: 'schedule-u',
  name: 'Schedule U: Quebec Pension Plan (QPP) Contribution and Deduction',
  province: 'ca-qc',
  year: 2025,
  exampleSalary: '70000',
  title: 'Schedule U: QPP contribution and deduction, in plain words',
  description:
    'What Schedule U is for and how it works out your QPP deduction, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'Schedule U is where part of your Quebec Pension Plan, or QPP, payments becomes a tax deduction. You pay QPP out of your pay, and your employer reports the amount on your RL-1 slip. This page covers Part B, the part for people paid a salary.',
  sections: [
    {
      id: 'contribution',
      heading: 'Your QPP contribution',
      lines: 'Lines 10–11',
      paragraph:
        'Line 10 is the QPP you paid, copied from line 98 of your return. It cannot be more than a yearly maximum. The form then takes {share} of it. That is the extra part of your contribution, added to the plan to raise pensions. It is the most you can deduct for this part. The rest of your contribution is not deducted on this schedule.',
      example:
        'Your QPP contribution is {contribution}. {share} of it is {contributionShare}.',
      figures: {
        contribution: result('$4,256', 'schedule_u_line_10'),
        share: printed('15.625%', '15.625% of line 10'),
        contributionShare: result('$665', 'schedule_u_line_11'),
      },
    },
    {
      id: 'pay',
      heading: 'The pay the plan counts',
      lines: 'Lines 12–14',
      paragraph:
        'The plan counts your pay up to a yearly limit. It ignores the first part, called the personal exemption, because no contribution is charged on it. Line 14 is your pay up to the limit, less the exemption.',
      example:
        'Your pay is {pay}, which is under the limit of {limit}. Less the exemption of {exemption}, that leaves {payCounted}.',
      figures: {
        pay: result('$70,000', 'schedule_u_pensionable_salary_line_12'),
        limit: result(
          '$71,300',
          'schedule_u_maximum_pensionable_earnings_line_14_1',
        ),
        exemption: result(
          '$3,500',
          'schedule_u_personal_qpp_exemption_line_13',
        ),
        payCounted: result('$66,500', 'schedule_u_line_14'),
      },
    },
    {
      id: 'check',
      heading: 'How much you can deduct',
      lines: 'Lines 14.1–16',
      paragraph:
        'The form checks that your deduction is not too big. It works out the most pay the plan counts, less the exemption. It takes the smaller of that and your own pay figure. Then it takes {checkRate} of the smaller amount. This is the first part of your deduction: the smaller of that and the amount from line 11.',
      example:
        'The most the plan counts, less the exemption, is {maxCounted}. The smaller of that and {payCounted} is {smaller}. {checkRate} of it is {checkAmount}. The smaller of {contributionShare} and {checkAmount} is {line16}.',
      figures: {
        checkRate: printed('1%', '1% of 14.4'),
        maxCounted: result('$67,800', 'schedule_u_line_14_3'),
        payCounted: result('$66,500', 'schedule_u_line_14'),
        smaller: result('$66,500', 'schedule_u_line_14_4'),
        checkAmount: result('$665', 'schedule_u_line_15'),
        contributionShare: result('$665', 'schedule_u_line_11'),
        line16: result('$665', 'schedule_u_line_16'),
      },
    },
    {
      id: 'leftover',
      heading: 'Contribution above what your pay requires',
      lines: 'Lines 17–17.5',
      paragraph:
        'The form compares what you paid with what your pay required. If you paid more, the extra is left over. It also adds the second contribution shown on line 98.2 of your return, paid on pay above the first limit. If neither applies, nothing is left.',
      example:
        'Your contribution of {contribution} less the {required} your pay required leaves {leftover}. You have no second contribution, so the total is {total}.',
      figures: {
        contribution: result('$4,256', 'schedule_u_line_17'),
        required: result('$4,256', 'schedule_u_line_17_2'),
        leftover: result('$0', 'schedule_u_line_17_3'),
        total: result('$0', 'schedule_u_line_17_5'),
      },
    },
    {
      id: 'above-limit',
      heading: 'Pay above the first limit',
      lines: 'Lines 18.5–22',
      paragraph:
        'The plan has a second, higher limit, with a smaller extra contribution. The form works out how much of your pay is above the first limit. It takes {extraRate} of the smaller of that and the room up to the second limit. Your extra deduction cannot be more than what is left from the last step.',
      example:
        'Your pay is {pay}, so {above} of it is above the first limit of {limit}. The room up to the second limit is {room}. {extraRate} of the smaller amount is {extra}, so line 22 is {line22}.',
      figures: {
        pay: result('$70,000', 'schedule_u_line_18_5'),
        above: result('$0', 'schedule_u_line_18_7'),
        limit: result(
          '$71,300',
          'schedule_u_maximum_pensionable_earnings_line_14_1',
        ),
        room: result('$9,900', 'schedule_u_line_19'),
        extraRate: printed('4%', '4% of line 20'),
        extra: result('$0', 'schedule_u_line_21'),
        line22: result('$0', 'schedule_u_line_22'),
      },
    },
    {
      id: 'result',
      heading: 'Your QPP deduction',
      lines: 'Lines 22.1–23',
      paragraph:
        'Line 23 adds the two results. It is your deduction for QPP contributions on employment income. It goes to line 248 of your Quebec return. We do not use Part A, which is for stopping contributions, or Part C, which is for self-employed people.',
      example:
        '{line16} plus {line22} is {deduction}. It goes to line 248 of Form TP-1.',
      figures: {
        line16: result('$665', 'schedule_u_line_16'),
        line22: result('$0', 'schedule_u_line_22'),
        deduction: result('$665', 'schedule_u_line_23'),
      },
    },
  ],
};
