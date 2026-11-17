import { figuresOf, type FormPageSpec } from '../formPage';

const { result, printed } = figuresOf('ca/schedule_8');

/** Schedule 8 in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const schedule8: FormPageSpec = {
  id: 'schedule-8',
  name: 'Schedule 8: Canada Pension Plan',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  federal: true,
  title: 'Schedule 8: Canada Pension Plan, in plain words',
  description:
    'What Schedule 8 is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This form works out the contributions you were required to pay into the Canada Pension Plan and whether you overpaid. The Canada Pension Plan is the pension plan that most people who work outside Quebec pay into. It also says where those payments go on your tax return.',
  sections: [
    {
      id: 'months',
      heading: 'Months you paid in',
      lines: 'Lines A, B, D and E',
      paragraph:
        'The form starts with how many months you paid into the pension plan. For a full year that is {months}. The number of months sets three amounts. One is the limit for the main payment. The next is a higher limit, the most pay the plan counts at all. The last is a first slice of pay that is not counted.',
      example:
        'For {months} months the limits are {first}, {second} and {exemption}.',
      figures: {
        months: printed('12', '12 months'),
        first: result('$71,300', 'cpp_maximum_pensionable_earnings'),
        second: result(
          '$81,200',
          'cpp_additional_maximum_pensionable_earnings',
        ),
        exemption: result('$3,500', 'cpp_basic_exemption'),
      },
    },
    {
      id: 'earnings',
      heading: 'Pay the plan counts',
      lines: 'Lines 1–2',
      paragraph:
        'Only part of your pay counts for the pension plan. The plan calls it pensionable earnings, which just means the pay the plan takes payments from. The form takes the smaller of your pay and the higher limit.',
      example:
        'Your pay is {pay}, which is less than {limit}, so {counted} counts.',
      figures: {
        pay: result('$70,000', 't4_cpp_pensionable_earnings_outside_quebec'),
        limit: result('$81,200', 'cpp_additional_maximum_pensionable_earnings'),
        counted: result('$70,000', 'cpp_part_3_line_2'),
      },
    },
    {
      id: 'second-contribution',
      heading: 'The second, smaller payment',
      lines: 'Lines 4 and 22',
      paragraph:
        'Pay above the first limit of {limit} is charged a second payment at {rate}. It only applies to the part of your pay above that limit. If your pay is below the limit, there is nothing to pay here.',
      example:
        'Your pay is under {limit}, so the part above it is {above}. The second payment is {second}.',
      figures: {
        limit: result('$71,300', 'cpp_maximum_pensionable_earnings'),
        rate: printed('4%', '4% of the part of line 4'),
        above: result('$0', 'cpp_part_3_line_4'),
        second: result('$0', 'cpp_part_3_line_22'),
      },
    },
    {
      id: 'contribution',
      heading: 'Your main payment',
      lines: 'Lines 5–12',
      paragraph:
        'The first {exemption} of your pay is not counted. Pay above that, up to a pay of {first}, is charged at {baseRate}. That is your base payment. A further {extraRate} of the same amount is the extra part, which is treated differently on your return.',
      example:
        'Your pay is under {first}, so none of it is cut off by the limit. Your pay less {exemption} is {rest}. {baseRate} of that is {base}. {extraRate} of it is {extra}.',
      figures: {
        exemption: result('$3,500', 'cpp_basic_exemption'),
        first: result('$71,300', 'cpp_maximum_pensionable_earnings'),
        baseRate: printed('4.95%', '4.95% of the part of line 7'),
        extraRate: printed('1%', '1% of the part of line 7'),
        rest: result('$66,500', 'cpp_part_3_line_7'),
        base: result('$3,291.75', 'cpp_part_3_line_11'),
        extra: result('$665', 'cpp_part_3_line_12'),
      },
    },
    {
      id: 'on-return',
      heading: 'Where the payments go on your return',
      lines: 'Lines 25 and 28',
      paragraph:
        'The base payment goes on line 30800 and becomes a credit, which is a discount on your tax. The extra part, plus any second payment, goes on line 22215 and is taken off your income before tax is worked out.',
      example:
        'The base payment of {base} goes to a credit. The extra part of {extra}, plus the second payment of {second}, comes off your income.',
      figures: {
        base: result(
          '$3,291.75',
          'schedule_8_cpp_base_contributions_on_return',
        ),
        extra: result(
          '$665',
          'schedule_8_cpp_enhanced_contributions_on_return',
        ),
        second: result('$0', 'cpp_part_3_line_22'),
      },
    },
  ],
};
