// All user-facing text lives here (English only for now).
export const languageCode = 'en';

export const strings = {
  title: 'Take-home pay estimate',
  intro:
    'Coming soon: enter a yearly salary and see an estimate of your take-home pay.',
  themeLabel: 'Theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  starLink: 'Star the engine on GitHub',
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
    salaryHint: 'For example 70000 or 70000.50',
    calculate: 'Calculate',
    calculating: 'Calculating…',
    loadingPlaces: 'Loading places…',
    placesFailed: 'Could not load the list of places. Please reload the page.',
    salaryEmpty: 'Enter your yearly salary.',
    salaryInvalid:
      'Enter the salary as a plain number with up to two decimals, like 70000 or 70000.50.',
    salaryZero: 'Enter a salary above zero.',
  },
  answer: {
    heading: 'Your estimate',
    takeHome: 'Estimated take-home pay',
    salary: 'Salary before tax',
    takenOff: 'Taken off (tax and contributions)',
    per: {
      weekly: 'per week',
      biweekly: 'every two weeks',
      monthly: 'per month',
      annually: 'per year',
    },
    estimateNote:
      'This is an estimate for a single yearly salary. Your own situation may differ.',
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
    toggle: 'Advanced view: every line',
    note: 'Every line the calculation produced, grouped by form. Always yearly amounts.',
    lineCount: (count: number) =>
      count === 1 ? '1 line' : `${String(count)} lines`,
    reference: 'Form reference',
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
      cpp: {
        name: 'Canada Pension Plan',
        help: 'Your contribution to the Canada Pension Plan (base and enhanced), taken off your pay for a pension when you retire.',
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
