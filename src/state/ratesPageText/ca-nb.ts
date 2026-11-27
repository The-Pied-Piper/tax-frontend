import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The New Brunswick rates page: the wording of the rates page (copy thread, CRA-reviewed), with every figure a spec the
 * New Brunswick sweep resolves (see `hubNotes.ts`). The words say "about" where the copy thread's text does: in the
 * prose a salary where a rate changes is the nearest whole dollar to the exact one (`o:` reads the last salary at the
 * old rate, `e:` the first at the new rate), and in the tables it is the first whole salary at the new rate, which is what
 * the chart shows. The province has no health premium and no surtax, so there are no spike notes; its low-income tax
 * reduction is lost while the provincial tax shows, which makes one wider band.
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
  // Federal tax starts: about $19,200 in words, $19,201 in the table.
  fedStartSalary: 'o:19000',
  fedStartTable: 'e:19000',
  fedFirstRate: 'h:marginal@20000',
  fedTaxPart: 'w:marginal@20000-12000',
  fedLowestRate: 'p:fed_bracket_1_rate',
  fedBracket2: 'p:fed_bracket_2_rate',
  // The provincial low-income tax reduction.
  reductionMax: 'f:reduction_max',
  reductionStartNi: 'f:reduction_start',
  reductionStartSalary: 'f:reduction_start_salary',
  reductionRate: 'p:reduction_rate',
  nbTaxShowsSalary: 'e:23000',
  lowIncomeBandRate: 'h:marginal@30000',
  nbTaxPart: 'v:nb_tax_part',
  nb1: 'p:nb_bracket_1_rate',
  reductionEndSalary: 'o:49000',
  reductionEndTable: 'e:49000',
  reductionEndNi: 'f:reduction_end_ni',
  afterReductionRate: 'h:marginal@50000',
  // The brackets, federal and provincial.
  nbBracket2Salary: 'o:52000',
  nbBracket2Rate: 'h:marginal@53000',
  nbBracket2: 'p:nb_bracket_2_rate',
  nbBracket2Ti: 'f:nb_bracket_2_ti',
  fedBracket2Salary: 'f:fed_bracket_2_salary',
  fedBracket2Rate: 'h:marginal@60000',
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  nbBracket3Salary: 'f:nb_bracket_3_salary',
  nbBracket3Rate: 'h:marginal@106000',
  nbBracket3: 'p:nb_bracket_3_rate',
  nbBracket3Ti: 'f:nb_bracket_3_ti',
  fedBracket3Salary: 'f:fed_bracket_3_salary',
  fedBracket3Rate: 'h:marginal@119000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  fedBracket4Salary: 'f:fed_bracket_4_salary',
  fedBracket4Rate: 'h:marginal@183000',
  fedBracket4: 'p:fed_bracket_4_rate',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
  nbBracket4Salary: 'f:nb_bracket_4_salary',
  nbBracket4Rate: 'h:marginal@195000',
  nbBracket4: 'p:nb_bracket_4_rate',
  nbBracket4Ti: 'f:nb_bracket_4_ti',
  fedBracket5Rate: 'h:marginal@260000',
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
  shiftNbBracket2: 'f:shift_nb_bracket_2',
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
  nb1Ti: 'f:nb_bracket_1_ti',
  nb2Ti: 'f:nb_bracket_2_ti',
  nb2: 'p:nb_bracket_2_rate',
  nb2Sal: 'f:nb_bracket_2_salary',
  nb3Ti: 'f:nb_bracket_3_ti',
  nb3: 'p:nb_bracket_3_rate',
  nb3Sal: 'f:nb_bracket_3_salary',
  nb4Ti: 'f:nb_bracket_4_ti',
  nb4: 'p:nb_bracket_4_rate',
  nb4Sal: 'f:nb_bracket_4_salary',
  nb2After: 'a:marginal@53000',
  nb3After: 'a:marginal@106000',
  nb4After: 'a:marginal@195000',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  cea: 'f:cea',
  nbBpa: 'f:nb_bpa',
  nbCreditRate: 'p:nb_credit_rate',
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
  n === 1 ? 'tax begins at {fedStartTable}' : `{fed${n.toString()}Sal}`,
  n === 1 ? '{fedFirstRate}' : `{fed${n.toString()}After}`,
]);

const provincialRows = [1, 2, 3, 4].map((n) => [
  `{nb${n.toString()}Ti}`,
  `{nb${n.toString()}}`,
  n === 1 ? 'tax starts at about {nbTaxShowsSalary}' : `{nb${n.toString()}Sal}`,
  n === 1
    ? '{lowIncomeBandRate}, then {afterReductionRate} from {reductionEndTable}'
    : `{nb${n.toString()}After}`,
]);

const bracketHead = [
  'Taxable income from',
  'Rate',
  'Salary where it starts',
  'Marginal rate after',
];

export const newBrunswickRatesPage: RatesPageText = {
  title: 'New Brunswick marginal and average tax rate by salary, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in New Brunswick in 2026, from $0 to $500,000, and what causes every step.',
  heading: 'New Brunswick marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In New Brunswick the marginal rate is the share of your next dollar that goes to income tax, Canada Pension Plan and Employment Insurance. It climbs from about {lowMarginal} once you pay into the Canada Pension Plan (from {cppStart}) to {topMarginal} above {topStart}, with a higher stretch from {nbTaxShowsSalary} to {reductionEndSalary} where the provincial low-income tax reduction is lost. The average rate climbs more slowly, to {avgAt500k} at {salary500k}. There are no health premium or surtax steps.',
    ),
    words(
      'Both rates count income tax (federal and New Brunswick, so the provincial low-income tax reduction counts), Canada Pension Plan in both tiers, and Employment Insurance as Form T2204 works it out. Credits paid to you when you file are not counted: the Canada workers benefit, the Employment Insurance refund and New Brunswick’s own benefits paid separately. They are for a single person whose only income is a salary.',
    ),
  ],
  howToRead: [
    words(
      'The bracket thresholds printed on the tax forms are taxable incomes. The low-income tax reduction uses adjusted family income, and the federal basic personal amount uses net income. None of these is your salary. For a salary only, taxable income, adjusted family income and net income are all the same amount: your salary less the enhanced part of your Canada Pension Plan, which you deduct. The Canada Pension Plan and Employment Insurance limits are on pay, so they are already salaries.',
    ),
    words(
      'From {cppStart} up to {cppYmpe}, taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {cppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Rate} of every dollar, so taxable income is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. So a threshold on a form sits a little higher in salary: about {shiftReduction} higher at an income of {reductionStartNi}, about {shiftNbBracket2} higher at a taxable income of {nbBracket2Ti}, and {taxableCut} higher from {yampe}. This page gives the salary.',
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
          'It is {fedFirstRate} from about {fedStartSalary}, when federal income tax starts. That is {cppEiRate} for the pension and insurance payments plus about {fedTaxPart} of federal tax ({fedLowestRate} of each extra dollar, less the credits that grow with it). It is a total, not a tax rate. The federal {fedBracket2} rate starts much higher, at a taxable income of {fedBracket2Ti}. No New Brunswick tax shows yet, because its credits and low-income tax reduction cover it.',
          ['t1', 'nb428'],
        ),
      ],
    },
    {
      heading: '$20,000 to $50,000',
      notes: [
        words(
          'The New Brunswick low-income tax reduction lowers your provincial tax, by up to {reductionMax} for a single person. It is worked out on adjusted family income. It starts to shrink at {reductionStartNi}, about {reductionStartSalary} of salary, by {reductionRate} of every dollar of income above that. Until about {nbTaxShowsSalary} what is left still cancels all your provincial tax, so the rate does not change.',
          ['nb428'],
        ),
        words(
          'From about {nbTaxShowsSalary} to about {reductionEndSalary} the rate is {lowIncomeBandRate}. That is the {fedFirstRate} from before, plus about {nbTaxPart} for New Brunswick tax ({nb1} of each extra dollar, less the credits that grow with it), plus the reduction you lose, {reductionRate} of each extra dollar of income. It is higher than before and after because provincial tax shows while the reduction is still shrinking.',
          ['nb428'],
        ),
        words(
          'The reduction is gone at about {reductionEndSalary} of salary (a net income of {reductionEndNi}), and the rate falls to {afterReductionRate}. For a single person the form gives the reduction only to a net income under that amount. New Brunswick has no health premium or surtax.',
          ['nb428'],
        ),
      ],
    },
    {
      heading: '$50,000 to $100,000',
      notes: [
        words(
          'From about {nbBracket2Salary} the rate is {nbBracket2Rate}: the second provincial rate, {nbBracket2}, starts at a taxable income of {nbBracket2Ti}.',
          ['nb428'],
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
          'From about {nbBracket3Salary} the rate is {nbBracket3Rate}: the third provincial rate, {nbBracket3}, starts at a taxable income of {nbBracket3Ti}.',
          ['nb428'],
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
          'From about {nbBracket4Salary} the rate is {nbBracket4Rate}: the fourth and top provincial rate, {nbBracket4}, starts at a taxable income of {nbBracket4Ti}.',
          ['nb428'],
        ),
      ],
    },
    {
      heading: 'About $260,000 and above',
      notes: [
        words(
          'From about {topStart} the line is straight: the federal rate rises to {fedBracket5} at a taxable income of {fedBracket5Ti}, and the federal basic personal amount has finished shrinking. Of every extra dollar, {topMarginal} goes to tax, and you keep {keepTop}. New Brunswick has no step above this. At {salary500k} the average rate is {avgAt500k}.',
          ['t1', 'nb428'],
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
          'The lowest federal rate is {fedLowest} for the whole of 2026. In 2025 it was {fedLowestRatePrior}. The federal basic personal amount is {fedBpa}, and shrinks to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}. The {fedFirstRate} in the chart from {fedStartSalary} to {nbTaxShowsSalary} is a total ({cppEiRate} of pension and insurance payments plus {fedTaxPart} of federal tax). It is not the federal bracket rate, which is also {fedBracket2} but starts at a taxable income of {fedBracket2Ti}.',
          { ...pool, ...tablePool },
        ),
      },
    },
    {
      heading: 'New Brunswick brackets, 2026 (Form NB428)',
      caption: 'New Brunswick brackets, 2026',
      head: bracketHead,
      ...cells(provincialRows),
      after: note(
        'New Brunswick’s basic personal amount is {nbBpa}, and the credit rate is the lowest tax rate, {nbCreditRate}. There is no New Brunswick Canada employment amount.',
        tablePool,
      ),
    },
    {
      heading: 'Low-income tax reduction, 2026 (Form NB428)',
      before: words(
        'The reduction is taken off your provincial tax if your income is low. It cannot take the tax below zero, and it is not paid to you as cash. A single filer gets the basic amount without the extra for a spouse or dependant.',
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
          '{nbTaxShowsSalary}',
        ],
        [
          'Gone at a net income of',
          '{reductionEndNi} (salary about {reductionEndTable})',
        ],
        [
          'Rate from {nbTaxShowsSalary} until it is gone',
          '{lowIncomeBandRate}, then {afterReductionRate}',
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
