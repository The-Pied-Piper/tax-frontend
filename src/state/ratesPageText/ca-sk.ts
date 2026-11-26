import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The Saskatchewan rates page: the wording of the rates page, with every figure a spec the Saskatchewan sweep resolves
 * (see `hubNotes.ts`). The words say "about" where the copy thread's text does; a bracket's salary is worked out exactly
 * from the form's taxable income, and the salaries where a rate changes are the engine's own. Saskatchewan has no
 * premium, surtax or income-tested credit, so every step is the start of a bracket or the end of a payment.
 */
const pool: Record<string, string> = {
  // Rules the forms print as words or round numbers, which no data of ours holds: declared, so a test can see them.
  cpp2Cents: 'l:4 cents',
  oneDollar: 'l:$1',
  // The two rates, at sweep salaries just after each change.
  lowMarginal: 'h:marginal@4000',
  topMarginal: 'h:marginal@300000',
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
  // Federal tax starts.
  fedStartSalary: 'e:19000',
  fedFirstRate: 'h:marginal@20000',
  fedTaxPart: 'w:marginal@20000-12000',
  fedLowestPct: 'p:fed_bracket_1_rate',
  fedBracket2: 'p:fed_bracket_2_rate',
  fedBasicAmount: 'f:fed_bpa',
  // Saskatchewan tax starts, and its brackets.
  skStartSalary: 'e:21000',
  skStartRate: 'y:21000',
  skBracket1: 'p:sk_bracket_1_rate',
  skBracket2Salary: 'f:sk_bracket_2_salary',
  skBracket2Rate: 'h:marginal@56000',
  skBracket2: 'p:sk_bracket_2_rate',
  skBracket2Ti: 'f:sk_bracket_2_ti',
  skBracket3Salary: 'f:sk_bracket_3_salary',
  skBracket3Rate: 'h:marginal@157000',
  skBracket3: 'p:sk_bracket_3_rate',
  skBracket3Ti: 'f:sk_bracket_3_ti',
  // The federal brackets.
  fedBracket2Salary: 'f:fed_bracket_2_salary',
  fedBracket2Rate: 'h:marginal@60000',
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  fedBracket3Salary: 'f:fed_bracket_3_salary',
  fedBracket3Rate: 'h:marginal@119000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  fedBracket4Salary: 'f:fed_bracket_4_salary',
  fedBracket4Rate: 'h:marginal@183000',
  fedBracket4: 'p:fed_bracket_4_rate',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
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
  shiftSkBracket2: 'f:shift_sk_bracket_2',
  shiftFedBracket2: 'f:shift_fed_bracket_2',
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
  fed2After: 'h:marginal@60000',
  fed3After: 'h:marginal@119000',
  fed4After: 'h:marginal@183000',
  fed5After: 'h:marginal@300000',
  sk1Ti: 'f:sk_bracket_1_ti',
  sk1: 'p:sk_bracket_1_rate',
  sk2Ti: 'f:sk_bracket_2_ti',
  sk2: 'p:sk_bracket_2_rate',
  sk2Sal: 'f:sk_bracket_2_salary',
  sk3Ti: 'f:sk_bracket_3_ti',
  sk3: 'p:sk_bracket_3_rate',
  sk3Sal: 'f:sk_bracket_3_salary',
  sk2After: 'h:marginal@56000',
  sk3After: 'h:marginal@157000',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  cea: 'f:cea',
  skBpa: 'f:sk_bpa',
  skCreditRate: 'p:sk_credit_rate',
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
const brackets = (kind: 'fed' | 'sk', count: number, startRate: string) => [
  [
    `{${kind}1Ti}`,
    `{${kind}1}`,
    `tax starts at about {${kind === 'fed' ? 'fedStartSalary' : 'skStartSalary'}}`,
    startRate,
  ],
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

export const saskatchewanRatesPage: RatesPageText = {
  title: 'Saskatchewan marginal and average tax rate by salary, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in Saskatchewan in 2026, from $0 to $500,000, and what causes every step.',
  heading: 'Saskatchewan marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In Saskatchewan the marginal rate is the share of your next dollar that goes to income tax, Canada Pension Plan and Employment Insurance. It climbs from about {lowMarginal} once you pay into the Canada Pension Plan (from {cppStart}) to {topMarginal} above {topStart}. The average rate climbs more slowly, to {avgAt500k} at {salary500k}. Saskatchewan has no health premium or surtax, so the rate rises only where a tax bracket starts. It falls where Employment Insurance or the Canada Pension Plan stops.',
    ),
    words(
      'Both rates count income tax (federal and Saskatchewan, line 43500 of the T1 return), Canada Pension Plan in both tiers, and Employment Insurance as Form T2204 works it out. Credits paid to you when you file are not counted. They are for a single person whose only income is a salary.',
    ),
    words(
      'The 2026 forms are not out yet. These figures use the 2026 tax tables from the Canada Revenue Agency: rates, brackets, basic amounts, Canada Pension Plan and Employment Insurance. The Form T2204 rules and the line layout of the forms are the 2025 forms’ carried forward. We will update them when the 2026 forms are final.',
    ),
  ],
  howToRead: [
    words(
      'The bracket thresholds printed on the tax forms are taxable incomes, and the federal basic personal amount uses net income. Neither is your salary. For a salary only, taxable income and net income are the same amount: your salary less the enhanced part of your Canada Pension Plan, which you deduct. The Canada Pension Plan and Employment Insurance limits are on pay, so they are already salaries.',
    ),
    words(
      'From {cppStart} up to {cppYmpe}, taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {cppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Cents} for every dollar, so taxable income is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. So a threshold on a form sits a little higher in salary: about {shiftSkBracket2} higher at a taxable income of {skBracket2Ti}, about {shiftFedBracket2} higher at {fedBracket2Ti}, and {taxableCut} higher from {yampe}. This page gives the salary.',
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
          'From about {fedStartSalary} to about {skStartSalary} the rate stays {fedFirstRate}: federal tax and the pension and insurance payments. Saskatchewan income tax starts at about {skStartSalary}. Until then, Saskatchewan’s credits for your basic amount and for your Canada Pension Plan and Employment Insurance payments are worth more than the tax on your taxable income.',
          ['sk428'],
        ),
        words(
          'From about {skStartSalary} the rate is {skStartRate}: Saskatchewan’s first tax rate, {skBracket1}, on top of the federal tax and the payments. Nothing else changes it until {skBracket2Salary}. Saskatchewan has no health premium or surtax.',
          ['sk428'],
        ),
      ],
    },
    {
      heading: '$50,000 to $100,000',
      notes: [
        words(
          'From about {skBracket2Salary} the rate is {skBracket2Rate}: Saskatchewan’s second tax rate, {skBracket2}, starts at a taxable income of {skBracket2Ti}.',
          ['sk428'],
        ),
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
          'From about {fedBracket3Salary} the rate is {fedBracket3Rate}: the federal rate rises to {fedBracket3} at a taxable income of {fedBracket3Ti}.',
          ['t1'],
        ),
        words(
          'From about {skBracket3Salary} the rate is {skBracket3Rate}: Saskatchewan’s third tax rate, {skBracket3}, starts at a taxable income of {skBracket3Ti}.',
          ['sk428'],
        ),
        words(
          'From about {fedBracket4Salary} the rate is {fedBracket4Rate}: the federal rate rises to {fedBracket4}. The federal basic personal amount also begins to shrink, which adds about {bpaTaperPoint} point to the rate.',
          ['t1'],
        ),
      ],
    },
    {
      heading: 'Above $260,000',
      notes: [
        words(
          'From about {topStart} the line is straight: of every extra dollar, {topMarginal} goes to tax. The federal top rate, {fedTop}, starts then, and the federal basic personal amount has finished shrinking. At {salary500k} the average rate is {avgAt500k}.',
          ['t1', 'sk428'],
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
      head: [
        'Taxable income from',
        'Rate',
        'Salary where it starts',
        'Marginal rate after',
      ],
      ...cells(brackets('fed', 5, '{fedFirstRate}')),
      after: words(
        'The marginal rate after the {fedBracket3} bracket is almost the same as after the {fedBracket2} bracket, a little below it. Between the two, Employment Insurance and both Canada Pension Plan tiers stop, which takes off about as much as the higher federal rate adds. The lowest federal rate is {fedLowest} for the whole of 2026. In 2025 it was {fedLowestRatePrior}. The federal basic personal amount is {fedBpa}, and shrinks to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}.',
      ),
    },
    {
      heading: 'Saskatchewan brackets, 2026 (Form SK428)',
      caption: 'Saskatchewan brackets, 2026',
      head: [
        'Taxable income from',
        'Rate',
        'Salary where it starts',
        'Marginal rate after',
      ],
      ...cells(brackets('sk', 3, '{skStartRate}')),
      after: words(
        'Saskatchewan’s basic personal amount is {skBpa}, the same at every income, and the credit rate is {skCreditRate}. Saskatchewan tax starts at a salary of about {skStartSalary}, a little above that amount, for two reasons. The credits for your Canada Pension Plan and Employment Insurance payments are added to the basic amount, and your taxable income is a little less than your salary.',
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
