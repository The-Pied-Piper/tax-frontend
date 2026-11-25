import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The Ontario rates page: the wording of the rates page, with every figure a spec the Ontario sweep resolves
 * (see `hubNotes.ts`). The words say "about" where the copy thread's text does; a bracket's salary is worked out exactly from the form's taxable income, and a band's edges are the engine's own.
 */
const pool: Record<string, string> = {
  // Rules the forms print as words or round numbers, which no data of ours holds: declared, so a test can see them.
  cpp2Cents: 'l:4 cents',
  sixCents: 'l:6 cents',
  liftCents: 'l:5 cents',
  quarterCents: 'l:25 cents',
  oneDollar: 'l:$1',
  zeroDollars: 'l:$0',
  fedLowestPct: 'p:fed_bracket_1_rate',
  surtax1Cents: 't:surtax_first_rate',
  surtax2Cents: 't:surtax_second_rate',
  surtaxTotalCents: 't:surtax_total_rate',
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
  fedBracket2: 'p:fed_bracket_2_rate',
  fedBasicAmount: 'f:fed_bpa',
  // The Ontario Health Premium, its five steps.
  ohp1From: 'f:ohp_2_salary',
  ohp1To: 'f:ohp_3_salary_to',
  ohp1Max: 'f:ohp_3_amount',
  ohp1Rate: 'h:marginal@21000',
  ohp2From: 'e:36330',
  ohp2To: 'o:38850',
  ohp2Rate: 'h:marginal@37000',
  ohp2Max: 'f:ohp_5_amount',
  ohp3From: 'e:48450',
  ohp3To: 'o:49060',
  ohp3Rate: 'h:marginal@49000',
  ohp3Max: 'f:ohp_7_amount',
  ohp4From: 'e:72700',
  ohp4To: 'o:73300',
  ohp4Rate: 'h:marginal@73000',
  ohp4Max: 'f:ohp_9_amount',
  ohp5From: 'e:201130',
  ohp5To: 'o:201730',
  ohp5Rate: 'h:marginal@201200',
  ohp5Max: 'f:ohp_11_amount',
  // Ontario tax starts, and the LIFT Credit.
  ontStartSalary: 'e:32580',
  ontStartRate: 'y:32580',
  liftRate: 'y:32800',
  liftStartSalary: 'e:32800',
  liftMax: 'f:lift_max',
  liftThreshold: 'f:lift_threshold',
  liftEndSalary: 'e:50470',
  liftEndAni: 'f:lift_end_ani',
  afterLiftRate: 'h:marginal@51000',
  // The brackets, federal and Ontario.
  ontBracket2Salary: 'f:ont_bracket_2_salary',
  ontBracket2Rate: 'h:marginal@55000',
  ontBracket2: 'p:ont_bracket_2_rate',
  ontBracket2Ti: 'f:ont_bracket_2_ti',
  fedBracket2Salary: 'f:fed_bracket_2_salary',
  fedBracket2Rate: 'h:marginal@60000',
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  ontBracket3Salary: 'f:ont_bracket_3_salary',
  ontBracket3Rate: 'h:marginal@109000',
  ontBracket3: 'p:ont_bracket_3_rate',
  ontBracket3Ti: 'f:ont_bracket_3_ti',
  fedBracket3Salary: 'f:fed_bracket_3_salary',
  fedBracket3Rate: 'h:marginal@119000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  ontBracket4Salary: 'f:ont_bracket_4_salary',
  ontBracket4Rate: 'h:marginal@152000',
  ontBracket4: 'p:ont_bracket_4_rate',
  ontBracket4Ti: 'f:ont_bracket_4_ti',
  fedBracket4Salary: 'f:fed_bracket_4_salary',
  fedBracket4Rate: 'h:marginal@183000',
  fedBracket4: 'p:fed_bracket_4_rate',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
  ontBracket5Salary: 'f:ont_bracket_5_salary',
  ontBracket5Rate: 'h:marginal@222000',
  ontBracket5: 'p:ont_bracket_5_rate',
  ontBracket5Ti: 'f:ont_bracket_5_ti',
  fedTop: 'p:fed_bracket_5_rate',
  // The Canada Pension Plan.
  cppYmpe: 'f:cpp_ympe',
  yampe: 'f:yampe',
  cpp2Rate: 'p:cpp2_rate',
  afterCppRate: 'h:marginal@75000',
  afterCpp2Rate: 'h:marginal@86000',
  // The surtax.
  surtax1: 'f:surtax_first',
  surtax1Salary: 'e:98000',
  surtax1Rate: 'h:marginal@99000',
  surtax2: 'f:surtax_second',
  surtax2Salary: 'e:115000',
  surtax2Rate: 'h:marginal@116000',
  // How to read the salaries.
  taxableFactor: 'x:taxable_factor',
  taxableConstant: 'f:taxable_constant',
  taxableFactor2: 'x:taxable_factor_2',
  taxableConstant2: 'f:taxable_constant_2',
  taxableCut: 'f:taxable_cut',
  shiftOhp1: 'f:shift_ohp_1',
  ohp1FromTi: 'f:ohp_2_ti',
  shiftOntBracket2: 'f:shift_ont_bracket_2',
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

/** A figure each table cell needs and the notes do not: the rows of the brackets and of the Ontario Health Premium. */
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
  fed2After: 'h:marginal@60000',
  fed3After: 'h:marginal@119000',
  fed4After: 'h:marginal@183000',
  fed5After: 'h:marginal@300000',
  ont1: 'p:ont_bracket_1_rate',
  ont1Ti: 'f:ont_bracket_1_ti',
  ont2Ti: 'f:ont_bracket_2_ti',
  ont2: 'p:ont_bracket_2_rate',
  ont2Sal: 'f:ont_bracket_2_salary',
  ont3Ti: 'f:ont_bracket_3_ti',
  ont3: 'p:ont_bracket_3_rate',
  ont3Sal: 'f:ont_bracket_3_salary',
  ont4Ti: 'f:ont_bracket_4_ti',
  ont4: 'p:ont_bracket_4_rate',
  ont4Sal: 'f:ont_bracket_4_salary',
  ont5Ti: 'f:ont_bracket_5_ti',
  ont5: 'p:ont_bracket_5_rate',
  ont5Sal: 'f:ont_bracket_5_salary',
  ont2After: 'h:marginal@55000',
  ont3After: 'h:marginal@109000',
  ont4After: 'h:marginal@152000',
  ont5After: 'h:marginal@222000',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  cea: 'f:cea',
  ontBpa: 'f:ont_bpa',
  surtax1Pct: 'p:surtax_first_rate',
  surtax2Pct: 'p:surtax_second_rate',
  surtaxTotalPct: 'p:surtax_total_rate',
  // The Ontario Health Premium rows: where each starts in taxable income and in salary, and what it adds.
  o2Ti: 'f:ohp_2_ti',
  o2Sal: 'f:ohp_2_salary',
  o2SalTo: 'f:ohp_2_salary_to',
  o2Rate: 'p:ohp_2_rate',
  o3Ti: 'f:ohp_3_ti',
  o3Amount: 'f:ohp_3_amount',
  o3Sal: 'f:ohp_3_salary',
  o3SalTo: 'f:ohp_3_salary_to',
  o4Ti: 'f:ohp_4_ti',
  o4Plus: 'f:ohp_4_plus',
  o4Rate: 'p:ohp_4_rate',
  o4Sal: 'f:ohp_4_salary',
  o4SalTo: 'f:ohp_4_salary_to',
  o5Ti: 'f:ohp_5_ti',
  o5Amount: 'f:ohp_5_amount',
  o5Sal: 'f:ohp_5_salary',
  o5SalTo: 'f:ohp_5_salary_to',
  o6Ti: 'f:ohp_6_ti',
  o6Plus: 'f:ohp_6_plus',
  o6Rate: 'p:ohp_6_rate',
  o6Sal: 'f:ohp_6_salary',
  o6SalTo: 'f:ohp_6_salary_to',
  o7Ti: 'f:ohp_7_ti',
  o7Amount: 'f:ohp_7_amount',
  o7Sal: 'f:ohp_7_salary',
  o7SalTo: 'f:ohp_7_salary_to',
  o8Ti: 'f:ohp_8_ti',
  o8Plus: 'f:ohp_8_plus',
  o8Rate: 'p:ohp_8_rate',
  o8Sal: 'f:ohp_8_salary',
  o8SalTo: 'f:ohp_8_salary_to',
  o9Ti: 'f:ohp_9_ti',
  o9Amount: 'f:ohp_9_amount',
  o9Sal: 'f:ohp_9_salary',
  o9SalTo: 'f:ohp_9_salary_to',
  o10Ti: 'f:ohp_10_ti',
  o10Plus: 'f:ohp_10_plus',
  o10Rate: 'p:ohp_10_rate',
  o10Sal: 'f:ohp_10_salary',
  o10SalTo: 'f:ohp_10_salary_to',
  o11Ti: 'f:ohp_11_ti',
  o11Amount: 'f:ohp_11_amount',
  o11Sal: 'f:ohp_11_salary',
  o11SalTo: 'f:ohp_11_salary_to',
  eiMaxPay: 'f:ei_stop',
  eiPremiumMax: 'n:ei_max_premium',
  cppMax: 'n:cpp_max',
  cpp2Max: 'f:cpp2_max',
  cppBase: 'p:cpp_base_rate',
  cppExtra: 'p:cpp_enhanced_rate',
};

const brackets = (kind: 'fed' | 'ont') =>
  [1, 2, 3, 4, 5].map((n) => [
    `{${kind}${n.toString()}Ti}`,
    `{${kind}${n.toString()}}`,
    n === 1 ? '' : `{${kind}${n.toString()}Sal}`,
    n === 1 ? '' : `{${kind}${n.toString()}After}`,
  ]);

export const ontarioRatesPage: RatesPageText = {
  title: 'Ontario marginal and average tax rate by salary, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in Ontario in 2026, and what causes every step.',
  heading: 'Ontario marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In Ontario the marginal rate is the share of your next dollar that goes to income tax, Canada Pension Plan and Employment Insurance. It climbs from about {lowMarginal} once you pay into the Canada Pension Plan (from {cppStart}) to {topMarginal} above {topStart}, with short spikes where the Ontario Health Premium steps up. The average rate climbs more slowly, to {avgAt500k} at {salary500k}.',
    ),
    words(
      'Both rates count income tax (federal and Ontario, line 43500 of the T1 return, so tax cuts such as the Ontario LIFT Credit count), Canada Pension Plan in both tiers, and Employment Insurance as Form T2204 works it out. Credits paid to you when you file are not counted. They are for a single person whose only income is a salary.',
    ),
    words(
      'The 2026 forms are not out yet. These figures use the 2026 tax tables from the Canada Revenue Agency: rates, brackets, basic amounts, surtax and the Ontario Health Premium, Canada Pension Plan and Employment Insurance. The LIFT Credit amounts and the Form T2204 rules are the 2025 forms’ amounts carried forward. We will update them when the 2026 forms are final.',
    ),
  ],
  howToRead: [
    words(
      'The bracket and Ontario Health Premium thresholds printed on the tax forms are taxable incomes. The federal basic personal amount and the LIFT Credit use net income and adjusted net income. The surtax uses your Ontario tax after credits. None of these is your salary. For a salary only, taxable income, net income and adjusted net income are the same amount: your salary less the enhanced part of your Canada Pension Plan, which you deduct. The Canada Pension Plan and Employment Insurance limits are on pay, so they are already salaries.',
    ),
    words(
      'From {cppStart} up to {cppYmpe}, taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {cppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Cents} for every dollar, so taxable income is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. So a threshold on a form sits a little higher in salary: about {shiftOhp1} higher at a taxable income of {ohp1FromTi}, about {shiftOntBracket2} higher at {ontBracket2Ti}, and {taxableCut} higher from {yampe}. This page gives the salary.',
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
          'From {ohp1From} to {ohp1To} the Ontario Health Premium adds {sixCents} for every dollar of taxable income, up to {ohp1Max} in all. The rate is {ohp1Rate}, then {fedFirstRate} again.',
          ['on428'],
        ),
        words(
          'From {ohp1To} to {ontStartSalary} the rate stays {fedFirstRate}, all of it federal tax and the pension and insurance payments. Ontario income tax starts at {ontStartSalary}. Until then Ontario’s credits for your basic amount, pension and insurance payments, and then the LIFT Credit, cover it.',
          ['on428', 'on428a'],
        ),
        words(
          'From {ontStartSalary} the rate is {ontStartRate}, then {liftRate} from {liftStartSalary}. The Ontario LIFT Credit lowers your Ontario tax, up to {liftMax}. It shrinks by {liftCents} for every dollar of adjusted net income above {liftThreshold}, and that is about {liftStartSalary} of salary. It does not lower the Ontario Health Premium.',
          ['on428a'],
        ),
        words(
          'From {ohp2From} to {ohp2To} the rate is {ohp2Rate}: a second step in the Ontario Health Premium, {sixCents} for every dollar of taxable income, up to {ohp2Max} in all.',
          ['on428'],
        ),
        words(
          'The LIFT Credit is gone at about {liftEndSalary} of salary (an adjusted net income of {liftEndAni}), and the rate falls to {afterLiftRate}.',
          ['on428a'],
        ),
        words(
          'A short spike to {ohp3Rate} from {ohp3From} to {ohp3To}: a step in the Ontario Health Premium, {quarterCents} for every dollar of taxable income, up to {ohp3Max} in all, while the LIFT Credit is still shrinking.',
          ['on428', 'on428a'],
        ),
      ],
    },
    {
      heading: '$50,000 to $100,000',
      notes: [
        words(
          'From {ontBracket2Salary} the rate is {ontBracket2Rate}: Ontario’s second tax rate, {ontBracket2}, starts at a taxable income of {ontBracket2Ti}. The LIFT Credit is gone by then.',
          ['on428'],
        ),
        words(
          'From {fedBracket2Salary} the rate is {fedBracket2Rate}: the federal rate rises to {fedBracket2} at a taxable income of {fedBracket2Ti}.',
          ['t1'],
        ),
        words(
          'Employment Insurance stops at {eiStop}, at most {eiMax} a year, and the rate falls to {afterEiRate}.',
          ['t2204'],
        ),
        words(
          'A spike to {ohp4Rate} from {ohp4From} to {ohp4To}, another Ontario Health Premium step, up to {ohp4Max} in all.',
          ['on428'],
        ),
        words(
          'The main Canada Pension Plan amount stops at {cppYmpe}. A second tier takes {cpp2Rate} of each dollar from there to {yampe}, so the rate falls to {afterCppRate}, and then to {afterCpp2Rate} at {yampe}, when that tier stops.',
          ['schedule8'],
        ),
        words(
          'Ontario’s surtax adds {surtax1Cents} for every dollar of your Ontario tax above {surtax1}. This is the tax after your credits, before the LIFT Credit and the health premium. It starts at a salary of {surtax1Salary}, and the rate rises to {surtax1Rate}.',
          ['on428'],
        ),
      ],
    },
    {
      heading: '$100,000 to $260,000',
      notes: [
        words(
          'From {ontBracket3Salary} the rate is {ontBracket3Rate}: Ontario’s third tax rate, {ontBracket3}, starts at a taxable income of {ontBracket3Ti}.',
          ['on428'],
        ),
        words(
          'A second surtax step adds a further {surtax2Cents} for every dollar of your Ontario tax above {surtax2}, so {surtaxTotalCents} in all. It starts at a salary of {surtax2Salary}, and the rate rises to {surtax2Rate}.',
          ['on428'],
        ),
        words(
          'From {fedBracket3Salary} the rate is {fedBracket3Rate}: the federal rate rises to {fedBracket3} at a taxable income of {fedBracket3Ti}.',
          ['t1'],
        ),
        words(
          'From {ontBracket4Salary} the rate is {ontBracket4Rate}: Ontario’s fourth tax rate, {ontBracket4}, starts at a taxable income of {ontBracket4Ti}, and the surtax applies to it.',
          ['on428'],
        ),
        words(
          'From {fedBracket4Salary} the rate is {fedBracket4Rate}: the federal rate rises to {fedBracket4}. The federal basic personal amount also begins to shrink, which adds about {bpaTaperPoint} point to the rate.',
          ['t1'],
        ),
        words(
          'A spike to {ohp5Rate} from {ohp5From} to {ohp5To}: the last step in the Ontario Health Premium, up to {ohp5Max} in all.',
          ['on428'],
        ),
        words(
          'From {ontBracket5Salary} the rate is {ontBracket5Rate}: Ontario’s top tax rate, {ontBracket5}, starts at a taxable income of {ontBracket5Ti}.',
          ['on428'],
        ),
      ],
    },
    {
      heading: 'Above $260,000',
      notes: [
        words(
          'From {topStart} the line is straight: of every extra dollar, {topMarginal} goes to tax. The federal top rate, {fedTop}, starts then, and the federal basic personal amount has finished shrinking. At {salary500k} the average rate is {avgAt500k}.',
          ['t1', 'on428'],
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
      head: [
        'Taxable income from',
        'Rate',
        'Salary where it starts',
        'Marginal rate after',
      ],
      ...cells(brackets('fed')),
      after: {
        ...note(
          'The lowest federal rate is {fedLowest} for the whole of 2026. In 2025 it was {fedLowestRatePrior}. The federal basic personal amount is {fedBpa}, and shrinks to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}.',
          tablePool,
        ),
      },
    },
    {
      heading: 'Ontario brackets, 2026 (Form ON428)',
      caption: 'Ontario brackets, 2026',
      head: [
        'Taxable income from',
        'Rate',
        'Salary where it starts',
        'Marginal rate after',
      ],
      ...cells(brackets('ont')),
      after: note('The Ontario basic personal amount is {ontBpa}.', tablePool),
    },
    {
      heading: 'Ontario surtax',
      before: note(
        'Ontario adds a surtax to your Ontario tax. It is {surtax1Pct} of your Ontario tax after credits above {surtax1}, and a further {surtax2Pct} above {surtax2}, so {surtaxTotalPct} in all above that. These two amounts are tax, not income. They start to show at salaries of about {surtax1Salary} and {surtax2Salary}.',
        { ...pool, ...tablePool },
      ),
      caption: '',
      head: [],
      rows: [],
      figures: {},
    },
    {
      heading: 'Ontario Health Premium, 2026 (Form ON428)',
      before: words(
        'The premium is a flat amount for each range of taxable income, with a short slope between ranges. It is part of Ontario tax, and it is not reduced by the Ontario tax reduction or the LIFT Credit.',
      ),
      caption: 'Ontario Health Premium, 2026',
      head: ['Taxable income', 'Premium', 'Salary equivalent'],
      ...cells([
        ['up to {o2Ti}', '{zeroDollars}', 'up to {o2SalTo}'],
        [
          '{o2Ti} to {o3Ti}',
          '{o2Rate} of the part above {o2Ti}, up to {o3Amount}',
          '{o2Sal} to {o3SalTo}',
        ],
        ['{o3Ti} to {o4Ti}', '{o3Amount}', 'up to {o4SalTo}'],
        [
          '{o4Ti} to {o5Ti}',
          '{o4Plus} plus {o4Rate} of the part above {o4Ti}, up to {o5Amount}',
          '{o4Sal} to {o5SalTo}',
        ],
        ['{o5Ti} to {o6Ti}', '{o5Amount}', 'up to {o6SalTo}'],
        [
          '{o6Ti} to {o7Ti}',
          '{o6Plus} plus {o6Rate} of the part above {o6Ti}, up to {o7Amount}',
          '{o6Sal} to {o7SalTo}',
        ],
        ['{o7Ti} to {o8Ti}', '{o7Amount}', 'up to {o8SalTo}'],
        [
          '{o8Ti} to {o9Ti}',
          '{o8Plus} plus {o8Rate} of the part above {o8Ti}, up to {o9Amount}',
          '{o8Sal} to {o9SalTo}',
        ],
        ['{o9Ti} to {o10Ti}', '{o9Amount}', 'up to {o10SalTo}'],
        [
          '{o10Ti} to {o11Ti}',
          '{o10Plus} plus {o10Rate} of the part above {o10Ti}, up to {o11Amount}',
          '{o10Sal} to {o11SalTo}',
        ],
        ['over {o11Ti}', '{o11Amount}', 'over {o11SalTo}'],
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
