import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The Alberta rates page: the wording of the rates page, with every figure a spec the Alberta sweep resolves
 * (see `hubNotes.ts`). Same shape as Ontario's; Alberta has no health premium, surtax or low-income credit that bends
 * the line, so its notes are the federal brackets, Alberta's six brackets, and the Employment Insurance and Canada Pension
 * Plan steps. The words say "about" where the copy thread's text does; a bracket's salary is worked out exactly from
 * the form's taxable income, and a band's edges are the engine's own (the salary specs `e:` and `o:`).
 */
const pool: Record<string, string> = {
  // Rules the forms print as words or round numbers, which no data of ours holds: declared, so a test can see them.
  cpp2Cents: 'l:4 cents',
  oneDollar: 'l:$1',
  fedLowestPct: 'p:fed_bracket_1_rate',
  // The two rates, at sweep salaries just after each change.
  lowMarginal: 'h:marginal@4000',
  topMarginal: 'h:marginal@375000',
  keepTop: 'u:marginal@375000',
  topStart: 'f:ab_bracket_6_salary',
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
  // Federal tax starts, and the federal brackets.
  fedStartSalary: 'e:19000',
  fedFirstRate: 'h:marginal@20000',
  fedTaxPart: 'w:marginal@20000-12000',
  fedBasicAmount: 'f:fed_bpa',
  fedBracket2: 'p:fed_bracket_2_rate',
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  fedBracket2Salary: 'f:fed_bracket_2_salary',
  fedBracket2Rate: 'h:marginal@60000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  fedBracket3Salary: 'f:fed_bracket_3_salary',
  fedBracket3Rate: 'h:marginal@119000',
  fedBracket4: 'p:fed_bracket_4_rate',
  fedBracket4Salary: 'f:fed_bracket_4_salary',
  fedBracket4Rate: 'h:marginal@183000',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
  fedBracket5: 'p:fed_bracket_5_rate',
  fedBracket5Ti: 'f:fed_bracket_5_ti',
  fedBracket5Salary: 'f:fed_bracket_5_salary',
  fedBracket5Rate: 'h:marginal@260000',
  // Alberta tax starts, and Alberta's brackets.
  abStartSalary: 'e:24000',
  abStartRate: 'y:24000',
  ab1: 'p:ab_bracket_1_rate',
  abCreditRate: 'p:ab_credit_rate',
  abBracket2: 'p:ab_bracket_2_rate',
  abBracket2Ti: 'f:ab_bracket_2_ti',
  abBracket2Salary: 'f:ab_bracket_2_salary',
  abBracket2Rate: 'h:marginal@62000',
  abBracket3: 'p:ab_bracket_3_rate',
  abBracket3Ti: 'f:ab_bracket_3_ti',
  abBracket3Salary: 'f:ab_bracket_3_salary',
  abBracket3Rate: 'h:marginal@156000',
  abBracket4: 'p:ab_bracket_4_rate',
  abBracket4Ti: 'f:ab_bracket_4_ti',
  abBracket4Salary: 'f:ab_bracket_4_salary',
  abBracket4Rate: 'h:marginal@187000',
  abBracket5: 'p:ab_bracket_5_rate',
  abBracket5Ti: 'f:ab_bracket_5_ti',
  abBracket5Salary: 'f:ab_bracket_5_salary',
  abBracket5Rate: 'h:marginal@248000',
  abTop: 'p:ab_bracket_6_rate',
  abTopTi: 'f:ab_bracket_6_ti',
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
  shiftFedBracket2: 'f:shift_fed_bracket_2',
  shiftAbBracket2: 'f:shift_ab_bracket_2',
};

function words(text: string, forms: CauseForm[] = []): RatesNote {
  return { ...note(text, pool), forms };
}

/** A figure each table cell needs and the notes do not: the rows of the brackets, and the limits. */
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
  ab1Ti: 'f:ab_bracket_1_ti',
  ab2Ti: 'f:ab_bracket_2_ti',
  ab2: 'p:ab_bracket_2_rate',
  ab2Sal: 'f:ab_bracket_2_salary',
  ab3Ti: 'f:ab_bracket_3_ti',
  ab3: 'p:ab_bracket_3_rate',
  ab3Sal: 'f:ab_bracket_3_salary',
  ab4Ti: 'f:ab_bracket_4_ti',
  ab4: 'p:ab_bracket_4_rate',
  ab4Sal: 'f:ab_bracket_4_salary',
  ab5Ti: 'f:ab_bracket_5_ti',
  ab5: 'p:ab_bracket_5_rate',
  ab5Sal: 'f:ab_bracket_5_salary',
  ab6Ti: 'f:ab_bracket_6_ti',
  ab6: 'p:ab_bracket_6_rate',
  ab6Sal: 'f:ab_bracket_6_salary',
  ab2After: 'a:marginal@62000',
  ab3After: 'a:marginal@156000',
  ab4After: 'a:marginal@187000',
  ab5After: 'a:marginal@248000',
  ab6After: 'a:marginal@375000',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  cea: 'f:cea',
  abBpa: 'f:ab_bpa',
  eiMaxPay: 'f:ei_stop',
  eiPremiumMax: 'n:ei_max_premium',
  cppMax: 'n:cpp_max',
  cpp2Max: 'f:cpp2_max',
  cppBase: 'p:cpp_base_rate',
  cppExtra: 'p:cpp_enhanced_rate',
};

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

/** The first row says where tax starts in salary and the rate there, since its taxable income is $0. */
const brackets = (kind: 'fed' | 'ab', count: number) =>
  Array.from({ length: count }, (_, at) => at + 1).map((n) => [
    `{${kind}${n.toString()}Ti}`,
    `{${kind}${n.toString()}}`,
    n === 1
      ? `tax starts at about {${kind === 'fed' ? 'fedStartSalary' : 'abStartSalary'}}`
      : `{${kind}${n.toString()}Sal}`,
    n === 1
      ? `{${kind === 'fed' ? 'fedFirstRate' : 'abStartRate'}}`
      : `{${kind}${n.toString()}After}`,
  ]);

const bracketHead = [
  'Taxable income from',
  'Rate',
  'Salary where it starts',
  'Marginal rate after',
];

export const albertaRatesPage: RatesPageText = {
  title: 'Alberta marginal and average tax rate by salary, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in Alberta in 2026, and what causes every step.',
  heading: 'Alberta marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In Alberta the marginal rate is the share of your next dollar that goes to income tax, Canada Pension Plan and Employment Insurance. It climbs from about {lowMarginal} once you pay into the Canada Pension Plan (from {cppStart}) to {topMarginal} above {topStart}. The average rate climbs more slowly, to {avgAt500k} at {salary500k}. Alberta has no health premium or surtax, so once income tax starts the rate rises only where a federal or Alberta tax bracket starts. It falls where Employment Insurance or the Canada Pension Plan stops.',
    ),
    words(
      'Both rates count income tax (federal and Alberta), Canada Pension Plan in both tiers, and Employment Insurance as Form T2204 works it out. Credits paid to you when you file are not counted. They are for a single person whose only income is a salary.',
    ),
    words(
      'The 2026 forms are not out yet. These figures use the 2026 tax tables from the Canada Revenue Agency: federal and Alberta rates, brackets and basic amounts, Canada Pension Plan and Employment Insurance. The Form T2204 rules and the line layout of the forms are the 2025 forms’ carried forward. We will update them when the 2026 forms are final.',
    ),
  ],
  howToRead: [
    words(
      'The bracket thresholds printed on the tax forms are taxable incomes, and the federal basic personal amount uses net income. Neither is your salary. For a salary only, taxable income and net income are the same amount: your salary less the enhanced part of your Canada Pension Plan, which you deduct. The Canada Pension Plan and Employment Insurance limits are on pay, so they are already salaries.',
    ),
    words(
      'From {cppStart} up to {cppYmpe}, taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {cppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Cents} for every dollar, so taxable income is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. So a threshold on a form sits a little higher in salary: about {shiftFedBracket2} higher at a taxable income of {fedBracket2Ti}, about {shiftAbBracket2} higher at {abBracket2Ti}, and {taxableCut} higher from {yampe}. This page gives the salary.',
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
          'It is {fedFirstRate} from about {fedStartSalary}, when federal income tax starts. That is {cppEiRate} for the pension and insurance payments plus about {fedTaxPart} of federal tax ({fedLowestPct} of each extra dollar, less the credits that grow with it). It is a total, not a tax rate. The federal {fedBracket2} rate starts much higher, at a taxable income of {fedBracket2Ti}. Federal tax begins at about {fedStartSalary}, above the basic amount of {fedBasicAmount}, because of the Canada employment amount and the pension and insurance credits.',
          ['t1'],
        ),
      ],
    },
    {
      heading: '$20,000 to $50,000',
      notes: [
        words(
          'From about {abStartSalary} the rate is {abStartRate}: Alberta’s first tax rate, {ab1}, on top of the federal tax and the payments. Alberta tax starts when it passes Alberta’s credits: its basic personal amount and its credits for your Canada Pension Plan and Employment Insurance payments, at {abCreditRate}. Alberta has no tax reduction, premium or surtax.',
          ['ab428'],
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
          'From about {abBracket2Salary} the rate is {abBracket2Rate}: Alberta’s second tax rate, {abBracket2}, starts at a taxable income of {abBracket2Ti}.',
          ['ab428'],
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
          'From about {fedBracket3Salary} the rate is {fedBracket3Rate}: the federal rate rises to {fedBracket3} at a taxable income of {fedBracket3Ti}.',
          ['t1'],
        ),
        words(
          'From about {abBracket3Salary} the rate is {abBracket3Rate}: Alberta’s third tax rate, {abBracket3}, starts at a taxable income of {abBracket3Ti}.',
          ['ab428'],
        ),
        words(
          'From about {fedBracket4Salary} the rate is {fedBracket4Rate}: the federal rate rises to {fedBracket4}. The federal basic personal amount also begins to shrink, which adds about {bpaTaperPoint} point to the rate.',
          ['t1'],
        ),
        words(
          'From about {abBracket4Salary} the rate is {abBracket4Rate}: the fourth tax rate, {abBracket4}, starts at a taxable income of {abBracket4Ti}.',
          ['ab428'],
        ),
        words(
          'From about {abBracket5Salary} the rate is {abBracket5Rate}: the fifth tax rate, {abBracket5}, starts at a taxable income of {abBracket5Ti}.',
          ['ab428'],
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
          'From about {topStart} the line is straight at {topMarginal}: Alberta’s top rate, {abTop}, starts at a taxable income of {abTopTi}. Of every extra dollar, {topMarginal} goes to tax, and you keep {keepTop}. At {salary500k} the average rate is {avgAt500k}.',
          ['ab428', 't1'],
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
      ...cells(brackets('fed', 5)),
      after: {
        ...note(
          'The lowest federal rate is {fedLowest} for the whole of 2026. In 2025 it was {fedLowestRatePrior}. The federal basic personal amount is {fedBpa}, and shrinks to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}.',
          tablePool,
        ),
      },
    },
    {
      heading: 'Alberta brackets, 2026 (Form AB428)',
      caption: 'Alberta brackets, 2026',
      head: bracketHead,
      ...cells(brackets('ab', 6)),
      after: note(
        'Alberta’s basic personal amount is {abBpa}, the same at every income. Alberta’s credits are worth {ab1} even above the {ab2} bracket. The Alberta supplemental tax credit, which could bend the line, comes to nothing for a single person whose only income is a salary.',
        { ...pool, ...tablePool },
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
