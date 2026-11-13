// All user-facing text lives here (English only for now).
export const languageCode = 'en';

export const strings = {
  title: 'What will I take home?',
  intro:
    'Estimate your yearly take-home from a salary before tax. We work out the pension, EI and income tax for a single person and show every step.',
  footer:
    'This is an estimate, not tax advice. Your actual take-home depends on your own situation and what your employer withholds. Nothing you enter is saved.',
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
    takenOff: 'Taken off (tax and contributions)',
    averageRate: {
      name: 'Average income tax rate',
      help: 'Your income tax divided by your salary. It is the share of your salary that goes to income tax, federal and provincial together.',
    },
    marginalRate: {
      name: 'Marginal income tax rate',
      help: 'The federal and provincial income tax, including any surtax and health premium, on your next dollar of salary. Canada Pension Plan and Employment Insurance are not included.',
    },
    estimateNote:
      'This is an estimate for a single yearly salary. Your own situation may differ.',
  },
  // Per-page wording for the pre-built salary pages and the live page heading.
  // Place and year come from the API's list and the request, never from code.
  pageText: {
    title: (salary: string, place: string, year: number) =>
      `${salary} after tax in ${place} (${String(year)})`,
    description: (
      salary: string,
      place: string,
      year: number,
      takeHome: string,
    ) =>
      `Estimate: on ${salary} in ${place} for ${String(year)}, your yearly take-home is ${takeHome} after income tax, CPP and EI.`,
    heading: (salary: string, place: string, year: number) =>
      `Take-home pay on ${salary} in ${place}, ${String(year)}`,
    paragraph: (
      salary: string,
      place: string,
      year: number,
      takeHome: string,
      takenOff: string,
      averageRate: string,
      marginalRate: string,
    ) =>
      `On a salary of ${salary} in ${place} in ${String(year)}, this estimate puts your take-home at ${takeHome} for the year. ${takenOff} is taken off for income tax, Canada Pension Plan and Employment Insurance. Your average income tax rate is ${averageRate}, and your marginal income tax rate is ${marginalRate}: the rate on your next dollar of salary. It is an estimate for a single person, not tax advice.`,
  },
  // Navigation between the pre-built salary pages; amounts come from displayMoney.
  salaryLinks: {
    label: 'More salaries',
    previous: (amount: string) => `Previous: ${amount}`,
    next: (amount: string) => `Next: ${amount}`,
    calculator: 'Back to the calculator',
    others: 'Other salaries',
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
    heading: 'Advanced view',
    toggle: 'Advanced view: every line from the tax forms',
    note: 'Advanced view shows yearly amounts, as printed on the forms.',
    lineCount: (count: number) =>
      count === 1 ? '1 line' : `${String(count)} lines`,
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
    caOn: {
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
        help: 'An extra Canada Pension Plan contribution on earnings above the first yearly ceiling. It is $0.00 if your pay is below that ceiling.',
      },
      ei: {
        name: 'Employment Insurance',
        help: 'Your Employment Insurance premium, taken off your pay to cover benefits if you lose your job.',
      },
      federalTax: {
        name: 'Federal income tax',
        help: 'Income tax owed to the federal government after the federal credits that apply to you.',
      },
      ontarioTax: {
        name: 'Ontario income tax',
        help: 'Income tax owed to Ontario, including the Ontario Health Premium, after the Ontario credits that apply to you.',
      },
      totalTax: {
        name: 'Total income tax',
        help: 'Federal and Ontario income tax added together.',
      },
      totalTakenOff: {
        name: 'Total taken off',
        help: 'Income tax, Canada Pension Plan and Employment Insurance added together. Your salary minus this is your estimated take-home pay.',
      },
    },
  },
};
