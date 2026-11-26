import {
  paragraph,
  type ContentBlock,
  type ContentLink,
  type ContentPageSpec,
  type ContentSection,
  type ListItem,
} from './contentPages';
import type { HubChartId } from './hubCharts';
import {
  COMPARE_SLUG,
  contentPath,
  formSlug,
  HOME_PATH,
  METHODOLOGY_SLUG,
  ratesSlug,
  type FooterProvinceSlug,
} from './siteLinks';
import { strings } from '../strings';

/** A form a hub lists. Its page, once there is one, is at `formSlug(id)`. */
export type HubForm = { id: string; name: string; description: string };

/** The forms one province's hub lists: the province's own, then the federal ones. */
export type ProvinceHubText = {
  slug: FooterProvinceSlug;
  /** The forms of the province itself. */
  own: HubForm[];
  /** True when a tax reduction in the province shrinks to zero as salary rises, which bends the marginal rate. Alberta and Saskatchewan have none. */
  taxReduction: boolean;
  /**
   * Province wording that replaces the shared wording (Quebec has its own pension plan, parental insurance and drug premium),
   * written from the province's name, which always comes from `strings.siteNav.provinceNames`. When it is set it wins: the
   * chart lines are written out whole, so `taxReduction` does not add its sentence to them.
   */
  words?: (name: string) => ProvinceWords;
};

/** The ids of the federal forms every hub lists. */
type FederalFormId = 't4' | 't1' | 'schedule-8' | 't2204' | 'schedule-6';

/** The shared hub wording a province may replace. */
export type ProvinceWords = {
  /** The paragraph that explains how the take-home is worked out. */
  takeHome: string;
  /** The one line under each chart. */
  charts: Record<HubChartId, string>;
  /** Replacements for the shared federal form entries, by form id. */
  federal: Partial<Record<FederalFormId, Partial<HubForm>>>;
};

/** The federal forms every hub lists, in the order shown. */
const federalForms: (HubForm & { id: FederalFormId })[] = [
  {
    id: 't4',
    name: 'T4 slip',
    description:
      'The yearly slip your employer gives you. It shows your pay and what was taken off.',
  },
  {
    id: 't1',
    name: 'T1 return',
    description:
      'Finds your taxable income, works out your federal tax and what you end up owing or getting back.',
  },
  {
    id: 'schedule-8',
    name: 'Schedule 8: Canada Pension Plan',
    description: 'Works out how much you pay into the pension plan.',
  },
  {
    id: 't2204',
    name: 'Form T2204: EI overpayment',
    description: 'Checks that you have not paid more EI than the yearly limit.',
  },
  {
    id: 'schedule-6',
    name: 'Schedule 6: Canada Workers Benefit',
    description: 'A payment for people whose pay from work is low.',
  },
];

/** The permalinks of the hub's chart sections. */
const CHART_SECTION_IDS = {
  takeHome: 'take-home',
  averageRate: 'average-rate',
  marginalRate: 'marginal-rate',
} as const;

/** A chart's section: its heading, its one line and the chart. The province's own text (#288) goes after the chart block. */
function chartSection(
  chart: Exclude<HubChartId, 'takeHome'>,
  text: ProvinceHubText,
  name: string,
): ContentSection {
  const words = strings.hubCharts.charts[chart];
  const province = text.slug;
  const own = text.words?.(name);
  const oneLine = own
    ? own.charts[chart]
    : chart === 'marginalRate' && text.taxReduction
      ? `${words.text} ${strings.hubCharts.marginalReduction}`
      : words.text.replace('{place}', name);
  return {
    heading: words.title,
    id: CHART_SECTION_IDS[chart],
    card: true,
    blocks: [
      paragraph(oneLine),
      { kind: 'salaryChart', province, chart },
      { kind: 'chartNotes', province, chart },
    ],
  };
}

/** The section that replaces the two rate charts on a hub whose province has a rates page: one line and a link. */
function ratesLinkSection(
  province: FooterProvinceSlug,
  name: string,
): ContentSection {
  return {
    heading: strings.ratesPage.chartHeading,
    id: 'tax-rates',
    card: true,
    blocks: [
      paragraph(
        {
          label: strings.ratesLink.hubLink(name),
          href: contentPath(ratesSlug(province)),
        },
        strings.ratesLink.hubRest,
      ),
    ],
  };
}

/** The section that points a hub at the compare page: one line and a link, worded with the year of the sweeps. */
function compareLinkSection(year: number): ContentSection {
  return {
    heading: strings.hubCharts.comparison.heading,
    id: 'compare-provinces',
    card: true,
    blocks: [
      paragraph(
        strings.compareLink.lead,
        {
          label: strings.comparePage.heading(year),
          href: contentPath(COMPARE_SLUG),
        },
        strings.compareLink.rest,
      ),
    ],
  };
}

/** The hub text of each province the footer lists. Adding a province is one entry here. */
export const provinceHubs: ProvinceHubText[] = [
  {
    slug: 'ca-on',
    taxReduction: true,
    own: [
      {
        id: 'on428',
        name: 'Form ON428: Ontario Tax',
        description: 'Works out how much income tax you owe Ontario.',
      },
      {
        id: 'on428-a',
        name: 'Schedule ON428-A: LIFT credit',
        description: 'Gives some tax relief to people on lower pay.',
      },
    ],
  },
  {
    slug: 'ca-ab',
    taxReduction: false,
    own: [
      {
        id: 'ab428',
        name: 'Form AB428: Alberta Tax',
        description: 'Works out how much income tax you owe Alberta.',
      },
    ],
  },
  {
    slug: 'ca-bc',
    taxReduction: true,
    own: [
      {
        id: 'bc428',
        name: 'Form BC428: British Columbia Tax',
        description: 'Works out how much income tax you owe British Columbia.',
      },
      {
        id: 'bc479',
        name: 'Form BC479: British Columbia credits',
        description:
          'Works out British Columbia credits that can lower your tax or be paid to you.',
      },
    ],
  },
  {
    slug: 'ca-mb',
    taxReduction: true,
    own: [
      {
        id: 'mb428',
        name: 'Form MB428: Manitoba Tax',
        description: 'Works out how much income tax you owe Manitoba.',
      },
      {
        id: 'mb428-a',
        name: 'Schedule MB428-A: Manitoba Family Tax Benefit',
        description:
          'Lowers your Manitoba tax if your income is low. You do not need a spouse or child. It is not paid to you as cash.',
      },
      {
        id: 'mb479',
        name: 'Form MB479: Manitoba credits',
        description:
          'Works out Manitoba credits that can lower your tax or be paid to you.',
      },
    ],
  },
  {
    slug: 'ca-sk',
    taxReduction: false,
    own: [
      {
        id: 'sk428',
        name: 'Form SK428: Saskatchewan Tax',
        description: 'Works out how much income tax you owe Saskatchewan.',
      },
    ],
  },
  {
    slug: 'ca-nl',
    taxReduction: true,
    own: [
      {
        id: 'nl428',
        name: 'Form NL428: Newfoundland and Labrador Tax',
        description:
          'Works out how much income tax you owe Newfoundland and Labrador.',
      },
    ],
  },
  {
    slug: 'ca-qc',
    taxReduction: false,
    words: (name) => ({
      takeHome: `Take-home pay is your salary minus five things. The first is income tax, which comes in two parts: federal tax, lowered by the Québec abatement, and ${name} tax worked out on your ${name} return from Revenu Québec. The second is your Québec Pension Plan, or QPP, payments, which build up your future pension. The third is Employment Insurance, or EI, which can pay you if you lose your job. Québec workers pay a lower EI rate. The fourth is Québec Parental Insurance Plan, or QPIP, premiums, which pay benefits when you have or adopt a child. The fifth is the premium for Québec’s prescription drug insurance plan. You pay it on your ${name} return if you have no drug plan through work, and we assume you do not. We count the Québec abatement, a credit equal to 16.5% of your basic federal tax that Québec residents get on their federal return. The forms below are where each of these is worked out.`,
      charts: {
        takeHome:
          'Your salary minus income tax, Québec Pension Plan, Employment Insurance, Québec Parental Insurance Plan premiums and the premium for Québec’s prescription drug insurance plan.',
        averageRate: `The share of your salary that goes to income tax, Québec Pension Plan, Employment Insurance, Québec Parental Insurance Plan premiums and the drug insurance premium together. Federal and ${name} income tax both count.`,
        marginalRate:
          'Out of your next dollar of salary, the share that goes to income tax, Québec Pension Plan, Employment Insurance, Québec Parental Insurance Plan premiums and the drug insurance premium. The rate steps up where a new tax bracket starts, and across a band of lower salaries while the drug insurance premium grows. It falls where a pension or insurance payment stops.',
      },
      federal: {
        t4: {
          description:
            'Your employer’s pay slips: the T4 for your federal return and the RL-1 for your Québec return. They show your pay and what was taken off.',
        },
        t1: {
          description:
            'Works out your federal tax. This site counts the federal tax on line 43500, less the Québec abatement (line 44000), and adds the Québec tax and premium from your Québec return.',
        },
        'schedule-8': {
          // Its own id: the Canada Pension Plan page must not be linked for a Quebec filer.
          id: 'schedule-8-qc',
          name: 'Schedule 8: Québec Pension Plan Contributions',
          description:
            'Works out how much you pay into the Québec Pension Plan, or QPP.',
        },
        t2204: {
          description:
            'Checks whether you paid more Employment Insurance than the rules require, for example on the first $2,000 of pay or above the yearly maximum. Québec workers pay a lower rate, so the most they can pay is lower.',
        },
      },
    }),
    own: [
      {
        id: 'tp1',
        name: 'TP-1 Income Tax Return',
        description:
          'The Québec income tax return. It works out your Québec tax, and brings in your QPP and drug insurance amounts.',
      },
      {
        id: 'schedule-u',
        name: 'Schedule U: Québec Pension Plan (QPP) Contribution and Deduction',
        description:
          'Turns the QPP payments on your pay slip into the amount you deduct from your income.',
      },
      {
        id: 'schedule-k',
        name: 'Schedule K: Premium Payable Under the Québec Prescription Drug Insurance Plan',
        description:
          'Works out the yearly drug insurance premium if you have no drug plan through work.',
      },
      {
        id: 'schedule-b',
        name: 'Schedule B: Tax Relief Measures',
        description:
          'Amounts for living alone, age and retirement income. We do not claim any of them, so it changes nothing here.',
      },
      {
        id: 'schedule-f',
        name: 'Schedule F: Contribution to the Health Services Fund',
        description:
          'A small contribution on income other than employment income, above a set amount. A salary-only filer owes nothing, so it comes to $0.',
      },
      {
        id: 'work-chart-201',
        name: 'Work Chart 201: Deduction for workers',
        description:
          'Takes 6% of your work income off your income, up to a yearly maximum.',
      },
      {
        id: 'work-chart-401',
        name: 'Work Chart 401: Income tax on taxable income',
        description:
          'Applies the Québec tax rates to your taxable income, bracket by bracket.',
      },
    ],
  },
];

/** A form as a list entry: linked only when its page is published. */
function listItem(form: HubForm, published: ReadonlySet<string>): ListItem {
  const slug = formSlug(form.id);
  return {
    label: form.name,
    ...(published.has(slug) ? { href: contentPath(slug) } : {}),
    description: form.description,
  };
}

/**
 * The hub page of one province: how the take-home is worked out, the forms
 * used, a link to each salary page and the other hubs. `name` is the province's
 * name, `published` the slugs of the pages that exist (a form with no page is
 * listed without a link), `otherHubs` the links to the other provinces and
 * `withCharts` whether the hub has a sweep: its take-home chart then sits in the
 * section that explains the take-home. Two more sections follow, one for each rate chart, or, when `published`
 * holds the province's rates page, one section with a line and a link to it. `compareYear` is the year of the
 * sweeps: when the compare page is published, the hub has one line and a link to it.
 */
export function hubPage(
  text: ProvinceHubText,
  name: string,
  salaryLinks: ContentLink[],
  published: ReadonlySet<string>,
  otherHubs: ContentLink[],
  withCharts = false,
  compareYear: number | null = null,
): ContentPageSpec {
  const own = text.words?.(name);
  // A hub with no salary pages must not promise salary examples.
  const withSalaries = salaryLinks.length > 0;
  const title = `${name} take-home pay and income tax analysis`;
  const salaries: ContentBlock[] = [
    paragraph(
      'Pick a salary to see the whole breakdown, step by step. Salary not listed? Use the ',
      { label: 'calculator', href: HOME_PATH },
      '.',
    ),
    {
      kind: 'links',
      label: `${name} take-home pay by salary`,
      layout: 'grid',
      links: salaryLinks,
    },
  ];
  return {
    slug: text.slug,
    title,
    description: `Take-home pay and income tax in ${name} by salary: tax rates, how it compares with other provinces, and the forms behind the numbers.`,
    heading: title,
    lede: withSalaries
      ? `See how take-home pay, income tax and tax rates change with salary in ${name}, compare it with other provinces, and read the forms behind the numbers. Full salary examples are at the bottom.`
      : `See how take-home pay, income tax and tax rates change with salary in ${name}, compare it with other provinces, and read the forms behind the numbers.`,
    trail: [],
    sections: [
      {
        heading: `How your ${name} take-home is worked out`,
        ...(withCharts
          ? { id: CHART_SECTION_IDS.takeHome, card: true as const }
          : {}),
        blocks: [
          paragraph(
            own?.takeHome ??
              `Take-home pay is your salary minus three things. The first is income tax, which comes in two parts: federal tax and ${name} tax. The second is your Canada Pension Plan payments, which build up your future pension. The third is Employment Insurance, or EI, which can pay you if you lose your job. The forms below are where each of those is worked out.`,
          ),
          ...(withCharts
            ? [
                {
                  kind: 'subheading' as const,
                  text: strings.hubCharts.charts.takeHome.title,
                },
                paragraph(
                  own?.charts.takeHome ??
                    strings.hubCharts.charts.takeHome.text,
                ),
                {
                  kind: 'salaryChart' as const,
                  province: text.slug,
                  chart: 'takeHome' as const,
                },
                {
                  kind: 'chartNotes' as const,
                  province: text.slug,
                  chart: 'takeHome' as const,
                },
              ]
            : []),
        ],
      },
      // The rate charts live on the rates page when the build writes one; the hub keeps one line and a link.
      ...(!withCharts
        ? []
        : published.has(ratesSlug(text.slug))
          ? [ratesLinkSection(text.slug, name)]
          : [
              chartSection('averageRate', text, name),
              chartSection('marginalRate', text, name),
            ]),
      // The comparison of provinces lives on its own page; the hub keeps one line and a link.
      ...(!withCharts || compareYear === null || !published.has(COMPARE_SLUG)
        ? []
        : [compareLinkSection(compareYear)]),
      {
        heading: 'The forms we follow',
        blocks: [
          paragraph(
            'Our calculator follows the published forms, line by line. Pick a form to see what it is for and how each part works.',
          ),
          {
            kind: 'list',
            title: name,
            items: text.own.map((form) => listItem(form, published)),
          },
          {
            kind: 'list',
            title: `Federal forms ${name} also uses`,
            items: federalForms.map((form) =>
              listItem({ ...form, ...own?.federal[form.id] }, published),
            ),
          },
        ],
      },
      ...(!withSalaries
        ? []
        : [{ heading: 'Take-home pay by salary', blocks: salaries }]),
      {
        heading: 'Keep reading',
        blocks: [
          {
            kind: 'links',
            label: 'More',
            layout: 'row',
            links: [
              {
                label: strings.siteNav.methodology,
                href: contentPath(METHODOLOGY_SLUG),
              },
              ...otherHubs,
            ],
          },
        ],
      },
    ],
  };
}
