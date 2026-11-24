import { figuresOf, type FormPageSpec } from '../formPage';

const inc = figuresOf('ca-qc/tp1_income');
const u = figuresOf('ca-qc/tp1_schedule_u');
const wc201 = figuresOf('ca-qc/work_chart_201');
const net = figuresOf('ca-qc/tp1_net_income');
const wc401 = figuresOf('ca-qc/work_chart_401');
const cred = figuresOf('ca-qc/tp1_credits');
const tax = figuresOf('ca-qc/tp1_tax');
const tot = figuresOf('ca-qc/tp1_totals');

/** Form TP-1 in plain words, with Work Charts 201 and 401 as sections. The figures are the 2025 form's, at a $70,000 salary. */
export const tp1: FormPageSpec = {
  id: 'tp1',
  name: 'Form TP-1: Quebec Income Tax Return',
  province: 'ca-qc',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form TP-1: Quebec Income Tax Return, in plain words',
  description:
    'What the Quebec income tax return (Form TP-1) is for and what each part asks, in plain words, with a worked example for a $70,000 salary.',
  intro:
    'This is the Quebec income tax return. If you lived in Quebec at the end of the year, you file it with Revenu Québec, as well as your federal return. This page follows the form in the order it works.',
  sections: [
    {
      id: 'contributions',
      heading: 'Pension plan and parental insurance payments',
      lines: 'Lines 97–98.2',
      paragraph:
        "Your employer takes payments from your pay for Quebec's own programs and puts them on your RL-1 slip. Line 98 is your Quebec Pension Plan, or QPP, contribution, which builds up your future pension. Pay above a higher limit has a small second contribution, on line 98.2. Line 98.1 is the pay the plan counted. Line 97 is your Quebec Parental Insurance Plan, or QPIP, premium, which pays benefits when you have or adopt a child. You copy these from the slip.",
      example:
        'Your QPP contribution is {qpp}, which is {qppRate} of your pay between {qppStart} and {qppEnd}. Your QPIP premium is {qpip}, which is {qpipRate} of your pay.',
      figures: {
        qpp: inc.result('$4,256', 'tp1_qpp_contribution_line_98'),
        qppRate: inc.result('6.4%', 'tp1_qpp_contribution_line_98'),
        qppStart: u.result(
          '$3,500',
          'schedule_u_personal_qpp_exemption_line_13',
        ),
        qppEnd: u.result(
          '$71,300',
          'schedule_u_maximum_pensionable_earnings_line_14_1',
        ),
        qpip: inc.result('$345.80', 'tp1_qpip_premium_line_97'),
        qpipRate: inc.result('0.494%', 'tp1_qpip_premium_line_97'),
      },
    },
    {
      id: 'income',
      heading: 'Your income',
      lines: 'Lines 101–199',
      paragraph:
        'Your pay comes from the RL-1 slip your employer gives you. Line 101 is your employment income. The form has other lines for other kinds of income, such as pensions, interest, rent and business income. We do not use them. The form adds everything up as your total income.',
      example:
        'Your employment income of {employment} is your total income: {totalIncome}.',
      figures: {
        employment: inc.result('$70,000', 'tp1_employment_income_line_101'),
        totalIncome: inc.result('$70,000', 'tp1_total_income_line_199'),
      },
    },
    {
      id: 'work-deduction',
      heading: 'A deduction for workers (Work Chart 201)',
      lines: 'Line 201',
      paragraph:
        'If you work for pay, you get a deduction for workers. The form works it out on a work chart. It starts with your work income, which here is your employment income. It takes {workerRate} of that. The deduction cannot be more than a yearly maximum, so you get the smaller of the two amounts. The chart also adds a few other kinds of work income, such as business income, and takes off income that is already deducted elsewhere. We do not use those.',
      example:
        'Your work income is {workIncome}. {workerRate} of that is {workerBefore}. The most is {workerMax}, so your deduction is {workerDeduction}.',
      figures: {
        workIncome: wc201.result('$70,000', 'work_chart_201_line_8'),
        workerRate: wc201.result(
          '6%',
          'work_chart_201_deduction_before_maximum',
        ),
        workerBefore: wc201.printed('$4,200', 'gives CA$4200.0000'),
        workerMax: wc201.printed('$1,420', 'the maximum (CA$1420.00)'),
        workerDeduction: wc201.result(
          '$1,420',
          'work_chart_201_deduction_for_workers_line_9',
        ),
      },
    },
    {
      id: 'deductions',
      heading: 'Amounts taken off your income',
      lines: 'Lines 201–254',
      paragraph:
        'A deduction is an amount taken off your income before tax is worked out. Line 201 is your deduction for workers. Line 248 is your QPP deduction, from Schedule U, which is based on part of your QPP contribution. The form has many other deductions, such as RRSP payments, moving costs and support payments. We do not use them. The form adds them up on line 254.',
      example:
        'The deduction for workers is {workerDeduction}. The QPP deduction is {qppDeduction}. Together they make total deductions of {totalDeductions}.',
      figures: {
        workerDeduction: net.result(
          '$1,420',
          'tp1_deduction_for_workers_line_201',
        ),
        qppDeduction: net.result('$665', 'tp1_qpp_deduction_line_248'),
        totalDeductions: net.result('$2,085', 'tp1_total_deductions_line_254'),
      },
    },
    {
      id: 'net-income',
      heading: 'Your net income',
      lines: 'Lines 256–279',
      paragraph:
        'Your net income is your total income less your deductions. It is on line 275. Other lines adjust it for special cases, such as investment expenses. We do not use them. Net income also decides some other amounts, such as the drug insurance premium.',
      example:
        'Your total income of {totalIncome} less deductions of {totalDeductions} leaves a net income of {netIncome}.',
      figures: {
        totalIncome: net.result(
          '$70,000',
          'tp1_net_income_total_income_line_199',
        ),
        totalDeductions: net.result('$2,085', 'tp1_total_deductions_line_254'),
        netIncome: net.result('$67,915', 'tp1_net_income_line_275'),
      },
    },
    {
      id: 'taxable-income',
      heading: 'Your taxable income',
      lines: 'Lines 287–299',
      paragraph:
        'Taxable income is the part of your net income that tax is charged on. The form lets you take off a few more things first, such as losses from other years. We do not use them, so your taxable income is the same as your net income.',
      example:
        'The other deductions come to {otherDeductions}, so your taxable income is {taxableIncome}.',
      figures: {
        otherDeductions: net.result('$0', 'tp1_total_deductions_line_298'),
        taxableIncome: net.result('$67,915', 'tp1_taxable_income_line_299'),
      },
    },
    {
      id: 'tax',
      heading: 'Tax on your income, slice by slice (Work Chart 401)',
      lines: 'Line 401',
      paragraph:
        "Quebec does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The work chart finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice's rate on the rest of your income.",
      example:
        'Your income reaches the slice that starts at {bracketStart}. That slice is taxed at {bracketRate}. The tax on the slices below it comes to {taxBelow}. The {incomeAbove} of your income above {bracketStart} adds {taxAdded}. Tax on your taxable income: {taxOnIncome}.',
      figures: {
        bracketStart: wc401.result(
          '$53,255',
          'work_chart_401_lower_bound_line_3',
        ),
        bracketRate: wc401.result('19%', 'work_chart_401_column_rate_line_5'),
        taxBelow: wc401.result(
          '$7,455.70',
          'work_chart_401_tax_at_start_line_7',
        ),
        incomeAbove: wc401.result(
          '$14,660',
          'work_chart_401_income_over_lower_bound_line_4',
        ),
        taxAdded: wc401.result(
          '$2,785.40',
          'work_chart_401_tax_on_excess_line_6',
        ),
        taxOnIncome: wc401.result(
          '$10,241.10',
          'work_chart_401_income_tax_line_8',
        ),
      },
    },
    {
      id: 'credits',
      heading: 'Credits that lower your tax',
      lines: 'Lines 350–399',
      paragraph:
        'A credit lowers your tax bill. Most people get a basic personal amount ({basic} in 2025). The form has other amounts too, such as for age, living alone and retirement income. We do not use them. The form adds the amounts up, then takes {creditRate} of the total. That is your credit. Medical costs, gifts and union dues have their own lines and rates. We do not use those.',
      example:
        'Your total amount is {creditBase}. {creditRate} of that is {creditAmount}, so your credits come to {creditsTotal}.',
      figures: {
        basic: cred.result('$18,571', 'tp1_basic_personal_amount_line_350'),
        creditRate: cred.result('14%', 'tp1_line_377_1'),
        creditBase: cred.result('$18,571', 'tp1_line_377'),
        creditAmount: cred.result('$2,599.94', 'tp1_line_377_1'),
        creditsTotal: cred.result(
          '$2,599.94',
          'tp1_non_refundable_tax_credits_line_399',
        ),
      },
    },
    {
      id: 'tax-after-credits',
      heading: 'Your tax after credits',
      lines: 'Lines 401–432',
      paragraph:
        'Now the form takes your credits away from your tax. The tax can go down to zero, but not below it. The form has more lines here, for contributions to municipal political parties, spouse transfers and a few other credits. We do not use them.',
      example:
        'Your tax of {taxOnIncome} less credits of {creditsTotal} leaves {taxAfterCredits}.',
      figures: {
        taxOnIncome: tax.result(
          '$10,241.10',
          'tp1_income_tax_on_taxable_income_line_401',
        ),
        creditsTotal: tax.result(
          '$2,599.94',
          'tp1_non_refundable_tax_credits_line_406',
        ),
        taxAfterCredits: tax.result('$7,641.16', 'tp1_line_432'),
      },
    },
    {
      id: 'total',
      heading: 'What you owe Quebec',
      lines: 'Lines 432–479',
      paragraph:
        "Line 450 is your income tax and contributions. It adds your Quebec tax to other amounts you owe on the return. For a salary-only filer these are the premium for Quebec's prescription drug insurance plan (line 447, from Schedule K) and the health services fund contribution (line 446, from Schedule F). Then the form takes off tax already withheld and credits paid to you, such as the work premium. We do not use those. This site's take-home figure counts line 450, and your QPP and QPIP payments, but not credits paid to you.",
      example:
        'Your tax of {taxAfterCredits} plus the drug insurance premium of {drugPremium} comes to {total450}. The health services fund contribution is {hsf}. We take nothing off for tax already withheld or for credits paid to you, so the balance due on line 479 is {balanceDue}.',
      figures: {
        taxAfterCredits: tot.result('$7,641.16', 'tp1_totals_line_432'),
        drugPremium: tot.result('$755', 'tp1_drug_insurance_premium_line_447'),
        total450: tot.result(
          '$8,396.16',
          'tp1_income_tax_and_contributions_line_450',
        ),
        hsf: tot.result('$0', 'tp1_health_services_fund_line_446'),
        balanceDue: tot.result('$8,396.16', 'tp1_balance_due_line_479'),
      },
    },
  ],
};
