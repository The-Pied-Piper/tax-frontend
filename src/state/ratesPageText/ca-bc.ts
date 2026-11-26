import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The British Columbia rates page: the copy thread's wording, with every figure a spec the British Columbia sweep
 * resolves (see `hubNotes.ts`). A bracket's salary is worked out exactly from the form's taxable income and a band's
 * edges are the engine's own; the words say "about" where the copy thread's text does.
 */
const pool: Record<string, string> = {
  // Rules the forms print as words or round numbers, which no data of ours holds: declared, so a test can see them.
  cpp2Cents: 'l:4 cents',
  oneDollar: 'l:$1',
  fedLowestPct: 'p:fed_bracket_1_rate',
  // The two rates, at sweep salaries inside each band.
  lowMarginal: 'h:marginal@4000',
  topMarginal: 'h:marginal@300000',
  topStart: 'f:bc_bracket_7_salary',
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
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  fedBasicAmount: 'f:fed_bpa',
  // British Columbia tax starts, and the BC tax reduction.
  bcStartSalary: 'e:26500',
  bcStartRate: 'h:marginal@30000',
  bc1: 's:bc_bracket_1_rate',
  redMax: 'f:red_max',
  redBase: 'f:reduction_start',
  redBaseSalary: 'f:red_base_salary',
  redRate: 'p:reduction_rate',
  redRateSalary: 't:red_rate_salary',
  redEnd: 'f:red_end',
  redEndSalary: 'e:45500',
  afterRedRate: 'h:marginal@48000',
  // The brackets, British Columbia and federal.
  bcBracket2Salary: 'f:bc_bracket_2_salary',
  bcBracket2Rate: 'h:marginal@55000',
  bcBracket2: 's:bc_bracket_2_rate',
  bcBracket2Ti: 'f:bc_bracket_2_ti',
  fedBracket2Salary: 'f:fed_bracket_2_salary',
  fedBracket2Rate: 'h:marginal@60000',
  bcBracket3Salary: 'f:bc_bracket_3_salary',
  bcBracket3Rate: 'h:marginal@110000',
  bcBracket3: 's:bc_bracket_3_rate',
  bcBracket3Ti: 'f:bc_bracket_3_ti',
  bcBracket4Salary: 'f:bc_bracket_4_salary',
  bcBracket4Rate: 'h:marginal@117000',
  bcBracket4: 's:bc_bracket_4_rate',
  bcBracket4Ti: 'f:bc_bracket_4_ti',
  fedBracket3Salary: 'f:fed_bracket_3_salary',
  fedBracket3Rate: 'h:marginal@120000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  bcBracket5Salary: 'f:bc_bracket_5_salary',
  bcBracket5Rate: 'h:marginal@150000',
  bcBracket5: 's:bc_bracket_5_rate',
  bcBracket5Ti: 'f:bc_bracket_5_ti',
  fedBracket4Salary: 'f:fed_bracket_4_salary',
  fedBracket4Rate: 'h:marginal@185000',
  fedBracket4: 'p:fed_bracket_4_rate',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
  bcBracket6Salary: 'f:bc_bracket_6_salary',
  bcBracket6Rate: 'h:marginal@200000',
  bcBracket6: 's:bc_bracket_6_rate',
  bcBracket6Ti: 'f:bc_bracket_6_ti',
  fedBracket5Salary: 'f:fed_bracket_5_salary',
  fedBracket5Rate: 'h:marginal@260000',
  fedBracket5: 'p:fed_bracket_5_rate',
  bcTop: 's:bc_bracket_7_rate',
  bcTopTi: 'f:bc_bracket_7_ti',
  fedTop: 'p:fed_bracket_5_rate',
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
  shiftRedBase: 'f:shift_red_base',
  shiftBcBracket2: 'f:shift_bc_bracket_2',
};

function words(text: string, forms: CauseForm[] = []): RatesNote {
  return { ...note(text, pool), forms };
}

/** The figures of the tables: the notes' figures and the ones only a table cell needs. */
const tablePool: Record<string, string> = {
  ...pool,
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
  fed2After: 'h:marginal@60000',
  fed3After: 'h:marginal@120000',
  fed4After: 'h:marginal@185000',
  fed5After: 'h:marginal@260000',
  bc1Ti: 'f:bc_bracket_1_ti',
  bc1: 's:bc_bracket_1_rate',
  bc2Ti: 'f:bc_bracket_2_ti',
  bc2: 's:bc_bracket_2_rate',
  bc2Sal: 'f:bc_bracket_2_salary',
  bc2After: 'h:marginal@55000',
  bc3Ti: 'f:bc_bracket_3_ti',
  bc3: 's:bc_bracket_3_rate',
  bc3Sal: 'f:bc_bracket_3_salary',
  bc3After: 'h:marginal@110000',
  bc4Ti: 'f:bc_bracket_4_ti',
  bc4: 's:bc_bracket_4_rate',
  bc4Sal: 'f:bc_bracket_4_salary',
  bc4After: 'h:marginal@117000',
  bc5Ti: 'f:bc_bracket_5_ti',
  bc5: 's:bc_bracket_5_rate',
  bc5Sal: 'f:bc_bracket_5_salary',
  bc5After: 'h:marginal@150000',
  bc6Ti: 'f:bc_bracket_6_ti',
  bc6: 's:bc_bracket_6_rate',
  bc6Sal: 'f:bc_bracket_6_salary',
  bc6After: 'h:marginal@200000',
  bc7Ti: 'f:bc_bracket_7_ti',
  bc7: 's:bc_bracket_7_rate',
  bc7Sal: 'f:bc_bracket_7_salary',
  bc7After: 'h:marginal@300000',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  cea: 'f:cea',
  bcBpa: 'f:bc_bpa',
  bcCreditRate: 's:bc_credit_rate',
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
      const spec = tablePool[name];
      if (spec !== undefined) figures[name] = spec;
    }
  }
  return { rows, figures };
}

const bracketHead = [
  'Taxable income from',
  'Rate',
  'Salary where it starts',
  'Marginal rate after',
];

export const britishColumbiaRatesPage: RatesPageText = {
  title: 'British Columbia marginal and average tax rate by salary, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in British Columbia in 2026, from $0 to $500,000, and what causes every step.',
  heading: 'British Columbia marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In British Columbia the marginal rate is the share of your next dollar that goes to income tax, Canada Pension Plan and Employment Insurance. It climbs from about {lowMarginal} once you pay into the Canada Pension Plan (from {cppStart}) to {topMarginal} above {topStart}, with a higher stretch from {bcStartSalary} to {redEndSalary} while the BC tax reduction is lost. The average rate climbs more slowly, to {avgAt500k} at {salary500k}.',
    ),
    words(
      'Both rates count income tax (federal and British Columbia, line 43500 of the T1 return, so the BC tax reduction counts), Canada Pension Plan in both tiers, and Employment Insurance as Form T2204 works it out. Credits paid to you when you file are not counted: the Canada workers benefit, the Employment Insurance refund, and the British Columbia sales tax, renter’s and home renovation credits. They are for a single person whose only income is a salary.',
    ),
    words(
      'The 2026 forms are not out yet. Federal, Canada Pension Plan and Employment Insurance figures use the 2026 tax tables from the Canada Revenue Agency. The British Columbia rates, brackets, basic amount and tax reduction come from its July 2026 payroll tables, which assume the province’s proposed changes become law. The Form T2204 rules are the 2025 form’s rules carried forward. We will update them when the 2026 forms are final.',
    ),
  ],
  howToRead: [
    words(
      'The bracket thresholds printed on the tax forms are taxable incomes. The BC tax reduction and the federal basic personal amount use net income. None of these is your salary. For a salary only, taxable income and net income are the same amount: your salary less the enhanced part of your Canada Pension Plan, which you deduct. The Canada Pension Plan and Employment Insurance limits are on pay, so they are already salaries.',
    ),
    words(
      'From {cppStart} up to {cppYmpe}, taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {cppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Cents} for every dollar, so taxable income is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. So a threshold on a form sits a little higher in salary: about {shiftRedBase} higher at a net income of {redBase}, about {shiftBcBracket2} higher at a taxable income of {bcBracket2Ti}, and {taxableCut} higher from {yampe}. This page gives the salary.',
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
          'From about {fedStartSalary} to about {bcStartSalary} the rate stays {fedFirstRate}: federal tax and the pension and insurance payments. British Columbia income tax starts at about {bcStartSalary}. Until then British Columbia’s basic personal amount, its credits for your pension and insurance payments, and the BC tax reduction cover it.',
          ['bc428'],
        ),
        words(
          'From about {bcStartSalary} the rate is {bcStartRate}: British Columbia’s first tax rate, {bc1}, on top of the federal tax and the payments, plus the BC tax reduction you are losing. The reduction lowers your BC tax by up to {redMax}. It starts to shrink at a net income of {redBase}, about {redBaseSalary} of salary, by {redRate} of every dollar of net income above that, about {redRateSalary} of each extra dollar of salary. Until {bcStartSalary} what is left still cancels all your BC tax, so the rate does not change.',
          ['bc428'],
        ),
        words(
          'The BC tax reduction is gone at about {redEndSalary} of salary (a net income of {redEnd}), and the rate falls to {afterRedRate}.',
          ['bc428'],
        ),
        words(
          'From about {bcBracket2Salary} the rate is {bcBracket2Rate}: British Columbia’s second tax rate, {bcBracket2}, starts at a taxable income of {bcBracket2Ti}.',
          ['bc428'],
        ),
        words('British Columbia has no health premium or surtax.', ['bc428']),
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
          'From about {bcBracket3Salary} the rate is {bcBracket3Rate}: British Columbia’s third tax rate, {bcBracket3}, starts at a taxable income of {bcBracket3Ti}.',
          ['bc428'],
        ),
        words(
          'From about {bcBracket4Salary} the rate is {bcBracket4Rate}: the fourth tax rate, {bcBracket4}, starts at a taxable income of {bcBracket4Ti}.',
          ['bc428'],
        ),
        words(
          'From about {fedBracket3Salary} the rate is {fedBracket3Rate}: the federal rate rises to {fedBracket3} at a taxable income of {fedBracket3Ti}.',
          ['t1'],
        ),
        words(
          'From about {bcBracket5Salary} the rate is {bcBracket5Rate}: the fifth tax rate, {bcBracket5}, starts at a taxable income of {bcBracket5Ti}.',
          ['bc428'],
        ),
        words(
          'From about {fedBracket4Salary} the rate is {fedBracket4Rate}: the federal rate rises to {fedBracket4}. The federal basic personal amount also begins to shrink, which adds about {bpaTaperPoint} point to the rate.',
          ['t1'],
        ),
        words(
          'From about {bcBracket6Salary} the rate is {bcBracket6Rate}: the sixth tax rate, {bcBracket6}, starts at a taxable income of {bcBracket6Ti}.',
          ['bc428'],
        ),
        words(
          'From about {fedBracket5Salary} the rate is {fedBracket5Rate}: the federal rate rises to {fedBracket5}, and the federal basic personal amount has finished shrinking.',
          ['t1'],
        ),
      ],
    },
    {
      heading: 'Above $260,000',
      notes: [
        words(
          'From about {topStart} the line is straight: of every extra dollar, {topMarginal} goes to tax. British Columbia’s top rate, {bcTop}, starts at a taxable income of {bcTopTi}, on top of the federal {fedTop}. At {salary500k} the average rate is {avgAt500k}.',
          ['bc428', 't1'],
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
      ...cells([
        [
          '{fed1Ti}',
          '{fed1}',
          'tax starts at about {fedStartSalary}',
          '{fedFirstRate}',
        ],
        ...[2, 3, 4, 5].map((n) => [
          `{fed${n.toString()}Ti}`,
          `{fed${n.toString()}}`,
          `{fed${n.toString()}Sal}`,
          `{fed${n.toString()}After}`,
        ]),
      ]),
      after: {
        ...note(
          'The lowest federal rate is {fedLowest} for the whole of 2026. In 2025 it was {fedLowestRatePrior}. The federal basic personal amount is {fedBpa}, and shrinks to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}.',
          tablePool,
        ),
      },
    },
    {
      heading: 'British Columbia brackets, 2026 (Form BC428)',
      caption: 'British Columbia brackets, 2026',
      head: bracketHead,
      ...cells([
        [
          '{bc1Ti}',
          '{bc1}',
          'tax starts at about {bcStartSalary}',
          '{bcStartRate}, then {afterRedRate} from {redEndSalary}',
        ],
        ...[2, 3, 4, 5, 6, 7].map((n) => [
          `{bc${n.toString()}Ti}`,
          `{bc${n.toString()}}`,
          `{bc${n.toString()}Sal}`,
          `{bc${n.toString()}After}`,
        ]),
      ]),
      after: note(
        'British Columbia’s basic personal amount is {bcBpa}, and the credit rate is the lowest tax rate, {bcCreditRate}.',
        tablePool,
      ),
    },
    {
      heading: 'BC tax reduction, 2026 (Form BC428)',
      before: note(
        'The reduction lowers your British Columbia tax if your income is low. It is worked out on net income, and it cannot take the tax below zero. It is not paid to you as cash.',
        tablePool,
      ),
      caption: 'BC tax reduction, 2026',
      head: ['Item', 'Figure'],
      ...cells([
        ['Most it can be', '{redMax}'],
        [
          'Starts to shrink at a net income of',
          '{redBase} (salary about {redBaseSalary})',
        ],
        ['Shrinks by', '{redRate} of every dollar of net income above that'],
        ['Gone at a net income of', '{redEnd} (salary about {redEndSalary})'],
        ['British Columbia tax begins at a salary of about', '{bcStartSalary}'],
        [
          'Rate from {bcStartSalary}',
          '{bcStartRate}, then {afterRedRate} from {redEndSalary}',
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
