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
    provinces: 'Provinces:',
    provinceNames: {
      'ca-on': 'Ontario',
      'ca-ab': 'Alberta',
      'ca-bc': 'British Columbia',
      'ca-mb': 'Manitoba',
      'ca-sk': 'Saskatchewan',
      'ca-nl': 'Newfoundland and Labrador',
      'ca-qc': 'Quebec',
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
      intro:
        "Pick a salary and see how the provinces compare. Every bar is the calculator's own estimate for a single person whose only income is a salary.",
      toggleLabel: 'Compare by',
      measures: {
        takeHome: 'Take-home pay',
        incomeTax: 'Income tax',
        averageRate: 'Average tax rate',
      },
      // Shorter wording for the toggle on narrow phones only, where the full label does not fit one line.
      measuresPhone: {
        takeHome: 'Take-home pay',
        incomeTax: 'Income tax',
        averageRate: 'Average tax rate',
      },
      measureNotes: {
        takeHome:
          'Your salary minus income tax, Canada Pension Plan payments and Employment Insurance. Tax cuts such as the Ontario LIFT Credit count.',
        incomeTax:
          'The federal and provincial income tax you owe for the year, after the credits that lower it.',
        averageRate:
          'Income tax, Canada Pension Plan payments and Employment Insurance, added together, divided by your salary.',
      },
      caption: (salary: string, year: number) =>
        `Bars are for a ${salary} salary in ${String(year)}, from highest to lowest.`,
      provisional: (year: number) =>
        `The ${String(year)} figures are provisional.`,
      salaryLabel: 'Salary a year',
      salaryValueText: (salary: string) => `${salary} a year`,
      hint: 'Drag the slider, or use the arrow keys, to pick a salary.',
      stepNote:
        'The slider moves in steps of $1,000 up to $250,000, and $5,000 above that.',
      typedLabel: 'Or type a salary',
      typedNote: 'A salary you type is shown at the nearest point we have.',
      salaryError: (lowest: string, highest: string) =>
        `Enter a salary from ${lowest} to ${highest}.`,
      chartLabel: (measure: string, salary: string) =>
        `Bar chart: ${measure} for a ${salary} salary, by province. The same figures are in the table below.`,
      tableToggle: 'Show the figures as a table',
      tableProvince: 'Province',
    },
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
    provisionalYear: 'provisional',
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
  notices: {
    provisionalTitle: (year: number) =>
      `${String(year)} figures are provisional.`,
    provisionalBody: (year: number) =>
      `The government has not finished publishing the ${String(year)} rates. We used the figures available today and will update them when they are final.`,
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
      groups: {
        pension: 'Quebec Pension Plan',
        ei: 'Employment Insurance',
        parentalInsurance: 'Quebec Parental Insurance Plan',
        incomeTax: 'Income tax',
        drugPremium: 'Drug insurance premium',
      },
      qpp: {
        name: 'Quebec Pension Plan',
        help: 'Your contribution to the Quebec Pension Plan, taken off your pay for a pension when you retire. It includes the extra part that builds on the base, up to the first yearly ceiling.',
      },
      qpp2: {
        name: 'Quebec Pension Plan, second additional contribution',
        help: (zero: string) =>
          `An extra Quebec Pension Plan contribution on earnings above the first yearly ceiling. It is ${zero} if your pay is below that ceiling.`,
      },
      zero: 'nothing',
      // Quebec words what is taken off itself: the card's help texts and the page's description and paragraph.
      wording: {
        answer: {
          takenOff:
            'Income tax, Quebec Pension Plan, Employment Insurance, Quebec Parental Insurance Plan premiums and the drug insurance premium added together.',
          averageRate:
            'Income tax, Quebec Pension Plan, Employment Insurance, Quebec Parental Insurance Plan premiums and the drug insurance premium, divided by your salary. It is the share of your salary that comes off.',
          marginalRate:
            'Of your next dollar of salary, the share that goes to income tax, Quebec Pension Plan, Employment Insurance, Quebec Parental Insurance Plan premiums and the drug insurance premium.',
        },
        pageText: {
          description: (
            salary: string,
            place: string,
            year: number,
            takeHome: string,
          ) =>
            `On a ${salary} salary in ${place} in ${String(year)}, you take home an estimated ${takeHome} a year after income tax, pension, parental insurance and Employment Insurance.`,
          paragraph: (
            salary: string,
            place: string,
            year: number,
            takeHome: string,
            takenOff: string,
            averageRate: string,
            marginalRate: string,
          ) =>
            `On a salary of ${salary} in ${place} in ${String(year)}, this estimate puts your take-home at ${takeHome} for the year. ${takenOff} is taken off for income tax, Quebec Pension Plan, Quebec Parental Insurance Plan premiums, Employment Insurance and the Quebec prescription drug insurance premium. Your average rate is ${averageRate}, and your marginal rate is ${marginalRate}: the share of your next dollar of salary that goes to income tax, Quebec Pension Plan, Employment Insurance, Quebec Parental Insurance Plan premiums and the drug insurance premium. It is an estimate for a single person, not tax advice.`,
        },
      },
      qpip: {
        name: 'Quebec Parental Insurance Plan',
        help: 'Your Quebec Parental Insurance Plan premium, taken off your pay to cover benefits when you have or adopt a child. It starts once your pay passes a set amount.',
      },
      ei: {
        name: 'Employment Insurance',
        help: 'Your Employment Insurance premium at the lower Quebec rate, taken off your pay to cover benefits if you lose your job.',
      },
      quebecTax: {
        name: 'Quebec income tax',
        help: 'Income tax owed to Quebec on your Quebec return, after the Quebec credits that apply to you.',
      },
      drugPremium: {
        name: 'Drug insurance premium',
        help: 'The yearly Quebec prescription drug insurance premium, paid on your Quebec return if you have no drug plan through work. We assume you have none.',
      },
      totalTax: {
        name: 'Total income tax',
        help: 'Federal and Quebec income tax added together.',
      },
      totalTakenOff: {
        name: 'Total taken off',
        help: 'Income tax, Quebec Pension Plan, Employment Insurance, Quebec Parental Insurance Plan premiums and the drug insurance premium added together. Your salary minus this is your estimated take-home pay.',
      },
    },
  },
};
