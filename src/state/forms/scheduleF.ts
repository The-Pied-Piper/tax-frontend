import { figuresOf, type FormPageSpec } from '../formPage';

const { result } = figuresOf('ca-qc/tp1_schedule_f');

/** Schedule F (Quebec) in plain words. The figures are the 2025 form's, at a $70,000 salary. */
export const scheduleF: FormPageSpec = {
  id: 'schedule-f',
  name: 'Schedule F: Contribution to the Health Services Fund',
  province: 'ca-qc',
  year: 2025,
  exampleSalary: '70000',
  title: 'Schedule F: Health Services Fund, in plain words',
  description:
    'What Schedule F is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'Schedule F works out a contribution to the Health Services Fund, which helps pay for health care. It is charged on income that is not employment income, such as investment income. If your income is only a salary, you pay nothing, so your contribution is zero.',
  sections: [
    {
      id: 'start',
      heading: 'Income other than your pay',
      lines: 'Lines 10–18',
      paragraph:
        'The schedule starts with your total income. It takes off your employment income, which is not charged here. What is left is the income that might be charged. If it is a small amount, or nothing, you pay no contribution.',
      example:
        'Your total income is {totalIncome} and your employment income is {employmentIncome}. What is left is {leftOver}.',
      figures: {
        totalIncome: result('$70,000', 'tp1_schedule_f_income_line_10'),
        employmentIncome: result(
          '$70,000',
          'tp1_schedule_f_employment_income_total_line_16',
        ),
        leftOver: result('$0', 'tp1_schedule_f_income_line_18'),
      },
    },
    {
      id: 'other-income',
      heading: 'Other income that counts',
      lines: 'Lines 20–36',
      paragraph:
        'The form then takes off some kinds of income that are not charged, such as old age security, social assistance, support payments you received, income replacement payments and scholarships. For dividends it takes off only the amount added for tax. What is left is line 36.',
      example:
        'You have none of these, so they come to {otherIncome} and line 36 is {line36}.',
      figures: {
        otherIncome: result(
          '$0',
          'tp1_schedule_f_lines_20_to_33_total_line_34',
        ),
        line36: result('$0', 'tp1_schedule_f_income_line_36'),
      },
    },
    {
      id: 'deductions',
      heading: 'Deductions',
      lines: 'Lines 41–70',
      paragraph:
        'The form takes off deductions that apply to that income, such as support payments you made and carrying charges. What is left is the income the contribution is charged on.',
      example:
        'You have no such deductions ({deductions}), so the income charged is {line70}.',
      figures: {
        deductions: result('$0', 'tp1_schedule_f_deductions_line_68'),
        line70: result('$0', 'tp1_schedule_f_income_subject_line_70'),
      },
    },
    {
      id: 'contribution',
      heading: 'Your contribution',
      lines: 'Lines 76–82',
      paragraph:
        'The contribution is a small percentage of the income charged above a set amount, up to a most you can pay in a year. We do not fill in this part, because with no income to charge it on the contribution is zero. The result goes to line 446 of your Québec return.',
      example:
        'Your income charged is {line70}, so your contribution is {line82}. It goes to line 446 of Form TP-1.',
      figures: {
        line70: result('$0', 'tp1_schedule_f_income_subject_line_70'),
        line82: result('$0', 'tp1_schedule_f_contribution_line_82'),
      },
    },
  ],
};
