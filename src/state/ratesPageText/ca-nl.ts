import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The Newfoundland and Labrador rates page: the wording of the rates page (copy thread, CRA-reviewed), with every
 * figure a spec the Newfoundland and Labrador sweep resolves (see `hubNotes.ts`). The words say "about" where the copy
 * thread's text does; a bracket's salary is worked out exactly from the form's taxable income, and a band's edges are
 * the engine's own. The province has no health premium and no surtax, so there are no spike notes.
 */
const pool: Record<string, string> = {
  // Rules the forms print as words or round numbers, which no data of ours holds: declared, so a test can see them.
  cpp2Cents: 'l:4 cents',
  oneDollar: 'l:$1',
  zeroDollars: 'l:$0',
  indexRate: 'l:1.1%',
  fedLowestPct: 'p:fed_bracket_1_rate',
  // The two rates, at sweep salaries just after each change.
  lowMarginal: 'h:marginal@4000',
  topMarginal: 'h:marginal@300000',
  keepTop: 'u:marginal@300000',
  topStart: 'f:nl_bracket_6_salary',
  avgAt500k: 'h:average@500000',
  salary500k: 'd:500000',
  cppStart: 'f:cpp_start',
  // Employment Insurance and the $2,000 rule.
  eiStart: 'f:ei_exemption',
  eiFullSalary: 'f:ei_band_end',
  eiFullAmount: 'n:ei_band_top',
  zeroRate: 'h:marginal@1000',
  eiBandRate: 'h:marginal@2020',
  eiOnlyRate: 'h:marginal@3000',
  cppEiRate: 'h:marginal@12000',
  cppRate: 'p:cpp_rate',
  eiRate: 'p:ei_rate',
  eiStop: 'f:ei_stop',
  eiMax: 'n:ei_max_premium',
  afterEiRate: 'h:marginal@69000',
  // Federal tax starts.
  fedStartSalary: 'e:19000',
  fedFirstRate: 'h:marginal@20000',
  fedTaxPart: 'w:marginal@20000-12000',
  fedBracket2: 'p:fed_bracket_2_rate',
  // The provincial low-income tax reduction.
  reductionMax: 'f:reduction_max',
  reductionStartNi: 'f:reduction_start',
  reductionStartSalary: 'f:reduction_start_salary',
  reductionRate: 'p:reduction_rate',
  reductionCents: 't:reduction_rate',
  nlTaxShowsSalary: 'e:25000',
  lowIncomeBandRate: 'h:marginal@28000',
  nlBracket1: 'p:nl_bracket_1_rate',
  reductionEndSalary: 'e:30000',
  reductionEndNi: 'f:reduction_end_ni',
  afterReductionRate: 'h:marginal@31000',
  // The brackets, federal and provincial.
  nlBracket2Salary: 'f:nl_bracket_2_salary',
  nlBracket2Rate: 'h:marginal@46000',
  nlBracket2: 'p:nl_bracket_2_rate',
  nlBracket2Ti: 'f:nl_bracket_2_ti',
  fedBracket2Salary: 'f:fed_bracket_2_salary',
  fedBracket2Rate: 'h:marginal@60000',
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  nlBracket3Salary: 'f:nl_bracket_3_salary',
  nlBracket3Rate: 'h:marginal@91000',
  nlBracket3: 'p:nl_bracket_3_rate',
  nlBracket3Ti: 'f:nl_bracket_3_ti',
  fedBracket3Salary: 'f:fed_bracket_3_salary',
  fedBracket3Rate: 'h:marginal@119000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  nlBracket4Salary: 'f:nl_bracket_4_salary',
  nlBracket4Rate: 'h:marginal@161000',
  nlBracket4: 'p:nl_bracket_4_rate',
  nlBracket4Ti: 'f:nl_bracket_4_ti',
  fedBracket4Salary: 'f:fed_bracket_4_salary',
  fedBracket4Rate: 'h:marginal@183000',
  fedBracket4: 'p:fed_bracket_4_rate',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
  nlBracket5Salary: 'f:nl_bracket_5_salary',
  nlBracket5Rate: 'h:marginal@225000',
  nlBracket5: 'p:nl_bracket_5_rate',
  nlBracket5Ti: 'f:nl_bracket_5_ti',
  fedBracket5Salary: 'f:fed_bracket_5_salary',
  fedBracket5Rate: 'h:marginal@260000',
  fedBracket5: 'p:fed_bracket_5_rate',
  nlBracket6: 'p:nl_bracket_6_rate',
  nlBracket6Ti: 'f:nl_bracket_6_ti',
  nlHigherSalary: 'f:nl_bracket_7_salary',
  // The Canada Pension Plan.
  cppYmpe: 'f:cpp_ympe',
  yampe: 'f:yampe',
  cpp2Rate: 'p:cpp2_rate',
  afterCppRate: 'h:marginal@75000',
  afterCpp2Rate: 'h:marginal@86000',
  // How to read the salaries.
  taxableFactor: 'x:taxable_factor',
  taxableConstant: 'f:taxable_constant',
  taxableFactor2: 'x:taxable_factor_2',
  taxableConstant2: 'f:taxable_constant_2',
  taxableCut: 'f:taxable_cut',
  shiftReduction: 'f:shift_reduction',
  shiftNlBracket2: 'f:shift_nl_bracket_2',
};

function words(text: string, forms: CauseForm[] = []): RatesNote {
  return { ...note(text, pool), forms };
}

/** A table whose cells are words; its figures are the ones its cells use. */
function cells(rows: string[][]): {
  rows: string[][];
  figures: Record<string, string>;
} {
  const figures: Record<string, string> = {};
  for (const cell of rows.flat()) {
    for (const match of cell.matchAll(/\{([a-zA-Z0-9]+)\}/g)) {
      const name = match[1] ?? '';
      const spec = tablePool[name] ?? pool[name];
      if (spec !== undefined) figures[name] = spec;
    }
  }
  return { rows, figures };
}

/** A figure each table cell needs and the notes do not: the rows of the brackets. */
const tablePool: Record<string, string> = {
  fed1: 'p:fed_bracket_1_rate',
  fed1Ti: 'f:fed_bracket_1_ti',
  fed2Ti: 'f:fed_bracket_2_ti',
  fed2: 'p:fed_bracket_2_rate',
  fed2Sal: 'f:fed_bracket_2_salary',
  fed3Ti: 'f:fed_bracket_3_ti',
  fed3: 'p:fed_bracket_3_rate',
  fed3Sal: 'f:fed_bracket_3_salary',
  fed4Ti: 'f:fed_bracket_4_ti',
  fed4: 'p:fed_bracket_4_rate',
  fed4Sal: 'f:fed_bracket_4_salary',
  fed5Ti: 'f:fed_bracket_5_ti',
  fed5: 'p:fed_bracket_5_rate',
  fed5Sal: 'f:fed_bracket_5_salary',
  fed2After: 'a:marginal@60000',
  fed3After: 'a:marginal@119000',
  fed4After: 'a:marginal@183000',
  fed5After: 'a:marginal@260000',
  nl1: 'p:nl_bracket_1_rate',
  nl1Ti: 'f:nl_bracket_1_ti',
  nl2Ti: 'f:nl_bracket_2_ti',
  nl2: 'p:nl_bracket_2_rate',
  nl2Sal: 'f:nl_bracket_2_salary',
  nl3Ti: 'f:nl_bracket_3_ti',
  nl3: 'p:nl_bracket_3_rate',
  nl3Sal: 'f:nl_bracket_3_salary',
  nl4Ti: 'f:nl_bracket_4_ti',
  nl4: 'p:nl_bracket_4_rate',
  nl4Sal: 'f:nl_bracket_4_salary',
  nl5Ti: 'f:nl_bracket_5_ti',
  nl5: 'p:nl_bracket_5_rate',
  nl5Sal: 'f:nl_bracket_5_salary',
  nl6Ti: 'f:nl_bracket_6_ti',
  nl6: 'p:nl_bracket_6_rate',
  nl6Sal: 'f:nl_bracket_6_salary',
  nl7Ti: 'f:nl_bracket_7_ti',
  nl7: 'p:nl_bracket_7_rate',
  nl7Sal: 'f:nl_bracket_7_salary',
  nl8Ti: 'f:nl_bracket_8_ti',
  nl8: 'p:nl_bracket_8_rate',
  nl8Sal: 'f:nl_bracket_8_salary',
  nl2After: 'a:marginal@46000',
  nl3After: 'a:marginal@91000',
  nl4After: 'a:marginal@161000',
  nl5After: 'a:marginal@225000',
  nl6After: 'a:marginal@300000',
  nl7After: 'b:nl_bracket_7_marginal',
  nl8After: 'b:nl_bracket_8_marginal',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  cea: 'f:cea',
  nlBpa: 'f:nl_bpa',
  nlCreditRate: 'p:nl_credit_rate',
  eiMaxPay: 'f:ei_stop',
  eiPremiumMax: 'n:ei_max_premium',
  cppMax: 'n:cpp_max',
  cpp2Max: 'f:cpp2_max',
  cppBase: 'p:cpp_base_rate',
  cppExtra: 'p:cpp_enhanced_rate',
};

const federalRows = [1, 2, 3, 4, 5].map((n) => [
  `{fed${n.toString()}Ti}`,
  `{fed${n.toString()}}`,
  n === 1 ? '' : `{fed${n.toString()}Sal}`,
  n === 1 ? '' : `{fed${n.toString()}After}`,
]);

/** The provincial rows: the last two start past the chart, which says so beside the salary. */
const provincialRows = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => [
  `{nl${n.toString()}Ti}`,
  `{nl${n.toString()}}`,
  n === 1
    ? ''
    : n >= 7
      ? `{nl${n.toString()}Sal} (past this chart)`
      : `{nl${n.toString()}Sal}`,
  n === 1 ? '' : `{nl${n.toString()}After}`,
]);

const bracketHead = [
  'Taxable income from',
  'Rate',
  'Salary where it starts',
  'Marginal rate after',
];

export const newfoundlandAndLabradorRatesPage: RatesPageText = {
  title: 'Newfoundland and Labrador marginal and average tax rate, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in Newfoundland and Labrador in 2026, from $0 to $500,000, and what causes every step.',
  heading:
    'Newfoundland and Labrador marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In Newfoundland and Labrador the marginal rate is the share of your next dollar that goes to income tax, Canada Pension Plan and Employment Insurance. It climbs from about {lowMarginal} once you pay into the Canada Pension Plan (from {cppStart}) to {topMarginal} above {topStart}, with a wide band of {lowIncomeBandRate} where the provincial low-income tax reduction is lost. The average rate climbs more slowly, to {avgAt500k} at {salary500k}. There are no health premium or surtax steps.',
    ),
    words(
      'Both rates count income tax (federal and Newfoundland and Labrador, so the provincial low-income tax reduction counts), Canada Pension Plan in both tiers, and Employment Insurance as Form T2204 works it out. Credits paid to you when you file are not counted: the Canada workers benefit and the Employment Insurance refund. They are for a single person whose only income is a salary.',
    ),
  ],
  howToRead: [
    words(
      'The bracket thresholds printed on the tax forms are taxable incomes. The low-income tax reduction uses adjusted family income, and the federal basic personal amount uses net income. None of these is your salary. For a salary only, taxable income, adjusted family income and net income are all the same amount: your salary less the enhanced part of your Canada Pension Plan, which you deduct. The Canada Pension Plan and Employment Insurance limits are on pay, so they are already salaries.',
    ),
    words(
      'From {cppStart} up to {cppYmpe}, taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {cppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Cents} for every dollar, so taxable income is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. So a threshold on a form sits a little higher in salary: about {shiftReduction} higher at an income of {reductionStartNi}, about {shiftNlBracket2} higher at a taxable income of {nlBracket2Ti}, and {taxableCut} higher from {yampe}. This page gives the salary.',
    ),
  ],
  groups: [
    {
      heading: 'Up to $20,000',
      notes: [
        words(
          'Up to {eiStart} the marginal rate is {zeroRate}. From {eiStart} to about {eiFullSalary} it is {eiBandRate}, because the Employment Insurance counted rises by {oneDollar} for every {oneDollar} of salary, until it reaches about {eiFullAmount}.',
          ['t2204'],
        ),
        words(
          'From about {eiFullSalary} to {cppStart}, only Employment Insurance is taken, {eiOnlyRate} of each extra dollar. At {cppStart} the Canada Pension Plan starts, and the rate steps up.',
          ['t2204', 'schedule8'],
        ),
        words(
          'From {cppStart} to about {fedStartSalary} the rate is {cppEiRate}: Canada Pension Plan at {cppRate} and Employment Insurance at {eiRate}, with no income tax yet.',
          ['schedule8', 't2204'],
        ),
        words(
          'It is {fedFirstRate} from about {fedStartSalary}, when federal income tax starts. That is {cppEiRate} for the pension and insurance payments plus about {fedTaxPart} of federal tax ({fedLowestPct} of each extra dollar, less the credits that grow with it). It is a total, not a tax rate. The federal {fedBracket2} rate starts much higher, at a taxable income of {fedBracket2Ti}. No Newfoundland and Labrador tax shows yet, because its low-income tax reduction and credits cover it.',
          ['t1', 'nl428'],
        ),
      ],
    },
    {
      heading: '$20,000 to $50,000',
      notes: [
        words(
          'The Newfoundland and Labrador low-income tax reduction lowers your provincial tax, by up to {reductionMax} for a single person. It is worked out on adjusted family income. It starts to shrink at {reductionStartNi}, about {reductionStartSalary} of salary, by {reductionRate} of every dollar of income above that. Until about {nlTaxShowsSalary} what is left still cancels all your provincial tax, so the rate does not change.',
          ['nl428'],
        ),
        words(
          'From about {nlTaxShowsSalary} to about {reductionEndSalary} the rate is {lowIncomeBandRate}: the provincial first tax rate, {nlBracket1}, plus the reduction you lose, about {reductionCents} of each extra dollar, on top of the federal tax and the payments. It is higher than before and after because provincial tax shows while the reduction is still shrinking.',
          ['nl428'],
        ),
        words(
          'The reduction is gone at about {reductionEndSalary} of salary (an adjusted family income of {reductionEndNi}), and the rate falls to {afterReductionRate}.',
          ['nl428'],
        ),
        words(
          'From about {nlBracket2Salary} the rate is {nlBracket2Rate}: the second provincial rate, {nlBracket2}, starts at a taxable income of {nlBracket2Ti}. Newfoundland and Labrador has no health premium or surtax.',
          ['nl428'],
        ),
      ],
    },
    {
      heading: '$50,000 to $100,000',
      notes: [
        words(
          'From about {fedBracket2Salary} the rate is {fedBracket2Rate}: the federal rate rises to {fedBracket2} at a taxable income of {fedBracket2Ti}.',
          ['t1'],
        ),
        words(
          'Employment Insurance stops at {eiStop}, at most {eiMax} a year, and the rate falls to {afterEiRate}.',
          ['t2204'],
        ),
        words(
          'The main Canada Pension Plan amount stops at {cppYmpe}. A second tier takes {cpp2Rate} of each dollar from there to {yampe}, so the rate falls to {afterCppRate}, and then to {afterCpp2Rate} at {yampe}, when that tier stops.',
          ['schedule8'],
        ),
        words(
          'From about {nlBracket3Salary} the rate is {nlBracket3Rate}: the third provincial rate, {nlBracket3}, starts at a taxable income of {nlBracket3Ti}.',
          ['nl428'],
        ),
      ],
    },
    {
      heading: '$100,000 to $260,000',
      notes: [
        words(
          'From about {fedBracket3Salary} the rate is {fedBracket3Rate}: the federal rate rises to {fedBracket3} at a taxable income of {fedBracket3Ti}.',
          ['t1'],
        ),
        words(
          'From about {nlBracket4Salary} the rate is {nlBracket4Rate}: the fourth provincial rate, {nlBracket4}, starts at a taxable income of {nlBracket4Ti}.',
          ['nl428'],
        ),
        words(
          'From about {fedBracket4Salary} the rate is {fedBracket4Rate}: the federal rate rises to {fedBracket4}. The federal basic personal amount also begins to shrink, which adds about {bpaTaperPoint} point to the rate.',
          ['t1'],
        ),
        words(
          'From about {nlBracket5Salary} the rate is {nlBracket5Rate}: the fifth provincial rate, {nlBracket5}, starts at a taxable income of {nlBracket5Ti}.',
          ['nl428'],
        ),
      ],
    },
    {
      heading: 'About $260,000 and above',
      notes: [
        words(
          'From about {fedBracket5Salary} the rate is {fedBracket5Rate}: the federal rate rises to {fedBracket5}, and the federal basic personal amount has finished shrinking.',
          ['t1'],
        ),
        words(
          'From about {topStart} the line is straight: of every extra dollar, {topMarginal} goes to tax, and you keep {keepTop}. The sixth provincial rate, {nlBracket6}, starts at a taxable income of {nlBracket6Ti}. At {salary500k} the average rate is {avgAt500k}. The form adds higher provincial rates above {nlHigherSalary}, which is past this chart.',
          ['nl428', 't1'],
        ),
      ],
    },
  ],
  tables: [
    {
      heading: 'Federal brackets, 2026 (Form T1)',
      before: words(
        'The tax forms print each bracket as a taxable income. This table adds the salary where it starts and the marginal rate just after, so you can match the chart to the forms.',
      ),
      caption: 'Federal brackets, 2026',
      head: bracketHead,
      ...cells(federalRows),
      after: {
        ...note(
          'The lowest federal rate is {fedLowest} for the whole of 2026. In 2025 it was {fedLowestRatePrior}. The federal basic personal amount is {fedBpa}, and shrinks to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}. The {fedFirstRate} in the chart from {fedStartSalary} to {nlTaxShowsSalary} is a total ({cppEiRate} of pension and insurance payments plus {fedTaxPart} of federal tax). It is not the federal bracket rate, which is also {fedBracket2} but starts at a taxable income of {fedBracket2Ti}.',
          { ...pool, ...tablePool },
        ),
      },
    },
    {
      heading: 'Newfoundland and Labrador brackets, 2026 (Form NL428)',
      caption: 'Newfoundland and Labrador brackets, 2026',
      head: bracketHead,
      ...cells(provincialRows),
      after: note(
        'The basic personal amount is {nlBpa}, and the credit rate is the lowest tax rate, {nlCreditRate}. There is no Newfoundland and Labrador Canada employment amount.',
        tablePool,
      ),
    },
    {
      heading: 'Low-income tax reduction, 2026 (Form NL428)',
      before: words(
        'The reduction is taken off your provincial tax if your income is low. It cannot take the tax below zero, and it is not paid to you as cash. A single filer gets the amount without the extra for a spouse or dependant.',
      ),
      caption: 'Low-income tax reduction, 2026',
      head: ['Item', 'Figure'],
      ...cells([
        ['Most it can be', '{reductionMax}'],
        [
          'Starts to shrink at an adjusted family income of',
          '{reductionStartNi} (salary about {reductionStartSalary})',
        ],
        ['Shrinks by', '{reductionRate} of every dollar above that'],
        [
          'Provincial tax first shows at a salary of about',
          '{nlTaxShowsSalary}',
        ],
        [
          'Gone at an adjusted family income of',
          '{reductionEndNi} (salary about {reductionEndSalary})',
        ],
        [
          'Rate from {nlTaxShowsSalary} until it is gone',
          '{lowIncomeBandRate}, then {afterReductionRate}',
        ],
      ]),
      after: words(
        'We could not find the 2026 reduction amounts printed, so they are the 2025 form’s amounts raised by the 2026 index rate of {indexRate}.',
      ),
    },
    {
      heading:
        'Canada Pension Plan and Employment Insurance, 2026 (Schedule 8, Form T2204)',
      caption: 'Canada Pension Plan and Employment Insurance, 2026',
      head: ['Item', 'Figure'],
      ...cells([
        ['Employment Insurance rate', '{eiRate}'],
        ['Most pay counted for Employment Insurance', '{eiMaxPay}'],
        ['Most Employment Insurance a year', '{eiPremiumMax}'],
        [
          'The {eiStart} rule',
          'Nothing is counted up to {eiStart}. Then {oneDollar} for every {oneDollar} of salary, until {eiFullAmount} at about {eiFullSalary}.',
        ],
        ['Canada Pension Plan starts above', '{cppStart}'],
        [
          'Canada Pension Plan rate',
          '{cppRate}, made up of {cppBase} base and {cppExtra} extra',
        ],
        ['Main amount stops at', '{cppYmpe}, at most {cppMax} a year'],
        ['Second tier rate', '{cpp2Rate} of pay from {cppYmpe} to {yampe}'],
        ['Second tier stops at', '{yampe}, at most {cpp2Max} a year'],
      ]),
    },
  ],
};
