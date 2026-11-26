import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The Manitoba rates page: the wording of the rates page, with every figure a spec the Manitoba sweep resolves
 * (see `hubNotes.ts`). The words say "about" where the copy thread's text does. A form threshold's salary is worked
 * out from the form's taxable income (the nearest whole salary, as the facts of `engine_figures.py` say), where tax
 * starts and where a band ends are the engine's own edges, and the rate after each change is read at a sweep salary
 * inside the band it starts.
 */
const pool: Record<string, string> = {
  // Rules the forms print as words or round numbers, which no data of ours holds: declared, so a test can see them.
  cpp2Cents: 'l:4 cents',
  eightCents: 'l:8 cents',
  federalCents: 'l:13 cents',
  oneDollar: 'l:$1',
  // The two rates, and the peak: the rate after the change that raises it highest, the whole span it holds, then the top.
  lowMarginal: 'h:marginal@4000',
  peakMarginal: 'y:255000',
  peakFrom: 'f:fed_bracket_5_salary',
  peakTo: 'f:mb_bpa_end_salary',
  topMarginal: 'h:marginal@500000',
  keepTop: 'u:marginal@500000',
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
  // Manitoba tax starts, then federal tax.
  mbStartSalary: 'o:17000',
  mbStartRate: 'y:17000',
  mbBracket1: 'p:mb_bracket_1_rate',
  fedStartSalary: 'o:19000',
  fedStartRate: 'y:19000',
  fedBracket2: 'p:fed_bracket_2_rate',
  fedBasicAmount: 'f:fed_bpa',
  // The Family Tax Benefit.
  ftbMax: 'f:ftb_max',
  mbCreditRate: 'p:mb_credit_rate',
  ftbRate: 'p:benefit_rate',
  ftbTaxEffect: 't:ftb_tax_effect',
  ftbEndSalary: 'f:ftb_end_salary',
  ftbEndNi: 'f:ftb_end_ni',
  afterFtbRate: 'h:marginal@25000',
  // The brackets, Manitoba and federal.
  mbBracket2Salary: 'f:mb_bracket_2_salary',
  mbBracket2Rate: 'h:marginal@50000',
  mbBracket2: 'p:mb_bracket_2_rate',
  mbBracket2Ti: 'f:mb_bracket_2_ti',
  fedBracket2Salary: 'f:fed_bracket_2_salary',
  fedBracket2Rate: 'h:marginal@60000',
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  mbBracket3Salary: 'f:mb_bracket_3_salary',
  mbBracket3Rate: 'h:marginal@105000',
  mbBracket3: 'p:mb_bracket_3_rate',
  mbBracket3Ti: 'f:mb_bracket_3_ti',
  fedBracket3Salary: 'f:fed_bracket_3_salary',
  fedBracket3Rate: 'h:marginal@120000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  fedBracket4Salary: 'f:fed_bracket_4_salary',
  fedBracket4Rate: 'h:marginal@183000',
  fedBracket4: 'p:fed_bracket_4_rate',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
  fedBracket5Salary: 'f:fed_bracket_5_salary',
  fedBracket5Rate: 'h:marginal@300000',
  fedBracket5: 'p:fed_bracket_5_rate',
  fedBracket5Ti: 'f:fed_bracket_5_ti',
  // Manitoba's basic personal amount shrinking.
  mbBpaSalary: 'f:mb_bpa_start_salary',
  mbBpaRate: 'h:marginal@210000',
  mbBpaMax: 'f:mb_bpa_max',
  mbBpaStartNi: 'f:mb_bpa_start_ni',
  // Printed by T4127 and Worksheet MB428 (the engine holds it inside the worksheet), so declared.
  mbBpaEndNi: 'd:400000',
  mbBpaStep: 'x:mb_bpa_taper_points',
  mbBpaEndSalary: 'f:mb_bpa_end_salary',
  fedTop: 'p:fed_bracket_5_rate',
  mbTop: 'p:mb_bracket_3_rate',
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
  shiftFtb: 'f:shift_ftb',
  shiftMbBracket2: 'f:shift_mb_bracket_2',
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

/** A figure each table cell needs and the notes do not: the rows of the brackets and the limits. */
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
  fed3After: 'a:marginal@120000',
  fed4After: 'a:marginal@183000',
  fed5After: 'a:marginal@300000',
  mb1Ti: 'f:mb_bracket_1_ti',
  mb1: 'p:mb_bracket_1_rate',
  mb2Ti: 'f:mb_bracket_2_ti',
  mb2: 'p:mb_bracket_2_rate',
  mb2Sal: 'f:mb_bracket_2_salary',
  mb3Ti: 'f:mb_bracket_3_ti',
  mb3: 'p:mb_bracket_3_rate',
  mb3Sal: 'f:mb_bracket_3_salary',
  mb2After: 'a:marginal@50000',
  mb3After: 'a:marginal@105000',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  cea: 'f:cea',
  eiMaxPay: 'f:ei_stop',
  eiPremiumMax: 'n:ei_max_premium',
  cppMax: 'n:cpp_max',
  cpp2Max: 'f:cpp2_max',
  cppBase: 'p:cpp_base_rate',
  cppExtra: 'p:cpp_enhanced_rate',
};

const federalBrackets = [1, 2, 3, 4, 5].map((n) => [
  `{fed${n.toString()}Ti}`,
  `{fed${n.toString()}}`,
  n === 1 ? '' : `{fed${n.toString()}Sal}`,
  n === 1 ? '' : `{fed${n.toString()}After}`,
]);

const bracketHead = [
  'Taxable income from',
  'Rate',
  'Salary where it starts',
  'Marginal rate after',
];

export const manitobaRatesPage: RatesPageText = {
  title: 'Manitoba marginal and average tax rate by salary, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in Manitoba in 2026, from $0 to $500,000, and what causes every step.',
  heading: 'Manitoba marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In Manitoba the marginal rate is the share of your next dollar that goes to income tax, Canada Pension Plan and Employment Insurance. It climbs from about {lowMarginal} once you pay into the Canada Pension Plan (from {cppStart}) to a peak of {peakMarginal} between {peakFrom} and {peakTo}, then settles at {topMarginal}. The average rate climbs more slowly, to {avgAt500k} at {salary500k}. Manitoba has no health premium or surtax.',
    ),
    words(
      'Both rates count income tax (federal and Manitoba, so the Manitoba Family Tax Benefit counts), Canada Pension Plan in both tiers, and Employment Insurance as Form T2204 works it out. Credits paid to you when you file are not counted: the Canada workers benefit, the Employment Insurance refund, and the Manitoba credits on Form MB479. They are for a single person whose only income is a salary.',
    ),
  ],
  howToRead: [
    words(
      'The bracket thresholds printed on the tax forms are taxable incomes. The Manitoba basic personal amount, the Family Tax Benefit and the federal basic personal amount use net income. None of these is your salary. For a salary only, taxable income and net income are the same amount: your salary less the enhanced part of your Canada Pension Plan, which you deduct. The Canada Pension Plan and Employment Insurance limits are on pay, so they are already salaries.',
    ),
    words(
      'From {cppStart} up to {cppYmpe}, taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {cppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Cents} for every dollar, so taxable income is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. So a threshold on a form sits a little higher in salary: about {shiftFtb} higher at a net income of {ftbEndNi}, about {shiftMbBracket2} higher at a taxable income of {mbBracket2Ti}, and {taxableCut} higher from {yampe}. This page gives the salary.',
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
          'From {cppStart} to about {mbStartSalary} the rate is {cppEiRate}: Canada Pension Plan at {cppRate} and Employment Insurance at {eiRate}, with no income tax yet.',
          ['schedule8', 't2204'],
        ),
        words(
          'From about {mbStartSalary} the rate is {mbStartRate}: Manitoba’s first tax rate, {mbBracket1}, on top of the payments and the Family Tax Benefit shrinking (see below). Manitoba income tax starts before federal tax because the federal credits include the Canada employment amount, and Manitoba’s form has no such amount.',
          ['mb428'],
        ),
        words(
          'From about {fedStartSalary} the rate is {fedStartRate}: federal income tax starts as well. That is {mbStartRate} plus about {federalCents} of federal tax on each extra dollar. It is a total, not the federal rate of {fedBracket2}, which starts much higher. Federal tax begins above the basic amount of {fedBasicAmount}, because of the Canada employment amount and the pension and insurance credits.',
          ['t1'],
        ),
      ],
    },
    {
      heading: '$20,000 to $50,000',
      notes: [
        words(
          'The Manitoba Family Tax Benefit is an amount, up to {ftbMax}, that you add to your Manitoba credits, so it is worth {mbCreditRate} of that off your Manitoba tax. It shrinks by {ftbRate} of every dollar of net income and lowers your Manitoba tax. It is not paid to you as cash, and you do not need a spouse or child. It shrinks from the first dollar but costs you tax only once Manitoba tax starts, at about {mbStartSalary}, at about {ftbTaxEffect} of each extra dollar. By about {ftbEndSalary} of salary (a net income of {ftbEndNi}) it is gone, so the rate falls to {afterFtbRate}.',
          ['mb428a', 'mb428'],
        ),
        words(
          'From about {mbBracket2Salary} the rate is {mbBracket2Rate}: Manitoba’s second tax rate, {mbBracket2}, starts at a taxable income of {mbBracket2Ti}.',
          ['mb428'],
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
      ],
    },
    {
      heading: '$100,000 to $260,000',
      notes: [
        words(
          'From about {mbBracket3Salary} the rate is {mbBracket3Rate}: Manitoba’s third tax rate, {mbBracket3}, starts at a taxable income of {mbBracket3Ti}.',
          ['mb428'],
        ),
        words(
          'From about {fedBracket3Salary} the rate is {fedBracket3Rate}: the federal rate rises to {fedBracket3} at a taxable income of {fedBracket3Ti}.',
          ['t1'],
        ),
        words(
          'From about {fedBracket4Salary} the rate is {fedBracket4Rate}: the federal rate rises to {fedBracket4}. The federal basic personal amount also begins to shrink, which adds about {bpaTaperPoint} point to the rate.',
          ['t1'],
        ),
        words(
          'From about {mbBpaSalary} the rate is {mbBpaRate}: Manitoba’s basic personal amount, {mbBpaMax}, starts to shrink at a net income of {mbBpaStartNi}, which is about {mbBpaSalary} of salary. It shrinks to nothing by {mbBpaEndNi}, losing about {eightCents} of the amount for each dollar of net income, which costs about {mbBpaStep} of a point of tax.',
          ['mb428'],
        ),
      ],
    },
    {
      heading: 'About $260,000 and above',
      notes: [
        words(
          'From about {fedBracket5Salary} the rate is {fedBracket5Rate}: the federal rate rises to {fedBracket5} at a taxable income of {fedBracket5Ti}, and the federal basic personal amount has finished shrinking. This is the peak.',
          ['t1'],
        ),
        words(
          'From about {mbBpaEndSalary} Manitoba’s basic personal amount is gone, and the rate settles at {topMarginal}: the federal {fedTop} and Manitoba’s top rate, {mbTop}. The line is straight from there to {salary500k}. Of every extra dollar, {topMarginal} goes to tax, and you keep {keepTop}. At {salary500k} the average rate is {avgAt500k}.',
          ['mb428', 't1'],
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
      ...cells(federalBrackets),
      after: {
        ...note(
          'The lowest federal rate is {fedLowest} for the whole of 2026. In 2025 it was {fedLowestRatePrior}. The federal basic personal amount is {fedBpa}, and shrinks to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}.',
          tablePool,
        ),
      },
    },
    {
      heading: 'Manitoba brackets, 2026 (Form MB428)',
      caption: 'Manitoba brackets, 2026',
      head: bracketHead,
      ...cells([
        [
          '{mb1Ti}',
          '{mb1}',
          'tax starts at about {mbStartSalary}',
          '{mbStartRate}',
        ],
        ['{mb2Ti}', '{mb2}', '{mb2Sal}', '{mb2After}'],
        ['{mb3Ti}', '{mb3}', '{mb3Sal}', '{mb3After}'],
      ]),
      after: {
        ...note(
          'Manitoba’s brackets are not indexed for 2026. The credit rate is the lowest tax rate, {mbCreditRate}.',
          { ...pool, ...tablePool },
        ),
      },
    },
    {
      heading: 'Manitoba amounts that change with income',
      caption: 'Manitoba amounts that change with income',
      head: ['Amount', 'Figure', 'What it does'],
      ...cells([
        [
          'Manitoba basic personal amount',
          '{mbBpaMax} up to a net income of {mbBpaStartNi}, then shrinking to nothing at {mbBpaEndNi}',
          'Raises your rate by about {mbBpaStep} of a point from {mbBpaSalary} to {mbBpaEndSalary}.',
        ],
        [
          'Manitoba Family Tax Benefit',
          '{ftbMax} less {ftbRate} of net income, gone at a net income of {ftbEndNi}',
          'Adds to your Manitoba credits. Costs about {ftbTaxEffect} of tax for each extra dollar of net income between {mbStartSalary} and {ftbEndSalary}. It is not paid to you as cash.',
        ],
      ]),
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
