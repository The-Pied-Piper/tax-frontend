/** One form a province page lists. */
export type HubForm = {
  /** The form's name as people know it. */
  name: string;
  /** One plain line on what the form is for. */
  line: string;
  /** Where the form's own page lives; the page links to it only once that page is listed. */
  slug: string;
};

/** The words of one province page: the forms that province's tax uses. */
export type ProvinceHub = {
  /** The province's slug, the same as in `build/salaryPages/provinces.ts`. */
  slug: string;
  /** The province's own forms. */
  forms: HubForm[];
};

/** The federal forms every province page lists after its own. */
export const federalForms: HubForm[] = [
  {
    name: 'T4 slip',
    line: 'The yearly slip your employer gives you. It shows your pay and what was taken off.',
    slug: 'forms/t4',
  },
  {
    name: 'T1 return, steps 2 to 4',
    line: 'Your yearly tax return. These steps add up your income and find the part of it that tax is charged on.',
    slug: 'forms/t1-steps-2-4',
  },
  {
    name: 'T1 return, steps 5 and 6',
    line: 'More of your yearly tax return. These steps work out your federal tax and what you end up owing or getting back.',
    slug: 'forms/t1-steps-5-6',
  },
  {
    name: 'Schedule 8: Canada Pension Plan',
    line: 'Works out how much you pay into the pension plan.',
    slug: 'forms/schedule-8',
  },
  {
    name: 'Form T2204: EI overpayment',
    line: 'Checks that you have not paid more EI than the yearly limit.',
    slug: 'forms/t2204',
  },
  {
    name: 'Schedule 6: Canada Workers Benefit',
    line: 'A payment for people whose pay from work is low.',
    slug: 'forms/schedule-6',
  },
];

/** One entry per province page. A province in `provinces.ts` with no entry here gets no page. */
export const provinceHubs: ProvinceHub[] = [
  {
    slug: 'ca-on',
    forms: [
      {
        name: 'Form ON428: Ontario Tax',
        line: 'Works out how much income tax you owe Ontario.',
        slug: 'forms/on428',
      },
      {
        name: 'Schedule ON428-A: LIFT credit',
        line: "Ontario's tax relief for people on lower pay.",
        slug: 'forms/on428-a',
      },
    ],
  },
  {
    slug: 'ca-ab',
    forms: [
      {
        name: 'Form AB428: Alberta Tax',
        line: 'Works out how much income tax you owe Alberta.',
        slug: 'forms/ab428',
      },
    ],
  },
  {
    slug: 'ca-bc',
    forms: [
      {
        name: 'Form BC428: British Columbia Tax',
        line: 'Works out how much income tax you owe British Columbia.',
        slug: 'forms/bc428',
      },
      {
        name: 'Form BC479: British Columbia credits',
        line: 'Adds the British Columbia credits that lower your tax.',
        slug: 'forms/bc479',
      },
    ],
  },
];
