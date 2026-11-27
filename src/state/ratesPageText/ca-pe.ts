import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The Prince Edward Island rates page: the wording of the rates page (copy thread, CRA-reviewed), with every figure a spec
 * the Prince Edward Island sweep resolves (see `hubNotes.ts`). The words say "about" where the copy thread's text does; a
 * bracket's salary is worked out exactly from the form's taxable income, and a band's edges are the engine's own. The
 * province has no health premium and no surtax, so there are no spike notes. Its low-income tax reduction makes two
 * steps in the rate (it starts to shrink, then is gone), both read from the engine's own edges.
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
  // Federal tax starts: the rate at $19,500 sits between the start of federal tax and the start of provincial tax.
  fedStartSalary: 'e:19000',
  fedFirstRate: 'h:marginal@19500',
  fedTaxPart: 'w:marginal@19500-12000',
  fedLowestPct: 'p:fed_bracket_1_rate',
  fedBracket2: 'p:fed_bracket_2_rate',
  // Prince Edward Island tax starts, and the low-income tax reduction.
  peTaxShowsSalary: 'e:19992',
  peStartRate: 'h:marginal@21000',
  peTaxPart: 'w:marginal@21000-19500',
  pe1: 'p:pe_bracket_1_rate',
  reductionMax: 'f:reduction_max',
  reductionStartNi: 'f:reduction_start',
  reductionStartSalary: 'f:reduction_start_salary',
  reductionRate: 'p:reduction_rate',
  reductionBandRate: 'h:marginal@25000',
  reductionEndSalary: 'e:29915',
  reductionEndNi: 'f:reduction_end_ni',
  afterReductionRate: 'h:marginal@31000',
  // The brackets, federal and provincial.
  peBracket2Salary: 'f:pe_bracket_2_salary',
  peBracket2Rate: 'h:marginal@35000',
  pe2: 'p:pe_bracket_2_rate',
  peBracket2Ti: 'f:pe_bracket_2_ti',
  fedBracket2Salary: 'f:fed_bracket_2_salary',
  fedBracket2Rate: 'h:marginal@60000',
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  peBracket3Salary: 'f:pe_bracket_3_salary',
  peBracket3Rate: 'h:marginal@67000',
  pe3: 'p:pe_bracket_3_rate',
  peBracket3Ti: 'f:pe_bracket_3_ti',
  peBracket4Salary: 'f:pe_bracket_4_salary',
  peBracket4Rate: 'h:marginal@110000',
  pe4: 'p:pe_bracket_4_rate',
  peBracket4Ti: 'f:pe_bracket_4_ti',
  fedBracket3Salary: 'f:fed_bracket_3_salary',
  fedBracket3Rate: 'h:marginal@119000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  peBracket5Salary: 'f:pe_bracket_5_salary',
  peBracket5Rate: 'h:marginal@145000',
  pe5: 'p:pe_bracket_5_rate',
  peBracket5Ti: 'f:pe_bracket_5_ti',
  fedBracket4Salary: 'f:fed_bracket_4_salary',
  fedBracket4Rate: 'h:marginal@183000',
  fedBracket4: 'p:fed_bracket_4_rate',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
  peBracket6Salary: 'f:pe_bracket_6_salary',
  peBracket6Rate: 'h:marginal@205000',
  pe6: 'p:pe_bracket_6_rate',
  peBracket6Ti: 'f:pe_bracket_6_ti',
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
  shiftPeBracket2: 'f:shift_pe_bracket_2',
};

/** A figure each table cell needs and the notes do not: the rows of the brackets and the limits. */
const tablePool: Record<string, string> = {
  // Table cells: each bracket's start in taxable income and in salary, its rate and the marginal rate after it.
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
  fed5After: 'a:marginal@300000',
  pe1Ti: 'f:pe_bracket_1_ti',
  pe1: 'p:pe_bracket_1_rate',
  pe2Ti: 'f:pe_bracket_2_ti',
  pe2: 'p:pe_bracket_2_rate',
  pe2Sal: 'f:pe_bracket_2_salary',
  pe3Ti: 'f:pe_bracket_3_ti',
  pe3: 'p:pe_bracket_3_rate',
  pe3Sal: 'f:pe_bracket_3_salary',
  pe4Ti: 'f:pe_bracket_4_ti',
  pe4: 'p:pe_bracket_4_rate',
  pe4Sal: 'f:pe_bracket_4_salary',
  pe5Ti: 'f:pe_bracket_5_ti',
  pe5: 'p:pe_bracket_5_rate',
  pe5Sal: 'f:pe_bracket_5_salary',
  pe6Ti: 'f:pe_bracket_6_ti',
  pe6: 'p:pe_bracket_6_rate',
  pe6Sal: 'f:pe_bracket_6_salary',
  pe2After: 'a:marginal@35000',
  pe3After: 'a:marginal@67000',
  pe4After: 'a:marginal@110000',
  pe5After: 'a:marginal@145000',
  pe6After: 'a:marginal@205000',
  fedFirstAfter: 'a:marginal@19500',
  peStartAfter: 'a:marginal@21000',
  reductionBandAfter: 'a:marginal@25000',
  afterReductionAfter: 'a:marginal@31000',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  cea: 'f:cea',
  peBpa: 'f:pe_bpa',
  peCreditRate: 'p:pe_credit_rate',
  eiMaxPay: 'f:ei_stop',
  eiPremiumMax: 'n:ei_max_premium',
  cppMax: 'n:cpp_max',
  cpp2Max: 'f:cpp2_max',
  cppBase: 'p:cpp_base_rate',
  cppExtra: 'p:cpp_enhanced_rate',
};

function words(text: string, forms: CauseForm[] = []): RatesNote {
  return { ...note(text, { ...pool, ...tablePool }), forms };
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

/** The rows of a bracket table; the first has no starting salary of its own: tax starts where the figure says. */
const brackets = (
  kind: 'fed' | 'pe',
  count: number,
  startSalary: string,
  startRate: string,
) => [
  [`{${kind}1Ti}`, `{${kind}1}`, startSalary, startRate],
  ...Array.from({ length: count - 1 }, (_, at) => {
    const n = (at + 2).toString();
    return [
      `{${kind}${n}Ti}`,
      `{${kind}${n}}`,
      `{${kind}${n}Sal}`,
      `{${kind}${n}After}`,
    ];
  }),
];

const bracketHead = [
  'Taxable income from',
  'Rate',
  'Salary where it starts',
  'Marginal rate after',
];

export const princeEdwardIslandRatesPage: RatesPageText = {
  title: 'Prince Edward Island marginal and average tax rate, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in Prince Edward Island in 2026, from $0 to $500,000, and what causes every step.',
  heading: 'Prince Edward Island marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In Prince Edward Island the marginal rate is the share of your next dollar that goes to income tax, Canada Pension Plan and Employment Insurance. It climbs from about {lowMarginal} once you pay into the Canada Pension Plan (from {cppStart}) to {topMarginal} above {topStart}, and provincial tax starts at about {peTaxShowsSalary}. From about {reductionStartSalary} to about {reductionEndSalary} the rate is higher still, because the low-income tax reduction is lost. The average rate climbs more slowly, to {avgAt500k} at {salary500k}. There are no health premium or surtax steps.',
    ),
    words(
      'Both rates count income tax (federal and Prince Edward Island, so the provincial low-income tax reduction counts), Canada Pension Plan in both tiers, and Employment Insurance as Form T2204 works it out. Credits paid to you when you file are not counted: the Canada workers benefit, the Employment Insurance refund and Prince Edward Island’s own benefits and credits paid separately. They are for a single person whose only income is a salary.',
    ),
  ],
  howToRead: [
    words(
      'The bracket thresholds printed on the tax forms are taxable incomes. The low-income tax reduction uses adjusted family income, and the federal basic personal amount uses net income. None of these is your salary. For a salary only, taxable income, adjusted family income and net income are all the same amount: your salary less the enhanced part of your Canada Pension Plan, which you deduct. The Canada Pension Plan and Employment Insurance limits are on pay, so they are already salaries.',
    ),
    words(
      'From {cppStart} up to {cppYmpe}, taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {cppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Rate} of every dollar, so taxable income is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. So a threshold on a form sits a little higher in salary: about {shiftReduction} higher at an income of {reductionStartNi}, about {shiftPeBracket2} higher at a taxable income of {peBracket2Ti}, and {taxableCut} higher from {yampe}. This page gives the salary.',
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
          'It is {fedFirstRate} from about {fedStartSalary}, when federal income tax starts. That is {cppEiRate} for the pension and insurance payments plus about {fedTaxPart} of federal tax ({fedLowestPct} of each extra dollar, less the credits that grow with it). It is a total, not a tax rate. The federal {fedBracket2} rate starts much higher, at a taxable income of {fedBracket2Ti}. No Prince Edward Island tax shows yet, because its credits and low-income tax reduction cover it.',
          ['t1', 'pe428'],
        ),
        words(
          'From about {peTaxShowsSalary} the rate is {peStartRate}. That is the {fedFirstRate} from before plus about {peTaxPart} for Prince Edward Island tax ({pe1} of each extra dollar, less the credits that grow with it). Provincial tax is now bigger than the full low-income tax reduction, which has not started to shrink.',
          ['pe428'],
        ),
      ],
    },
    {
      heading: '$20,000 to $50,000',
      notes: [
        words(
          'The Prince Edward Island low-income tax reduction lowers your provincial tax, by up to {reductionMax} for a single person. It is worked out on adjusted family income. It starts to shrink at {reductionStartNi}, about {reductionStartSalary} of salary, by {reductionRate} of every dollar of income above that. From then the rate is {reductionBandRate}: that is the {peStartRate} from before plus the reduction you lose, {reductionRate} of each extra dollar of income.',
          ['pe428'],
        ),
        words(
          'The reduction is gone at about {reductionEndSalary} of salary (an adjusted family income of {reductionEndNi}), and the rate falls to {afterReductionRate}, the same as before the reduction started to shrink (from about {peTaxShowsSalary} to about {reductionStartSalary}).',
          ['pe428'],
        ),
        words(
          'From about {peBracket2Salary} the rate is {peBracket2Rate}: the second provincial rate, {pe2}, starts at a taxable income of {peBracket2Ti}. Prince Edward Island has no health premium or surtax.',
          ['pe428'],
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
          'From about {peBracket3Salary} the rate is {peBracket3Rate}: the third provincial rate, {pe3}, starts at a taxable income of {peBracket3Ti}.',
          ['pe428'],
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
          'From about {peBracket4Salary} the rate is {peBracket4Rate}: the fourth provincial rate, {pe4}, starts at a taxable income of {peBracket4Ti}.',
          ['pe428'],
        ),
        words(
          'From about {fedBracket3Salary} the rate is {fedBracket3Rate}: the federal rate rises to {fedBracket3} at a taxable income of {fedBracket3Ti}.',
          ['t1'],
        ),
        words(
          'From about {peBracket5Salary} the rate is {peBracket5Rate}: the fifth provincial rate, {pe5}, starts at a taxable income of {peBracket5Ti}.',
          ['pe428'],
        ),
        words(
          'From about {fedBracket4Salary} the rate is {fedBracket4Rate}: the federal rate rises to {fedBracket4}. The federal basic personal amount also begins to shrink, which adds about {bpaTaperPoint} point to the rate.',
          ['t1'],
        ),
        words(
          'From about {peBracket6Salary} the rate is {peBracket6Rate}: the sixth and top provincial rate, {pe6}, starts at a taxable income of {peBracket6Ti}. This rate is new for 2026.',
          ['pe428'],
        ),
      ],
    },
    {
      heading: 'About $260,000 and above',
      notes: [
        words(
          'From about {topStart} the line is straight: the federal rate rises to {fedBracket5} at a taxable income of {fedBracket5Ti}, and the federal basic personal amount has finished shrinking. Of every extra dollar, {topMarginal} goes to tax, and you keep {keepTop}. At {salary500k} the average rate is {avgAt500k}.',
          ['t1', 'pe428'],
        ),
      ],
    },
  ],
  tables: [
    {
      heading: 'Federal brackets, 2026 (Form T1)',
      before: words(
        'The tax forms print each bracket as a taxable income. These tables add the salary where it starts and the marginal rate just after, so you can match the chart to the forms.',
      ),
      caption: 'Federal brackets, 2026',
      head: bracketHead,
      ...cells(
        brackets(
          'fed',
          5,
          'tax starts at about {fedStartSalary}',
          '{fedFirstAfter}',
        ),
      ),
      after: words(
        'The lowest federal rate is {fedLowest} for the whole of 2026. In 2025 it was {fedLowestRatePrior}. The federal basic personal amount is {fedBpa}, and shrinks to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}. The {fedFirstRate} in the chart from {fedStartSalary} to {peTaxShowsSalary} is a total ({cppEiRate} of pension and insurance payments plus {fedTaxPart} of federal tax). It is not the federal bracket rate, which is also {fedBracket2} but starts at a taxable income of {fedBracket2Ti}.',
      ),
    },
    {
      heading: 'Prince Edward Island brackets, 2026 (Form PE428)',
      caption: 'Prince Edward Island brackets, 2026',
      head: bracketHead,
      ...cells(
        brackets(
          'pe',
          6,
          'tax starts at about {peTaxShowsSalary}',
          '{peStartAfter}, then {reductionBandAfter} from {reductionStartSalary}, then {afterReductionAfter} from {reductionEndSalary}',
        ),
      ),
      after: words(
        'Prince Edward Island’s basic personal amount is {peBpa}, the same at every income, and the credit rate is the lowest tax rate, {peCreditRate}. The 2025 form has five rates; the sixth, {pe6}, is new for 2026. There is no Prince Edward Island Canada employment amount.',
      ),
    },
    {
      heading: 'Low-income tax reduction, 2026 (Form PE428)',
      before: words(
        'The reduction is taken off your provincial tax if your income is low. It cannot take the tax below zero, and it is not paid to you as cash. A single filer gets the basic amount without the extra for a spouse, dependant, children or age. The form prints no income limit for it.',
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
          '{peTaxShowsSalary}, before the reduction starts to shrink',
        ],
        [
          'Gone at an adjusted family income of',
          '{reductionEndNi} (salary about {reductionEndSalary})',
        ],
        [
          'Rate from {peTaxShowsSalary}',
          '{peStartRate}, then {reductionBandRate} from {reductionStartSalary} until it is gone, then {afterReductionRate}',
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
