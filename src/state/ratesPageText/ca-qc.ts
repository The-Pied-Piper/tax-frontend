import { note } from '../hubNoteText/shared';
import type { CauseForm, RatesNote, RatesPageText } from '../ratesPageTypes';

/**
 * The Québec rates page: the copy thread's CRA-reviewed wording, with every figure a spec the Québec sweep resolves
 * (see `hubNotes.ts`). A salary where a rate changes is the engine's own edge (to the dollar) or a salary worked out
 * from the form's income threshold in `engine_figures.py`; a rate is read at the first sweep salary after the change,
 * to one decimal, rounded once. "Québec" is spelled with its accent wherever the page shows it.
 */
const pool: Record<string, string> = {
  // Rules the forms print as words or round numbers, which no data of ours holds: declared, so a test can see them.
  cpp2Cents: 'l:4 cents',
  hundredCents: 'l:100 cents',
  oneDollar: 'l:$1',
  zeroDollars: 'l:$0',
  // The printed 2025 maximum of the drug insurance premium, which the 2026 figure is checked against.
  drugMax2025: 'd:755',
  // The two rates, at sweep salaries just after each change.
  lowMarginal: 'h:marginal@4000',
  topMarginal: 'h:marginal@300000',
  topStart: 'f:fed_bracket_5_salary',
  topStartExact: 'f:fed_bracket_5_salary',
  avgAt500k: 'h:average@500000',
  keepTop: 'u:marginal@300000',
  keepAt500k: 'u:average@500000',
  salary500k: 'd:500000',
  qppStart: 'f:qpp_start',
  qppYmpe: 'f:qpp_ympe',
  yampe: 'f:yampe',
  drugStartSalary: 'e:21000',
  drugStep2Salary: 'e:26000',
  drugMaxSalary: 'e:29000',
  // Employment Insurance, Québec Parental Insurance Plan premiums and the $2,000 rule.
  eiStart: 'f:ei_exemption',
  eiFullSalary: 'f:ei_band_end',
  eiFullAmount: 'n:ei_full_amount',
  eiBandRate: 'h:marginal@2020',
  qpipFirst: 'n:qpip_first',
  qpipCents: 't:qpip_rate',
  eiQpipRate: 'h:marginal@3000',
  qppEiQpipRate: 'h:marginal@12000',
  qppRate: 's:qpp_rate',
  qppBaseRate: 's:qpp_base_rate',
  qppEnhancedRate: 's:qpp_enhanced_rate',
  qpp2Rate: 'p:qpp2_rate',
  qppMax: 'n:qpp_max',
  qpp2Max: 'f:qpp2_max',
  eiRate: 's:ei_rate',
  qpipRate: 's:qpip_rate',
  eiStop: 'f:ei_stop',
  eiMax: 'n:ei_max_premium',
  qpipStop: 'f:qpip_stop',
  qpipMax: 'n:qpip_max',
  afterEiRate: 'h:marginal@69000',
  afterQppRate: 'h:marginal@75000',
  afterQpp2Rate: 'h:marginal@86000',
  afterQpipRate: 'h:marginal@104000',
  // Federal tax starts, and what the Québec abatement leaves of it.
  fedStartSalary: 'e:19000',
  fedFirstRate: 'h:marginal@20000',
  fedPart: 'g:marginal@20000-12000',
  fedLowestCents: 't:fed_bracket_1_rate',
  abatementRate: 'p:abatement_rate',
  fedAfterAbatementCents: 't:fed_bracket_1_effective',
  fedBasicAmount: 'f:fed_bpa',
  // Québec tax starts, and the premium for the drug insurance plan.
  qcStartSalary: 'e:20000',
  qcStartRate: 'h:marginal@21000',
  qcBracket1: 'p:qc_bracket_1_rate',
  qcBpa: 'f:qc_bpa',
  drugStartRate: 'h:marginal@22000',
  drugRate1: 'p:drug_rate_1',
  drugStep: 'f:drug_step_amount',
  drugCents1: 't:drug_cents_1',
  workersMaxSalary: 'e:24000',
  workersMaxRate: 'h:marginal@25000',
  workersRate: 'p:workers_rate',
  workersMax: 'f:workers_max',
  qcShareCents: 't:qc_factor_0',
  drugStep2Rate: 'h:marginal@27000',
  drugRate2: 'p:drug_rate_2',
  drugCents2: 't:drug_cents_2',
  drugMax: 'n:drug_max',
  drugStartNi: 'f:drug_start_ni',
  afterDrugRate: 'h:marginal@30000',
  // The brackets, Québec and federal.
  qcBracket2Salary: 'e:56000',
  qcBracket2Rate: 'h:marginal@57000',
  qcBracket2: 'p:qc_bracket_2_rate',
  qcBracket2Ti: 'f:qc_bracket_2_ti',
  fedBracket2Salary: 'e:59000',
  fedBracket2Rate: 'h:marginal@60000',
  fedBracket2: 'p:fed_bracket_2_rate',
  fedBracket2Ti: 'f:fed_bracket_2_ti',
  fedBracket2Effective: 'p:fed_bracket_2_effective',
  qcBracket3Salary: 'e:111000',
  qcBracket3Rate: 'h:marginal@112000',
  qcBracket3: 'p:qc_bracket_3_rate',
  qcBracket3Ti: 'f:qc_bracket_3_ti',
  fedBracket3Salary: 'e:118000',
  fedBracket3Rate: 'h:marginal@119000',
  fedBracket3: 'p:fed_bracket_3_rate',
  fedBracket3Ti: 'f:fed_bracket_3_ti',
  fedBracket3Effective: 'p:fed_bracket_3_effective',
  qcBracket4Salary: 'e:134000',
  qcBracket4Rate: 'h:marginal@135000',
  qcBracket4: 'p:qc_bracket_4_rate',
  qcBracket4Ti: 'f:qc_bracket_4_ti',
  fedBracket4Salary: 'e:182000',
  fedBracket4Rate: 'h:marginal@183000',
  fedBracket4: 'p:fed_bracket_4_rate',
  fedBracket4Effective: 'p:fed_bracket_4_effective',
  bpaTaperPoint: 'x:fed_bpa_taper_points',
  fedTop: 'p:fed_bracket_5_rate',
  fedBracket5Effective: 'p:fed_bracket_5_effective',
  // How to read the salaries.
  taxableFactor: 'x:taxable_factor',
  taxableConstant: 'f:taxable_constant',
  taxableFactor2: 'x:taxable_factor_2',
  taxableConstant2: 'f:taxable_constant_2',
  taxableCut: 'f:taxable_cut',
  qcFactor0: 'x:qc_factor_0',
  qcConstant0: 'f:qc_constant_0',
  qcFactor: 'x:qc_factor',
  qcConstant: 'f:qc_constant',
  qcFactor2: 'x:qc_factor_2',
  qcConstant2: 'f:qc_constant_2',
  qcCut: 'f:qc_cut',
  shiftFedBracket2: 'f:shift_fed_bracket_2',
  shiftQcBracket2: 'f:shift_qc_bracket_2',
  shiftDrug: 'f:shift_drug',
  shiftQcBracket3: 'f:shift_qc_bracket_3',
};

function words(text: string, forms: CauseForm[] = []): RatesNote {
  return { ...note(text, pool), forms };
}

/** A figure each table cell needs and the notes do not: the rows of the brackets, the drug premium and the limits. */
const tablePool: Record<string, string> = {
  fed1: 'p:fed_bracket_1_rate',
  fed1Ti: 'f:fed_bracket_1_ti',
  fed1After: 'a:marginal@20000',
  fed1Effective: 'p:fed_bracket_1_effective',
  fed2Ti: 'f:fed_bracket_2_ti',
  fed2: 'p:fed_bracket_2_rate',
  fed2Sal: 'f:fed_bracket_2_salary',
  fed2After: 'a:marginal@60000',
  fed2Effective: 'p:fed_bracket_2_effective',
  fed3Ti: 'f:fed_bracket_3_ti',
  fed3: 'p:fed_bracket_3_rate',
  fed3Sal: 'f:fed_bracket_3_salary',
  fed3After: 'a:marginal@119000',
  fed3Effective: 'p:fed_bracket_3_effective',
  fed4Ti: 'f:fed_bracket_4_ti',
  fed4: 'p:fed_bracket_4_rate',
  fed4Sal: 'f:fed_bracket_4_salary',
  fed4After: 'a:marginal@183000',
  fed4Effective: 'p:fed_bracket_4_effective',
  fed5Ti: 'f:fed_bracket_5_ti',
  fed5: 'p:fed_bracket_5_rate',
  fed5Sal: 'f:fed_bracket_5_salary',
  fed5After: 'a:marginal@300000',
  fed5Effective: 'p:fed_bracket_5_effective',
  qc1Ti: 'f:qc_bracket_1_ti',
  qc1: 'p:qc_bracket_1_rate',
  qc1After: 'a:marginal@21000',
  qc2Ti: 'f:qc_bracket_2_ti',
  qc2: 'p:qc_bracket_2_rate',
  qc2Sal: 'f:qc_bracket_2_salary',
  qc2After: 'a:marginal@57000',
  qc3Ti: 'f:qc_bracket_3_ti',
  qc3: 'p:qc_bracket_3_rate',
  qc3Sal: 'f:qc_bracket_3_salary',
  qc3After: 'a:marginal@112000',
  qc4Ti: 'f:qc_bracket_4_ti',
  qc4: 'p:qc_bracket_4_rate',
  qc4Sal: 'f:qc_bracket_4_salary',
  qc4After: 'a:marginal@135000',
  fedLowest: 'p:fed_bracket_1_rate',
  fedLowestRatePrior: 'p:fed_lowest_rate_prior',
  fedBpa: 'f:fed_bpa',
  fedBpaMin: 'f:fed_bpa_min',
  fedBpaStart: 'f:fed_bpa_taper_start',
  fedBpaEnd: 'f:fed_bpa_taper_end',
  cea: 'f:cea',
  qcBpa: 'f:qc_bpa',
  qcCreditRate: 'p:qc_credit_rate',
  workersRate: 'p:workers_rate',
  workersMax: 'f:workers_max',
  drugStepNi: 'f:drug_step_ni',
  drugMaxNi: 'f:drug_max_ni',
  eiMaxPay: 'f:ei_stop',
  eiPremiumMax: 'n:ei_max_premium',
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

const bracketHead = [
  'Taxable income from',
  'Rate',
  'Salary where it starts',
  'Marginal rate after',
];

export const quebecRatesPage: RatesPageText = {
  title: 'Québec marginal and average tax rate by salary, 2026',
  description:
    'See how much of each extra dollar and of your whole salary goes to tax in Québec in 2026, from $0 to $500,000, and what causes every step.',
  heading: 'Québec marginal and average tax rate by salary, 2026',
  intro: [
    words(
      'In Québec the marginal rate is the share of your next dollar that goes to income tax, the Québec Pension Plan (QPP), Employment Insurance, Québec Parental Insurance Plan (QPIP) premiums and the drug insurance premium. It climbs from about {lowMarginal} once you pay into the QPP (from {qppStart}) to {topMarginal} above {topStart}, with a higher stretch from {drugStartSalary} to {drugMaxSalary} where the drug insurance premium grows. The average rate climbs more slowly, to {avgAt500k} at {salary500k}. Québec has no surtax, and the Health Services Fund contribution is {zeroDollars} on a salary.',
    ),
    words(
      'Both rates count income tax, the Québec Pension Plan (QPP) in all three parts, Employment Insurance at the Québec rate as Form T2204 works it out, and Québec Parental Insurance Plan (QPIP) premiums. Income tax here is the federal tax on your federal return (Form T1), less the Québec abatement (line 44000, a credit equal to {abatementRate} of your basic federal tax that Québec residents get on their federal return), plus the Québec tax on your Québec return (Form TP-1), plus the Québec prescription drug insurance premium (line 447, from Schedule K). The premium is not a tax, but it is paid on your Québec return, so it is counted. Other credits paid to you when you file are not counted: the work premium, the solidarity tax credit, the Canada workers benefit and the Employment Insurance refund. The figures are for a single person whose only income is a salary, who has no drug plan through work, and who does not claim the amount for a person living alone (Schedule B, line 20). Claiming it would change the rates in the middle of the chart.',
    ),
  ],
  howToRead: [
    words(
      'The bracket thresholds printed on the tax forms are taxable incomes. The federal basic personal amount uses your federal net income, and the drug insurance premium uses your Québec net income, which for a salary only is the same as your Québec taxable income. None of these is your salary. Québec also takes off a deduction for workers, so your Québec taxable income is lower than your federal taxable income. For a salary only, federal taxable income is your salary less the enhanced part of your Québec Pension Plan (QPP), which you deduct. The QPP, Employment Insurance and Québec Parental Insurance Plan (QPIP) limits are on pay, so they are already salaries.',
    ),
    words(
      'From {qppStart} up to {qppYmpe}, federal taxable income is about {taxableFactor} of your salary plus {taxableConstant}. From {qppYmpe} to {yampe} the first tier has stopped and the second tier takes off {cpp2Cents} for every dollar, so it is about {taxableFactor2} of your salary plus {taxableConstant2}. From {yampe} up it is your salary less {taxableCut}. Québec taxable income is lower still. From {qppStart} to {workersMaxSalary} it is about {qcFactor0} of your salary plus {qcConstant0}, because the deduction for workers is still growing. From there up to {qppYmpe} it is about {qcFactor} of your salary less {qcConstant}. From {qppYmpe} to {yampe} it is about {qcFactor2} of your salary plus {qcConstant2}. From {yampe} up it is your salary less {qcCut}.',
    ),
    words(
      'So a threshold on a form sits a little higher in salary: about {shiftFedBracket2} higher at a federal taxable income of {fedBracket2Ti}, about {shiftQcBracket2} higher at a Québec taxable income of {qcBracket2Ti}, about {shiftDrug} higher at a Québec net income of {drugStartNi}, and {shiftQcBracket3} higher at {qcBracket3Ti}. This page gives the salary.',
    ),
  ],
  groups: [
    {
      heading: 'Up to $20,000',
      notes: [
        words(
          'At {eiStart} the Québec Parental Insurance Plan (QPIP) starts. You pay {qpipFirst} once, at {eiStart}, because no premium is payable below that amount. From {eiStart} to about {eiFullSalary} the rate is {eiBandRate} (Employment Insurance {hundredCents} plus QPIP {qpipCents}), because the Employment Insurance counted rises by {oneDollar} for every {oneDollar} of salary, until it reaches about {eiFullAmount}.',
          ['t2204', 'tp1'],
        ),
        words(
          'From about {eiFullSalary} to {qppStart}, Employment Insurance and QPIP take {eiQpipRate} of each extra dollar. At {qppStart} the QPP starts, and the rate steps up.',
          ['t2204', 'scheduleU'],
        ),
        words(
          'From {qppStart} to about {fedStartSalary} the rate is {qppEiQpipRate}: Québec Pension Plan (QPP) at {qppRate}, Employment Insurance at {eiRate} and QPIP at {qpipRate}, with no income tax yet.',
          ['scheduleU', 't2204', 'tp1'],
        ),
        words(
          'It is {fedFirstRate} from about {fedStartSalary}, when federal income tax starts. That is {qppEiQpipRate} for the payments plus about {fedPart} of federal tax. It is a total, not a tax rate. Of each extra dollar of taxable income, {fedLowestCents} is federal tax before credits, and the Québec abatement takes {abatementRate} of that off, leaving about {fedAfterAbatementCents}. The federal credits for your payments grow with your pay, and taxable income is a little less than salary, which brings it to about {fedPart} per dollar of salary. Federal tax begins above the federal basic amount of {fedBasicAmount}, because of the Canada employment amount and the credits for your QPP, Employment Insurance and QPIP payments.',
          ['t1'],
        ),
      ],
    },
    {
      heading: '$20,000 to $50,000',
      notes: [
        words(
          'From about {qcStartSalary} the rate is {qcStartRate}: Québec’s first tax rate, {qcBracket1}, on top of the federal tax and the payments. Québec tax starts when your Québec taxable income passes Québec’s basic personal amount of {qcBpa}. That is at a salary of about {qcStartSalary}, because Québec takes off the deduction for workers and the enhanced QPP.',
          ['tp1', 'workChart401'],
        ),
        words(
          'From about {drugStartSalary} the rate is {drugStartRate}: the drug insurance premium starts. It grows by {drugRate1} of each extra dollar of Québec net income, up to {drugStep} in all. Until {workersMaxSalary} that is about {drugCents1} of each extra dollar of salary.',
          ['scheduleK'],
        ),
        words(
          'From about {workersMaxSalary} the rate is {workersMaxRate}: the deduction for workers stops growing. It is {workersRate} of your work income, up to a most of {workersMax}. After that your Québec taxable income grows by almost the full dollar instead of {qcShareCents}, so Québec tax and the drug insurance premium take a little more of each extra dollar.',
          ['workChart201'],
        ),
        words(
          'From about {drugStep2Salary} the rate is {drugStep2Rate}: the premium grows faster, by {drugRate2} of each extra dollar of net income, about {drugCents2} of each extra dollar of salary.',
          ['scheduleK'],
        ),
        words(
          'At about {drugMaxSalary} the premium reaches its yearly most, {drugMax}, and the rate falls to {afterDrugRate}. The 2026 most comes from a source we could not check against a printed form; the 2025 form prints {drugMax2025}.',
          ['scheduleK'],
        ),
      ],
    },
    {
      heading: '$50,000 to $100,000',
      notes: [
        words(
          'From about {qcBracket2Salary} the rate is {qcBracket2Rate}: Québec’s second tax rate, {qcBracket2}, starts at a taxable income of {qcBracket2Ti}.',
          ['workChart401'],
        ),
        words(
          'From about {fedBracket2Salary} the rate is {fedBracket2Rate}: the federal rate rises to {fedBracket2} at a taxable income of {fedBracket2Ti} (about {fedBracket2Effective} after the Québec abatement).',
          ['t1'],
        ),
        words(
          'Employment Insurance stops at {eiStop}, at most {eiMax} a year, and the rate falls to {afterEiRate}.',
          ['t2204'],
        ),
        words(
          'The main QPP amount stops at {qppYmpe}. A second tier takes {qpp2Rate} of each dollar from there to {yampe}, so the rate falls to {afterQppRate}, and then to {afterQpp2Rate} at {yampe}, when that tier stops.',
          ['scheduleU'],
        ),
      ],
    },
    {
      heading: '$100,000 to $260,000',
      notes: [
        words(
          'QPIP stops at {qpipStop}, at most {qpipMax} a year, and the rate falls to {afterQpipRate}.',
          ['tp1'],
        ),
        words(
          'From about {qcBracket3Salary} the rate is {qcBracket3Rate}: Québec’s third tax rate, {qcBracket3}, starts at a taxable income of {qcBracket3Ti}.',
          ['workChart401'],
        ),
        words(
          'From about {fedBracket3Salary} the rate is {fedBracket3Rate}: the federal rate rises to {fedBracket3} at a taxable income of {fedBracket3Ti} (about {fedBracket3Effective} after the Québec abatement).',
          ['t1'],
        ),
        words(
          'From about {qcBracket4Salary} the rate is {qcBracket4Rate}: Québec’s top tax rate, {qcBracket4}, starts at a taxable income of {qcBracket4Ti}.',
          ['workChart401'],
        ),
        words(
          'From about {fedBracket4Salary} the rate is {fedBracket4Rate}: the federal rate rises to {fedBracket4} (about {fedBracket4Effective} after the Québec abatement). The federal basic personal amount also begins to shrink, which adds about {bpaTaperPoint} point to the rate.',
          ['t1'],
        ),
      ],
    },
    {
      heading: 'About $260,000 and above',
      notes: [
        words(
          'From about {topStartExact} the line is straight: the federal top rate, {fedTop}, starts (about {fedBracket5Effective} after the Québec abatement), and the federal basic personal amount has finished shrinking. Of every extra dollar, {topMarginal} goes to tax, and you keep {keepTop}. At {salary500k} the average rate is {avgAt500k}, and you keep {keepAt500k} of your salary.',
          ['t1'],
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
      head: [...bracketHead, 'Federal part after the abatement'],
      ...cells([
        [
          '{fed1Ti}',
          '{fed1}',
          'tax starts at about {fedStartSalary}',
          '{fed1After}',
          '{fed1Effective}',
        ],
        ...[2, 3, 4, 5].map((n) => [
          `{fed${n.toString()}Ti}`,
          `{fed${n.toString()}}`,
          `{fed${n.toString()}Sal}`,
          `{fed${n.toString()}After}`,
          `{fed${n.toString()}Effective}`,
        ]),
      ]),
      after: note(
        'The lowest federal rate is {fedLowest} for the whole of 2026 (2025: {fedLowestRatePrior}). The federal basic personal amount is {fedBpa}, shrinking to {fedBpaMin} between a net income of {fedBpaStart} and {fedBpaEnd}. The Canada employment amount is {cea}. The last column is the printed rate less the Québec abatement, which takes off {abatementRate} of your federal tax. In the chart the federal part is a little smaller again at low pay, because the credits for your payments grow with your pay.',
        { ...pool, ...tablePool },
      ),
    },
    {
      heading: 'Québec brackets, 2026 (Form TP-1, Work Chart 401)',
      caption: 'Québec brackets, 2026',
      head: bracketHead,
      ...cells([
        [
          '{qc1Ti}',
          '{qc1}',
          'tax starts at about {qcStartSalary}',
          '{qc1After}',
        ],
        ...[2, 3, 4].map((n) => [
          `{qc${n.toString()}Ti}`,
          `{qc${n.toString()}}`,
          `{qc${n.toString()}Sal}`,
          `{qc${n.toString()}After}`,
        ]),
      ]),
      after: note(
        'Québec’s basic personal amount is {qcBpa}, with a credit of {qcCreditRate}. The deduction for workers is {workersRate} of your work income, up to {workersMax}.',
        { ...pool, ...tablePool },
      ),
    },
    {
      heading: 'Drug insurance premium, 2026 (Schedule K)',
      before: words(
        'The premium is for Québec’s public prescription drug insurance plan. You pay it on your Québec return if you have no drug plan through work, and we assume you have none. It rises with your net income up to a yearly most.',
      ),
      caption: 'Drug insurance premium, 2026',
      head: ['Net income', 'Premium', 'Salary equivalent'],
      ...cells([
        ['up to {drugStartNi}', '{zeroDollars}', 'up to {drugStartSalary}'],
        [
          '{drugStartNi} to {drugStepNi}',
          '{drugRate1} of the part over {drugStartNi}, up to {drugStep}',
          '{drugStartSalary} to {drugStep2Salary}',
        ],
        [
          '{drugStepNi} to {drugMaxNi}',
          '{drugStep} plus {drugRate2} of the part over {drugStepNi}',
          '{drugStep2Salary} to {drugMaxSalary}',
        ],
        [
          'over {drugMaxNi}',
          'the yearly most, {drugMax}',
          'over {drugMaxSalary}',
        ],
      ]),
      after: note(
        'The yearly most for 2026 is a 2026 figure we could not check against a printed form, and the rates and the {drugStartNi} are the 2025 form’s. The Health Services Fund contribution (Schedule F) is {zeroDollars} for a salary, because employment income is taken off before it is worked out.',
        { ...pool, ...tablePool },
      ),
    },
    {
      heading:
        'Québec Pension Plan (QPP), Québec Parental Insurance Plan (QPIP) and Employment Insurance, 2026',
      caption:
        'Québec Pension Plan, Québec Parental Insurance Plan and Employment Insurance, 2026',
      head: ['Item', 'Figure'],
      ...cells([
        ['Employment Insurance rate (Québec)', '{eiRate}'],
        ['Most pay counted for Employment Insurance', '{eiMaxPay}'],
        ['Most Employment Insurance a year', '{eiPremiumMax}'],
        [
          'The {eiStart} rule',
          'Nothing is counted up to {eiStart}. Then {oneDollar} for every {oneDollar} of salary, until {eiFullAmount} at {eiFullSalary}.',
        ],
        [
          'QPIP rate',
          '{qpipRate} of all your pay, up to {qpipStop}. Nothing is due if your pay is under {eiStart}; at {eiStart} the premium is {qpipFirst} all at once',
        ],
        ['Most QPIP a year', '{qpipMax}'],
        ['QPP starts above', '{qppStart}'],
        [
          'QPP rate',
          '{qppRate}, made up of {qppBaseRate} base and {qppEnhancedRate} extra',
        ],
        ['Main amount stops at', '{qppYmpe}, at most {qppMax} a year'],
        ['Second tier rate', '{qpp2Rate} of pay from {qppYmpe} to {yampe}'],
        ['Second tier stops at', '{yampe}, at most {qpp2Max} a year'],
      ]),
    },
  ],
};
