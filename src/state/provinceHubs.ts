import {
  paragraph,
  type ContentBlock,
  type ContentLink,
  type ContentPageSpec,
  type ListItem,
} from './contentPages';
import {
  contentPath,
  formSlug,
  HOME_PATH,
  METHODOLOGY_SLUG,
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
};

/** The federal forms every hub lists, in the order shown. */
const federalForms: HubForm[] = [
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

/** The hub text of each province the footer lists. Adding a province is one entry here. */
export const provinceHubs: ProvinceHubText[] = [
  {
    slug: 'ca-on',
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
    own: [
      {
        id: 'nl428',
        name: 'Form NL428: Newfoundland and Labrador Tax',
        description:
          'Works out how much income tax you owe Newfoundland and Labrador.',
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
 * listed without a link) and `otherHubs` the links to the other provinces.
 */
export function hubPage(
  text: ProvinceHubText,
  name: string,
  salaryLinks: ContentLink[],
  published: ReadonlySet<string>,
  otherHubs: ContentLink[],
  withComparison: boolean,
): ContentPageSpec {
  // A hub with no salary pages must not promise salary examples.
  const withSalaries = salaryLinks.length > 0;
  const title = withSalaries
    ? `${name}: forms and take-home examples`
    : `${name}: forms behind take-home pay`;
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
    description: withSalaries
      ? `The forms behind take-home pay in ${name}, each explained in plain words, with full salary examples to look at.`
      : `The forms behind take-home pay in ${name}, each explained in plain words.`,
    heading: title,
    lede: withSalaries
      ? `Everything this site uses to work out take-home pay in ${name}, in one place. Each form is explained in plain words, and each salary page shows a full example.`
      : `Everything this site uses to work out take-home pay in ${name}, in one place. Each form is explained in plain words.`,
    trail: [],
    sections: [
      {
        heading: `How your ${name} take-home is worked out`,
        blocks: [
          paragraph(
            `Take-home pay is your salary minus three things. The first is income tax, which comes in two parts: federal tax and ${name} tax. The second is your Canada Pension Plan payments, which build up your future pension. The third is Employment Insurance, or EI, which can pay you if you lose your job. The forms below are where each of those is worked out.`,
          ),
        ],
      },
      ...(!withComparison
        ? []
        : [
            {
              heading: strings.hubCharts.comparison.heading,
              blocks: [
                paragraph(strings.hubCharts.comparison.intro),
                { kind: 'provinceComparison' as const, province: text.slug },
              ],
            },
          ]),
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
            items: federalForms.map((form) => listItem(form, published)),
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
