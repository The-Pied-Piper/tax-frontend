// All user-facing text lives here (English only for now).
export const languageCode = 'en';

export const strings = {
  title: 'What will I take home?',
  intro:
    'Estimate your yearly take-home from a salary before tax. We work out the pension, Employment Insurance (EI) and income tax for a single person and show every step.',
  footer:
    'This is an estimate, not tax advice. Your actual take-home depends on your own situation and what your employer withholds. Nothing you enter is saved.',
  siteNav: {
    label: 'Site',
    breadcrumb: 'Breadcrumb',
    home: 'Home',
    methodology: 'How we calculate',
    compare: 'Compare provinces',
    provinces: 'Provinces:',
    provinceNames: {
      'ca-on': 'Ontario',
      'ca-ab': 'Alberta',
      'ca-bc': 'British Columbia',
      'ca-mb': 'Manitoba',
      'ca-sk': 'Saskatchewan',
      'ca-nl': 'Newfoundland and Labrador',
      'ca-nb': 'New Brunswick',
      'ca-ns': 'Nova Scotia',
      'ca-pe': 'Prince Edward Island',
      'ca-qc': 'Québec',
    },
  },
  hubCharts: {
    perYear: 'Per year',
    perMonth: 'Per month',
    // The label beside the marker, as the approved mockup draws it: "$70,000: 23.2%".
    hover: (salary: string, value: string) => `${salary}: ${value}`,
    // Read aloud when the marker moves; not shown.
    readout: (salary: string) => `Salary ${salary} a year`,
    salaryAxis: 'Salary before tax',
    percent: 'Percent',
    dollarsYear: 'Dollars a year',
    dollarsMonth: 'Dollars a month',
    chartLabel: (title: string, from: string, to: string) =>
      `Line chart: ${title} against salary, from ${from} to ${to}.`,
    note: 'These are estimates for a single person whose only income is a salary.',
    // Added to the marginal rate's line on a hub whose province has a tax reduction that shrinks to zero (not Alberta or Saskatchewan).
    marginalReduction:
      'In some provinces it also rises across a band of lower salaries, while a tax reduction shrinks to zero.',
    // One entry per chart: its title (the section heading, or for take-home a sub-heading in the existing section) and its one line.
    charts: {
      takeHome: {
        title: 'Take-home pay',
        text: 'Your salary minus income tax, Canada Pension Plan and Employment Insurance. It is before any credits paid to you when you file.',
      },
      averageRate: {
        title: 'Average tax rate',
        // {place} is the province's name.
        text: 'The share of your salary that goes to income tax, Canada Pension Plan and Employment Insurance together. Federal and {place} income tax both count.',
      },
      marginalRate: {
        title: 'Marginal tax rate',
        text: 'Out of your next dollar of salary, the share that goes to income tax, Canada Pension Plan and Employment Insurance. The rate steps up where a new tax bracket starts.',
      },
    },
    // The province comparison on a hub; amounts come from money/format.
    comparison: {
      heading: 'Compare provinces at one salary',
      toggleLabel: 'Compare by',
      measures: {
        takeHome: 'Take-home pay',
        takenOff: 'Tax and contributions',
        averageRate: 'Average tax rate',
      },
      // Shorter wording for the toggle on narrow phones only, where the full label does not fit one line.
      measuresPhone: {
        takeHome: 'Take-home pay',
        takenOff: 'Tax and payments',
        averageRate: 'Average tax rate',
      },
      measureNotes: {
        takeHome:
          'Your salary minus income tax, pension plan payments and Employment Insurance. Pension plan payments are Canada Pension Plan payments, or Québec Pension Plan payments in Québec, where Québec Parental Insurance Plan premiums and the drug insurance premium are taken off too. Tax cuts count, such as the Ontario LIFT Credit and the Québec abatement.',
        takenOff:
          'Income tax, pension plan payments and Employment Insurance added together, which is your salary minus your take-home pay. In Québec the pension plan is the Québec Pension Plan, and Québec Parental Insurance Plan premiums are added too. Income tax includes the Ontario Health Premium in Ontario. In Québec it includes the prescription drug insurance premium, which we assume you pay because you have no drug plan at work, and the federal tax is after the Québec abatement.',
        averageRate: 'Tax and contributions divided by your salary.',
      },
      // The line after the measure notes, linked to the methodology page.
      creditsNote: 'Credits paid to you when you file are not counted.',
      caption: (salary: string, year: number) =>
        `Bars are for a ${salary} salary in ${String(year)}, lowest tax and contributions first. Provinces with the same amount are listed in the usual order.`,
      // In place of the caption when no province takes any tax or contributions at the chosen salary.
      tied: 'At this salary no province takes any tax or contributions, so the provinces are not ranked.',
      // Spoken when the slider is let go, or after an arrow-key press or a typed salary.
      reordered: (salary: string) =>
        `Provinces re-ordered by tax and contributions, lowest first, for a ${salary} salary.`,
      reorderedTied: (salary: string) =>
        `No province takes any tax or contributions at ${salary}, so the provinces are not ranked.`,
      // The accessible name of a bar's link: to the province's page for the salary shown, or to its hub when there is no such page.
      barLinkSalaryPage: (
        place: string,
        measure: string,
        value: string,
        salary: string,
      ) =>
        `${place}: ${measure} ${value} for a ${salary} salary. Open the ${place} page for this salary.`,
      barLinkHub: (
        place: string,
        measure: string,
        value: string,
        salary: string,
      ) =>
        `${place}: ${measure} ${value} for a ${salary} salary. Open the ${place} hub page.`,
      salaryLabel: 'Salary a year',
      salaryValueText: (salary: string) => `${salary} a year`,
      hint: 'Drag the slider, or use the arrow keys, to pick a salary. The bars and the order of the list change as you drag.',
      stepNote:
        'The slider moves in steps of $1,000 up to $250,000, and $5,000 above that.',
      typedLabel: 'Or type a salary',
      typedNote: 'A salary you type is shown at the nearest point we have.',
      salaryError: (lowest: string, highest: string) =>
        `Enter a salary from ${lowest} to ${highest}.`,
      chartLabel: (measure: string, salary: string, tableToggle: string) =>
        `Bar chart: ${measure} for a ${salary} salary, by province. These figures, and every other salary, are in the table under “${tableToggle}”.`,
      tableToggle: 'Show the figures as a table',
      tableProvince: 'Province',
      // The one table under the toggle: every salary the chart can show, three figures for each province.
      table: {
        note: 'The table shows take-home pay, tax and contributions, and average tax rate in each province at every salary the chart can show, for a single person whose only income is a salary. Take-home pay is salary minus income tax, pension plan payments and Employment Insurance, and in Québec Québec Parental Insurance Plan premiums. Income tax includes the Ontario Health Premium in Ontario. In Québec it includes the prescription drug insurance premium, and the federal tax is after the Québec abatement. Tax and contributions is income tax, pension plan payments and Employment Insurance, and in Québec Québec Parental Insurance Plan premiums, added together. It is your salary minus your take-home pay. The average tax rate is that amount divided by your salary.',
        caption: (year: number, count: number) =>
          `Take-home pay, tax and contributions, and average tax rate by salary and province, ${year.toString()}: all ${count.toString()} salaries behind the chart.`,
        salaryHeader: 'Salary a year',
        takeHomeHeader: 'Take-home pay',
        takenOffHeader: 'Tax and contributions',
        averageRateHeader: 'Average tax rate',
        // Shown on narrow screens only.
        scrollHint:
          'This table is wide. Scroll sideways to see every province.',
        scrollLabel:
          'Table of take-home pay, tax and contributions, and average tax rate by salary and province. Scroll sideways to see every province.',
      },
    },
  },
  // The page that compares every province: /compare-provinces/ (copy thread, compare-provinces-copy-final.md).
  comparePage: {
    heading: (year: number) =>
      `Compare take-home pay and tax across provinces, ${year.toString()}`,
    title: (year: number) =>
      `Compare take-home pay and tax across provinces, ${year.toString()}`,
    description: (year: number) =>
      `Compare take-home pay, tax and contributions across provinces at a salary you choose. Estimates for ${year.toString()}, for a single person whose only income is a salary.`,
    breadcrumb: 'Compare provinces',
    sectionHeading: 'Compare by salary',
    intro: `Pick a salary and see how the provinces compare. The provinces are always listed with the lowest tax and contributions first, whichever of the three figures you compare. Every bar is this site's own estimate for a single person whose only income is a salary.`,
    linksLead: 'See a province in detail:',
    linksHeading: 'Provinces',
  },
  ratesPage: {
    // What a cause form is called on a "Caused by" chip.
    causes: {
      t1: 'Form T1',
      on428: 'Form ON428',
      on428a: 'Schedule ON428-A',
      ab428: 'Form AB428',
      sk428: 'Form SK428',
      bc428: 'Form BC428',
      mb428: 'Form MB428',
      mb428a: 'Schedule MB428-A',
      nl428: 'Form NL428',
      nb428: 'Form NB428',
      t2204: 'Form T2204',
      schedule8: 'Schedule 8',
      tp1: 'Form TP-1',
      scheduleU: 'Schedule U',
      scheduleK: 'Schedule K',
      workChart201: 'Work Chart 201',
      workChart401: 'Work Chart 401',
    },
    chartHeading: 'Your tax rates at every salary',
    countedHeading: 'What is counted',
    jumpLabel: 'Jump to:',
    othersHeading: 'Tax rates by salary in other provinces',
    otherLink: (province: string) => `${province} tax rates by salary`,
    // The phrase in the basis paragraph that links to the Methodology page.
    creditsPhrase: 'credits paid to you when you file',
    marginal: 'Marginal rate',
    average: 'Average rate',
    salaryAxis: 'Salary before tax',
    percent: 'Percent',
    hint: 'Hover or tap the chart to read a salary.',
    readout: (salary: string, marginal: string, average: string) =>
      `At ${salary}: marginal rate ${marginal}, average rate ${average}`,
    linkToSalary: 'Link to this salary',
    sliderLabel: 'Show salaries up to',
    sliderValueText: (salary: string) => `Salaries up to ${salary}`,
    // The words near the top of the plot where the Employment Insurance band leaves it: its rate and the salaries it runs from and to.
    topNote: (rate: string, from: string, to: string) =>
      `Off the top: ${rate} from ${from} to ${to}`,
    chartLabel: (from: string, to: string) =>
      `Line chart: marginal rate and average rate against salary, from ${from} to ${to}. The same figures are in the table below the chart.`,
    tableShow: 'Show the figures as a table',
    tableHide: 'Hide the table',
    tableCaption: (place: string, year: number, count: number) =>
      `Rates by salary, ${place}, ${year.toString()}: all ${count.toString()} figures behind the chart`,
    salaryHeader: 'Salary',
    marginalHeader: 'Marginal rate',
    averageHeader: 'Average rate',
    causedBy: 'Caused by:',
    howToRead: 'How to read these salaries',
    notesHeading: 'What moves the rate, by salary',
    bracketsHeading: 'Brackets by salary',
  },
  fold: {
    more: 'See more',
    less: 'See less',
  },
  formPage: {
    contents: 'On this page',
    permalink: (heading: string) => `Link to ${heading}`,
    notice: (year: number, salary: string) =>
      `Our calculator follows the published form. It is made for a single person whose only income is a salary. This page covers only the lines it uses, with figures from the ${year.toString()} form. Examples use a ${salary} salary. This is an estimate, not tax advice.`,
    example: (salary: string) => `At ${salary}`,
    related: 'Related',
    hub: (place: string, withSalaries = true) =>
      withSalaries ? `${place} forms and salary pages` : `${place} forms`,
    salaryExample: (salary: string) => `See a ${salary} example`,
    // Federal pages show the Ontario example; Ontario is the province the figures use.
    federalSalaryExample: (salary: string) =>
      `See an Ontario ${salary} example`,
  },
  summaryHeading: 'About this estimate',
  themeLabel: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  starLink: 'Star the engine on GitHub',
  starNote:
    'The calculations are open source. A star helps other people find it.',
  // Shown only when the API response carries no unit.
  fallbackUnit: {
    name: 'fallback',
    placement: 'before',
    singular: '$',
    plural: '$',
    spaced: false,
    as_percentage: false,
  } as const,
  payPeriod: {
    legend: 'Show amounts',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    annually: 'Annually',
  },
  form: {
    place: 'Where do you work?',
    year: 'Tax year',
    salary: 'Yearly salary (before tax)',
    salaryHint: (whole: string, cents: string) =>
      `For example ${whole} or ${cents}`,
    calculate: 'Calculate',
    calculating: 'Calculating…',
    comingSoon: 'Coming Soon',
    loadingPlaces: 'Loading places…',
    placesFailed: 'Could not load the list of places. Please reload the page.',
    salaryEmpty: 'Enter your yearly salary.',
    salaryInvalid:
      'Enter the salary as a plain number with up to two decimals, like 70000 or 70000.50.',
    salaryZero: 'Enter a salary above zero.',
  },
  answer: {
    heading: 'Your estimate',
    label: {
      weekly: 'Estimated take-home each week',
      biweekly: 'Estimated take-home every two weeks',
      monthly: 'Estimated take-home each month',
      annually: 'Estimated take-home each year',
    },
    outOf: (salary: string, place: string, year: number) =>
      `out of ${salary}, ${place}, ${String(year)}`,
    salary: 'Salary before tax',
    takeHomeRow: 'Take-home',
    takenOff: {
      name: 'Taken off (tax and contributions)',
      help: 'Income tax, Canada Pension Plan and Employment Insurance added together.',
    },
    averageRate: {
      name: 'Average rate',
      help: 'Income tax, Canada Pension Plan and Employment Insurance, divided by your salary. It is the share of your salary that comes off.',
    },
    marginalRate: {
      name: 'Marginal rate',
      help: 'Of your next dollar of salary, the share that goes to income tax, Canada Pension Plan and Employment Insurance, counting any surtax or health premium.',
    },
    estimateNote:
      'This is an estimate for a single yearly salary. Your own situation may differ.',
  },
  // Per-page wording for the pre-built salary pages and the live page heading.
  // Place and year come from the API's list and the request, never from code.
  pageText: {
    title: (salary: string, place: string, year: number) =>
      `${salary} After Tax in ${place} (${String(year)} Take-Home Pay)`,
    // Used only when the title above would reach the length limit (a long place name).
    shortTitle: (salary: string, place: string, year: number) =>
      `${salary} After Tax in ${place} (${String(year)})`,
    description: (
      salary: string,
      place: string,
      year: number,
      takeHome: string,
    ) =>
      `On a ${salary} salary in ${place} in ${String(year)}, you take home an estimated ${takeHome} a year after income tax, pension and Employment Insurance.`,
    heading: (salary: string, place: string, year: number) =>
      `${salary} After Tax in ${place} (${String(year)} Take-Home Pay)`,
    paragraph: (
      salary: string,
      place: string,
      year: number,
      takeHome: string,
      takenOff: string,
      averageRate: string,
      marginalRate: string,
    ) =>
      `On a salary of ${salary} in ${place} in ${String(year)}, this estimate puts your take-home at ${takeHome} for the year. ${takenOff} is taken off for income tax, Canada Pension Plan and Employment Insurance. Your average rate is ${averageRate}, and your marginal rate is ${marginalRate}: the share of your next dollar of salary that goes to income tax, Canada Pension Plan and Employment Insurance. It is an estimate for a single person, not tax advice.`,
  },
  // Navigation between the pre-built salary pages; amounts come from displayMoney.
  salaryLinks: {
    label: 'More salaries',
    previous: (salary: string, takeHome: string) =>
      `Previous: ${salary} salary, ${takeHome} take-home a year`,
    next: (salary: string, takeHome: string) =>
      `Next: ${salary} salary, ${takeHome} take-home a year`,
    other: (salary: string, takeHome: string) =>
      `${salary} salary, ${takeHome} take-home a year`,
    calculator: 'Back to the calculator',
    others: 'Other salaries',
  },
  learnMore: {
    label: 'Learn more about this estimate',
    form: (name: string) => `What is ${name}?`,
  },
  // The links to a province's rates page, worded by the copy thread (rates-page final copy, "Link lines").
  ratesLink: {
    // A hub's one line: the link, then the rest of the sentence.
    hubLink: (place: string) =>
      `Marginal and average tax rate by salary in ${place}`,
    hubRest:
      ': how much of each extra dollar goes to tax, and what causes every step, from $0 to $500,000.',
    // A salary page's one line: the words, then the link.
    salaryLead: 'See how the rate changes with salary:',
    salaryLink: (place: string) => `${place} tax rates by salary`,
    salaryRest: '.',
  },
  // The hub's one line that points at the compare page (copy thread).
  compareLink: {
    lead: 'Compare take-home pay, tax and contributions, and the average tax rate across the provinces we cover: ',
    rest: '.',
    // A salary page's one line: the words with the page's own salary, then the link to the compare page (its heading, with the year), then a full stop.
    salaryLead: (salary: string) =>
      `See how a ${salary} salary compares across the provinces:`,
    salaryRest: '.',
  },
  breakdown: {
    toggle: 'Show how this was worked out',
    helpButton: (name: string) => `What is ${name}?`,
  },
  advanced: {
    toggle: 'Advanced view: every line from the tax forms',
    note: 'Advanced view shows yearly amounts, as printed on the forms.',
    lineCount: (count: number) =>
      count === 1 ? '1 line' : `${String(count)} lines`,
    formLink: 'What is this form?',
    reference: 'Form reference',
    noDetail: 'The service gave no further detail for this line.',
    lineNumber: (reference: string) => `Line ${reference}`,
    noAmount: '—',
    noAmountSpoken: 'No amount',
  },
  errors: {
    salaryRejected:
      'The service did not accept this salary. Enter it as a plain number, like 70000 or 70000.50.',
    rejected:
      'The service could not calculate an estimate for these details. Please check them and try again.',
    tooManyRequests:
      'Too many requests right now. Please wait a moment and try again.',
    serverProblem:
      'The service had a problem and could not calculate your estimate. Please try again in a moment.',
    unreachable:
      'Could not reach the service. Please check your connection and try again.',
    timeout: 'The service took too long to answer. Please try again.',
    unknown: 'Something went wrong. Please try again.',
  },
  adapters: {
    caFederal: {
      groups: {
        pension: 'Pension',
        ei: 'Employment Insurance',
        incomeTax: 'Income tax',
      },
      cpp: {
        name: 'Canada Pension Plan',
        help: 'Your contribution to the Canada Pension Plan (the regular contribution, plus the extra enhanced part up to the first yearly ceiling), taken off your pay for a pension when you retire.',
      },
      cpp2: {
        name: 'Canada Pension Plan, second additional contribution',
        help: (zero: string) =>
          `An extra Canada Pension Plan contribution on earnings above the first yearly ceiling. It is ${zero} if your pay is below that ceiling.`,
      },
      ei: {
        name: 'Employment Insurance',
        help: 'Your Employment Insurance premium, taken off your pay to cover benefits if you lose your job.',
      },
      eiRefundedNote: (salary: string) =>
        `On a salary of ${salary} the premium is refunded when you file, so none is counted in this estimate. A pay slip would still show it withheld during the year, and it comes back at tax time.`,
      federalTax: {
        name: 'Federal income tax',
        help: 'Income tax owed to the federal government after the federal credits that apply to you.',
      },
      totalTakenOff: {
        name: 'Total taken off',
        help: 'Income tax, Canada Pension Plan and Employment Insurance added together. Your salary minus this is your estimated take-home pay.',
      },
    },
    caOn: {
      cpp2Zero: '$0.00',
      ontarioTax: {
        name: 'Ontario income tax',
        help: 'Income tax owed to Ontario, including the Ontario Health Premium, after the Ontario credits that apply to you.',
      },
      totalTax: {
        name: 'Total income tax',
        help: 'Federal and Ontario income tax added together.',
      },
    },
    caAb: {
      cpp2Zero: 'nothing',
      albertaTax: {
        name: 'Alberta income tax',
        help: 'Income tax owed to Alberta after the Alberta credits that apply to you.',
      },
      totalTax: {
        name: 'Total income tax',
        help: 'Federal and Alberta income tax added together.',
      },
    },
    caBc: {
      cpp2Zero: 'nothing',
      britishColumbiaTax: {
        name: 'British Columbia income tax',
        help: 'Income tax owed to British Columbia after the British Columbia credits that apply to you.',
      },
      totalTax: {
        name: 'Total income tax',
        help: 'Federal and British Columbia income tax added together.',
      },
    },
    caSk: {
      cpp2Zero: 'nothing',
      saskatchewanTax: {
        name: 'Saskatchewan income tax',
        help: 'Income tax owed to Saskatchewan after the Saskatchewan credits that apply to you.',
      },
      totalTax: {
        name: 'Total income tax',
        help: 'Federal and Saskatchewan income tax added together.',
      },
    },
    caMb: {
      cpp2Zero: 'nothing',
      manitobaTax: {
        name: 'Manitoba income tax',
        help: 'Income tax owed to Manitoba after the Manitoba credits that apply to you.',
      },
      totalTax: {
        name: 'Total income tax',
        help: 'Federal and Manitoba income tax added together.',
      },
    },
    caQc: {
      // The engine's Schedule 8 is the Canada Pension Plan form; for a Québec filer it is the QPP form, so its title is ours.
      schedule8Title: 'Schedule 8: Québec Pension Plan Contributions',
      // Engine text rewritten for Québec. The order matters: the exemption label goes before the plan's name.
      rewrite: {
        province: { from: 'Quebec', to: 'Québec' },
        exemption: {
          from: 'Canada Pension Plan exemption',
          to: 'basic exemption',
        },
        plan: { from: 'Canada Pension Plan', to: 'Québec Pension Plan' },
        planAcronym: { from: 'CPP', to: 'QPP' },
      },
      groups: {
        pension: 'Québec Pension Plan',
        ei: 'Employment Insurance',
        parentalInsurance: 'Québec Parental Insurance Plan',
        incomeTax: 'Income tax',
        drugPremium: 'Prescription drug insurance premium',
      },
      qpp: {
        name: 'Québec Pension Plan',
        help: 'Your contribution to the Québec Pension Plan, taken off your pay to build your pension. It has a base part and an extra, or enhanced, part. Both are charged on pay above a small starting amount, up to the first yearly limit.',
      },
      qpp2: {
        name: 'Québec Pension Plan, second additional contribution',
        help: (zero: string) =>
          `An extra Québec Pension Plan contribution on pay between the first yearly limit and a higher second limit. It is ${zero} if your pay is below the first limit.`,
      },
      zero: 'nothing',
      // Quebec words what is taken off itself: the card's help texts and the page's description and paragraph.
      wording: {
        answer: {
          takenOff:
            'Income tax after the Québec abatement, Québec Pension Plan, Employment Insurance, Québec Parental Insurance Plan premiums and the drug insurance premium added together.',
          averageRate:
            'Income tax, Québec Pension Plan, Employment Insurance, parental insurance and drug insurance premiums, divided by your salary.',
          marginalRate:
            'Of your next dollar, the share that goes to income tax, Québec Pension Plan, Employment Insurance, parental insurance and drug insurance premiums.',
        },
        pageText: {
          description: (
            salary: string,
            place: string,
            year: number,
            takeHome: string,
          ) =>
            `On a ${salary} salary in ${place} in ${String(year)}, you take home an estimated ${takeHome} a year after income tax, pension, parental insurance, EI and the drug premium.`,
          paragraph: (
            salary: string,
            place: string,
            year: number,
            takeHome: string,
            takenOff: string,
            averageRate: string,
            marginalRate: string,
          ) =>
            `On a salary of ${salary} in ${place} in ${String(year)}, this estimate puts your take-home at ${takeHome} for the year. ${takenOff} is taken off for income tax, Québec Pension Plan, Québec Parental Insurance Plan premiums, Employment Insurance and the premium for Québec’s prescription drug insurance plan. Your average rate is ${averageRate}, and your marginal rate is ${marginalRate}: the share of your next dollar of salary that goes to income tax, Québec Pension Plan, Employment Insurance, Québec Parental Insurance Plan premiums and the drug insurance premium. It is an estimate for a single person, not tax advice.`,
        },
      },
      qpip: {
        name: 'Québec Parental Insurance Plan',
        help: 'Your Québec Parental Insurance Plan premium, taken off your pay to cover benefits when you have or adopt a child. You pay none if your pay for the year is below a set amount. Above it, the premium is charged on all your pay, up to a yearly limit.',
      },
      ei: {
        name: 'Employment Insurance',
        help: 'Your Employment Insurance premium at the lower Québec rate, taken off your pay to cover benefits if you lose your job. None is counted if your pay is below a set amount.',
      },
      federalTax: {
        name: 'Federal income tax after the Québec abatement',
        help: 'Federal income tax after the federal credits that apply to you, less the Québec abatement, a credit worked out as a share of that tax, for people who live in Québec.',
      },
      quebecTax: {
        name: 'Québec income tax',
        help: 'Income tax owed to Québec on your Québec return, after the Québec credits that apply to you.',
      },
      drugPremium: {
        name: 'Prescription drug insurance premium',
        help: 'The yearly premium for Québec’s public prescription drug insurance plan, paid on your Québec return if you are not in a group drug plan, usually one through work. It rises with your income up to a yearly maximum. We assume you are not in a group plan.',
      },
      totalTax: {
        name: 'Total income tax',
        help: 'Federal income tax after the abatement and Québec income tax added together.',
      },
      totalTakenOff: {
        name: 'Total taken off',
        help: 'Income tax after the Québec abatement, Québec Pension Plan, Employment Insurance, Québec Parental Insurance Plan premiums and the drug insurance premium added together. Your salary minus this is your estimated take-home pay.',
      },
    },
  },
};
