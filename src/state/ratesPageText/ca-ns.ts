import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The Nova Scotia rates page: the wording of the rates page (copy thread, CRA-reviewed), with every figure a spec the
 * Nova Scotia sweep resolves (see `hubNotes.ts`). The words say "about" where the copy thread's text does; a bracket's
 * salary is worked out exactly from the form's taxable income, and a band's edges are the engine's own. The province
 * has no health premium and no surtax, so there are no spike notes.
 */
const pool: Record<string, string> = {
  // Rules the forms print as words or round numbers, which no data of ours holds: declared, so a test can see them.
  oneDollar: 'l:$1',
  // The two rates, at sweep salaries just after each change.
  lowMarginal: 'h:marginal@4000',
  topMarginal: 'h:marginal@300000',
  keepTop: 'u:marginal@300000',
  topStart: 'f:fed_bracket_5_salary',
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
  // Nova Scotia tax shows, then federal tax starts.
  nsTaxShowsSalary: 'e:15000',
  nsStartRate: 'h:marginal@17000',
  nsTaxPart: 'v:ns_tax_part',
  ns1: 'p:ns_bracket_1_rate',
  fedStartSalary: 'e:19000',
  fedStartRate: 'h:marginal@20000',
  fedTaxPart: 'w:marginal@20000-17000',
  fedBracket2: 'p:fed_bracket_2_rate',
  // The provincial low-income tax reduction.
  reductionMax: 'f:reduction_max',
  reductionStartNi: 'f:reduction_start',
  reductionStartSalary: 'f:reduction_start_salary',
  reductionRate: 'p:reduction_rate',
  reductionEndSalary: 'e:21000',
  reductionEndNi: 'f:reduction_end_ni',
  afterReductionRate: 'h:marginal@25000',
  // The brackets, federal and provincial.
  nsBracket2Salary: 'f:ns_bracket_2_salary',
  nsBracket2Rate: 'h:marginal@32000',
  nsBracket2: 'p:ns_bracket_2_rate',
  nsBracket2Ti: 'f:ns_bracket_2_ti',
  fedBracket2Salary: 'f:fed_bracket_2_salary',
  fedBracket2Rate: 'h:marginal@60000',
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  nsBracket3Salary: 'f:ns_bracket_3_salary',
  nsBracket3Rate: 'h:marginal@64000',
  nsBracket3: 'p:ns_bracket_3_rate',
  nsBracket3Ti: 'f:ns_bracket_3_ti',
  nsBracket4Salary: 'f:ns_bracket_4_salary',
  nsBracket4Rate: 'h:marginal@100000',
  nsBracket4: 'p:ns_bracket_4_rate',
  nsBracket4Ti: 'f:ns_bracket_4_ti',
  fedBracket3Salary: 'f:fed_bracket_3_salary',
  fedBracket3Rate: 'h:marginal@119000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  nsBracket5Salary: 'f:ns_bracket_5_salary',
  nsBracket5Rate: 'h:marginal@160000',
  nsBracket5: 'p:ns_bracket_5_rate',
  nsBracket5Ti: 'f:ns_bracket_5_ti',
  fedBracket4Salary: 'f:fed_bracket_4_salary',
  fedBracket4Rate: 'h:marginal@183000',
  fedBracket4: 'p:fed_bracket_4_rate',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
  fedBracket5: 'p:fed_bracket_5_rate',
  fedBracket5Ti: 'f:fed_bracket_5_ti',
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
  shiftNsBracket2: 'f:shift_ns_bracket_2',
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
  fedFirstAfter: 'a:marginal@20000',
  fed2After: 'a:marginal@60000',
  fed3After: 'a:marginal@119000',
  fed4After: 'a:marginal@183000',
  fed5After: 'a:marginal@260000',
  ns1: 'p:ns_bracket_1_rate',
  ns1Ti: 'f:ns_bracket_1_ti',
  ns2Ti: 'f:ns_bracket_2_ti',
  ns2: 'p:ns_bracket_2_rate',
  ns2Sal: 'f:ns_bracket_2_salary',
  ns3Ti: 'f:ns_bracket_3_ti',
  ns3: 'p:ns_bracket_3_rate',
  ns3Sal: 'f:ns_bracket_3_salary',
  ns4Ti: 'f:ns_bracket_4_ti',
  ns4: 'p:ns_bracket_4_rate',
  ns4Sal: 'f:ns_bracket_4_salary',
  ns5Ti: 'f:ns_bracket_5_ti',
  ns5: 'p:ns_bracket_5_rate',
  ns5Sal: 'f:ns_bracket_5_salary',
  nsStartAfter: 'a:marginal@17000',
  nsFedAfter: 'a:marginal@20000',
  nsGoneAfter: 'a:marginal@25000',
  ns2After: 'a:marginal@32000',
  ns3After: 'a:marginal@64000',
  ns4After: 'a:marginal@100000',
  ns5After: 'a:marginal@160000',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  cea: 'f:cea',
  nsBpa: 'f:ns_bpa',
  nsCreditRate: 'p:ns_credit_rate',
  eiMaxPay: 'f:ei_stop',
  eiPremiumMax: 'n:ei_max_premium',
  cppMax: 'n:cpp_max',
  cpp2Max: 'f:cpp2_max',
  cppBase: 'p:cpp_base_rate',
  cppExtra: 'p:cpp_enhanced_rate',
};

/** The federal rows: the first has no starting salary of its own, federal tax starts where the figure says. */
const federalRows = [1, 2, 3, 4, 5].map((n) =>
  n === 1
    ? [
        '{fed1Ti}',
        '{fed1}',
        'tax starts at about {fedStartSalary}',
        '{fedFirstAfter}',
      ]
    : [
        `{fed${n.toString()}Ti}`,
        `{fed${n.toString()}}`,
        `{fed${n.toString()}Sal}`,
        `{fed${n.toString()}After}`,
      ],
);

/** The provincial rows: the first says where provincial tax shows and the three rates it passes through. */
const provincialRows = [1, 2, 3, 4, 5].map((n) =>
  n === 1
    ? [
        '{ns1Ti}',
        '{ns1}',
        'tax starts at about {nsTaxShowsSalary}',
        '{nsStartAfter}, then {nsFedAfter} from {fedStartSalary}, then {nsGoneAfter} from {reductionEndSalary}',
      ]
    : [
        `{ns${n.toString()}Ti}`,
        `{ns${n.toString()}}`,
        `{ns${n.toString()}Sal}`,
        `{ns${n.toString()}After}`,
      ],
);

const bracketHead = [
  'Taxable income from',
  'Rate',
  'Salary where it starts',
  'Marginal rate after',
];

export const novaScotiaRatesPage: RatesPageText = {
  title: 'Nova Scotia marginal and average tax rate by salary, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in Nova Scotia in 2026, from $0 to $500,000, and what causes every step.',
  heading: 'Nova Scotia marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In Nova Scotia the marginal rate is the share of your next dollar that goes to income tax, Canada Pension Plan and Employment Insurance. It climbs from about {lowMarginal} once you pay into the Canada Pension Plan (from {cppStart}) to {topMarginal} above {topStart}. The rate is higher from {nsTaxShowsSalary} to {reductionEndSalary}, where provincial tax and federal tax start and the low-income tax reduction is lost. The average rate climbs more slowly, to {avgAt500k} at {salary500k}. There are no health premium or surtax steps.',
    ),
    words(
      'Both rates count income tax (federal and Nova Scotia, so the provincial low-income tax reduction counts), Canada Pension Plan in both tiers, and Employment Insurance as Form T2204 works it out. Credits paid to you when you file are not counted: the Canada workers benefit, the Employment Insurance refund and Nova Scotia’s own benefits paid separately. They are for a single person whose only income is a salary.',
    ),
  ],
  howToRead: [
    words(
      'The bracket thresholds printed on the tax forms are taxable incomes. The low-income tax reduction uses adjusted family income, and the federal basic personal amount uses net income. None of these is your salary. For a salary only, taxable income, adjusted family income and net income are all the same amount: your salary less the enhanced part of your Canada Pension Plan, which you deduct. The Canada Pension Plan and Employment Insurance limits are on pay, so they are already salaries.',
    ),
    words(
      'From {cppStart} up to {cppYmpe}, taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {cppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Rate} of every dollar, so taxable income is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. So a threshold on a form sits a little higher in salary: about {shiftReduction} higher at an income of {reductionStartNi}, about {shiftNsBracket2} higher at a taxable income of {nsBracket2Ti}, and {taxableCut} higher from {yampe}. This page gives the salary.',
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
          'From {cppStart} to about {nsTaxShowsSalary} the rate is {cppEiRate}: Canada Pension Plan at {cppRate} and Employment Insurance at {eiRate}, with no income tax yet.',
          ['schedule8', 't2204'],
        ),
        words(
          'The Nova Scotia low-income tax reduction lowers your provincial tax, by up to {reductionMax} for a single person. It is worked out on adjusted family income. It starts to shrink at {reductionStartNi}, about {reductionStartSalary} of salary, by {reductionRate} of every dollar of income above that. Until about {nsTaxShowsSalary} what is left still cancels all your provincial tax, so the rate does not change.',
          ['ns428'],
        ),
        words(
          'From about {nsTaxShowsSalary} the rate is {nsStartRate}. That is {cppEiRate} for the pension and insurance payments, about {nsTaxPart} for Nova Scotia tax ({ns1} of each extra dollar, less the credits that grow with it) and the reduction you lose, {reductionRate} of each extra dollar of income. Provincial tax shows while the reduction is still shrinking.',
          ['ns428'],
        ),
        words(
          'From about {fedStartSalary} the rate is {fedStartRate}: federal income tax starts as well. That is {nsStartRate} plus about {fedTaxPart} of federal tax. It is a total, not a tax rate. The federal {fedBracket2} rate starts much higher, at a taxable income of {fedBracket2Ti}.',
          ['t1'],
        ),
      ],
    },
    {
      heading: '$20,000 to $50,000',
      notes: [
        words(
          'The reduction is gone at about {reductionEndSalary} of salary (an adjusted family income of {reductionEndNi}), and the rate falls to {afterReductionRate}.',
          ['ns428'],
        ),
        words(
          'From about {nsBracket2Salary} the rate is {nsBracket2Rate}: the second provincial rate, {nsBracket2}, starts at a taxable income of {nsBracket2Ti}. Nova Scotia has no health premium or surtax.',
          ['ns428'],
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
          'From about {nsBracket3Salary} the rate is {nsBracket3Rate}: the third provincial rate, {nsBracket3}, starts at a taxable income of {nsBracket3Ti}.',
          ['ns428'],
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
          'From about {nsBracket4Salary} the rate is {nsBracket4Rate}: the fourth provincial rate, {nsBracket4}, starts at a taxable income of {nsBracket4Ti}.',
          ['ns428'],
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
          'From about {nsBracket5Salary} the rate is {nsBracket5Rate}: the fifth and top provincial rate, {nsBracket5}, starts at a taxable income of {nsBracket5Ti}.',
          ['ns428'],
        ),
        words(
          'From about {fedBracket4Salary} the rate is {fedBracket4Rate}: the federal rate rises to {fedBracket4}. The federal basic personal amount also begins to shrink, which adds about {bpaTaperPoint} point to the rate.',
          ['t1'],
        ),
      ],
    },
    {
      heading: 'About $260,000 and above',
      notes: [
        words(
          'From about {topStart} the line is straight: the federal rate rises to {fedBracket5} at a taxable income of {fedBracket5Ti}, and the federal basic personal amount has finished shrinking. Of every extra dollar, {topMarginal} goes to tax, and you keep {keepTop}. Nova Scotia has no step above this. At {salary500k} the average rate is {avgAt500k}.',
          ['t1', 'ns428'],
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
          'The lowest federal rate is {fedLowest} for the whole of 2026. In 2025 it was {fedLowestRatePrior}. The federal basic personal amount is {fedBpa}, and shrinks to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}.',
          { ...pool, ...tablePool },
        ),
      },
    },
    {
      heading: 'Nova Scotia brackets, 2026 (Form NS428)',
      caption: 'Nova Scotia brackets, 2026',
      head: bracketHead,
      ...cells(provincialRows),
      after: note(
        'Nova Scotia’s basic personal amount is {nsBpa}, the same at every income, and the credit rate is the lowest tax rate, {nsCreditRate}. There is no Nova Scotia Canada employment amount.',
        tablePool,
      ),
    },
    {
      heading: 'Low-income tax reduction, 2026 (Form NS428)',
      before: words(
        'The reduction is taken off your provincial tax if your income is low. It cannot take the tax below zero, and it is not paid to you as cash. A single filer gets the basic amount without the extra for a spouse, dependant or children. The form prints no income limit for it.',
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
          '{nsTaxShowsSalary}',
        ],
        [
          'Gone at an adjusted family income of',
          '{reductionEndNi} (salary about {reductionEndSalary})',
        ],
        [
          'Rate from {nsTaxShowsSalary} to {fedStartSalary}',
          '{nsStartRate}, then {fedStartRate} until it is gone, then {afterReductionRate}',
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
