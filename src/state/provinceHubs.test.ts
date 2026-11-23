import { DESCRIPTION_LIMIT, TITLE_LIMIT } from '../../build/salaryPages/limits';
import { strings } from '../strings';
import type {
  ContentBlock,
  ContentLink,
  ContentPageSpec,
} from './contentPages';
import { paragraph } from './contentPages';
import { copyRules, everyString } from '../test/copyRules';
import { hubPage, provinceHubs } from './provinceHubs';
import {
  contentPath,
  FOOTER_PROVINCE_SLUGS,
  formSlug,
  HOME_PATH,
  METHODOLOGY_SLUG,
} from './siteLinks';

type ListBlock = Extract<ContentBlock, { kind: 'list' }>;
type LinksBlock = Extract<ContentBlock, { kind: 'links' }>;
type Slug = (typeof FOOTER_PROVINCE_SLUGS)[number];

const FEDERAL = [
  ['t4', 'T4 slip'],
  ['t1', 'T1 return'],
  ['schedule-8', 'Schedule 8: Canada Pension Plan'],
  ['t2204', 'Form T2204: EI overpayment'],
  ['schedule-6', 'Schedule 6: Canada Workers Benefit'],
] as const;

const OWN: Record<Slug, (readonly [string, string])[]> = {
  'ca-on': [
    ['on428', 'Form ON428: Ontario Tax'],
    ['on428-a', 'Schedule ON428-A: LIFT credit'],
  ],
  'ca-ab': [['ab428', 'Form AB428: Alberta Tax']],
  'ca-bc': [
    ['bc428', 'Form BC428: British Columbia Tax'],
    ['bc479', 'Form BC479: British Columbia credits'],
  ],
  'ca-sk': [['sk428', 'Form SK428: Saskatchewan Tax']],
  'ca-nl': [['nl428', 'Form NL428: Newfoundland and Labrador Tax']],
  'ca-mb': [
    ['mb428', 'Form MB428: Manitoba Tax'],
    ['mb428-a', 'Schedule MB428-A: Manitoba Family Tax Benefit'],
    ['mb479', 'Form MB479: Manitoba credits'],
  ],
};

const SALARIES = ['30000', '35000', '40000'];
const salaryLinks: ContentLink[] = SALARIES.map((s) => ({
  label: `$${s}`,
  href: `/x/${s}/`,
}));

function textOf(slug: Slug) {
  const text = provinceHubs.find((hub) => hub.slug === slug);
  if (!text) throw new Error(`no hub text for ${slug}`);
  return text;
}

function build(
  slug: Slug,
  published: string[] = [],
  links: ContentLink[] = salaryLinks,
): ContentPageSpec {
  const name = strings.siteNav.provinceNames[slug];
  const others = FOOTER_PROVINCE_SLUGS.filter((s) => s !== slug).map((s) => ({
    label: strings.siteNav.provinceNames[s],
    href: contentPath(s),
  }));
  return hubPage(textOf(slug), name, links, new Set(published), others, false);
}

function section(page: ContentPageSpec, heading: string) {
  return page.sections.find((s) => s.heading === heading);
}

function lists(page: ContentPageSpec): ListBlock[] {
  const blocks = section(page, 'The forms we follow')?.blocks ?? [];
  return blocks.filter((b): b is ListBlock => b.kind === 'list');
}

describe('provinceHubs', () => {
  it('has one entry for each province the footer lists, in that order', () => {
    expect(provinceHubs.map((hub) => hub.slug)).toEqual([
      ...FOOTER_PROVINCE_SLUGS,
    ]);
  });
});

describe.each(FOOTER_PROVINCE_SLUGS)('the hub page for %s', (slug) => {
  const name = strings.siteNav.provinceNames[slug];
  const page = build(slug, [], salaryLinks);

  it('lives at the province slug, with no trail', () => {
    expect(page.slug).toBe(slug);
    expect(page.trail).toEqual([]);
  });

  it('names the province in the title and the heading, within the limits', () => {
    expect(page.title).toBe(`${name}: forms and take-home examples`);
    expect(page.heading).toBe(`${name}: forms and take-home examples`);
    expect(page.title.length).toBeLessThan(TITLE_LIMIT);
    expect(page.description.length).toBeGreaterThan(0);
    expect(page.description.length).toBeLessThan(DESCRIPTION_LIMIT);
    expect(page.description).toContain(name);
  });

  it('has the lede with the province name', () => {
    expect(page.lede).toBe(
      `Everything this site uses to work out take-home pay in ${name}, in one place. Each form is explained in plain words, and each salary page shows a full example.`,
    );
  });

  it('explains how the take-home is worked out, with the province name in it', () => {
    const how = section(page, `How your ${name} take-home is worked out`);
    expect(how).toBeDefined();
    const words = everyString(how?.blocks).join(' ');
    expect(words).toContain(
      `income tax, which comes in two parts: federal tax and ${name} tax`,
    );
    expect(words).toContain('Canada Pension Plan');
    expect(words).toContain('EI');
  });

  it('puts no "a" before a province name that starts with a vowel', () => {
    const how = section(page, `How your ${name} take-home is worked out`);
    const words = everyString(how?.blocks).join(' ');
    expect(words).not.toMatch(/\ba [AEIOU]/);
  });

  it('says EI can pay you if you lose your job, not that it does', () => {
    const how = section(page, `How your ${name} take-home is worked out`);
    const words = everyString(how?.blocks).join(' ');
    expect(words).toContain('which can pay you if you lose your job');
    expect(words).not.toContain('which pays you');
  });

  it('opens the forms section with the plain-English paragraph', () => {
    const [first] = section(page, 'The forms we follow')?.blocks ?? [];
    expect(first).toEqual({
      kind: 'paragraph',
      content: [
        'Our calculator follows the published forms, line by line. Pick a form to see what it is for and how each part works.',
      ],
    });
  });

  it('lists the province forms first, titled with its name', () => {
    const [own] = lists(page);
    expect(own?.title).toBe(name);
    expect(own?.items.map((item) => item.label)).toEqual(
      OWN[slug].map(([, label]) => label),
    );
    for (const item of own?.items ?? []) {
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it('then lists the six federal forms, titled for the province', () => {
    const federal = lists(page)[1];
    expect(lists(page)).toHaveLength(2);
    expect(federal?.title).toBe(`Federal forms ${name} also uses`);
    expect(federal?.items.map((item) => item.label)).toEqual(
      FEDERAL.map(([, label]) => label),
    );
    for (const item of federal?.items ?? []) {
      expect(item.description.length).toBeGreaterThan(0);
    }
  });

  it('links every salary, one link each, to the address given', () => {
    const salaries = section(page, 'Take-home pay by salary');
    const grid = salaries?.blocks.find(
      (b): b is LinksBlock => b.kind === 'links',
    );
    expect(grid?.layout).toBe('grid');
    expect(grid?.label).toBe(`${name} take-home pay by salary`);
    expect(grid?.links).toEqual(salaryLinks);
    expect(salaries?.blocks[0]).toEqual({
      kind: 'paragraph',
      content: [
        'Pick a salary to see the whole breakdown, step by step. Salary not listed? Use the ',
        { label: 'calculator', href: HOME_PATH },
        '.',
      ],
    });
  });

  it('leaves out the salary section when there are no salary links', () => {
    const bare = build(slug, [], []);
    expect(section(bare, 'Take-home pay by salary')).toBeUndefined();
    expect(bare.sections.map((s) => s.heading)).toEqual(
      page.sections
        .map((s) => s.heading)
        .filter((h) => h !== 'Take-home pay by salary'),
    );
  });

  it('ends with a row of links: the methodology page, then the other two hubs', () => {
    const last = page.sections.at(-1);
    expect(last?.heading).toBe('Keep reading');
    const row = last?.blocks.find((b): b is LinksBlock => b.kind === 'links');
    expect(row?.layout).toBe('row');
    expect(row?.label).toBe('More');
    expect(row?.links).toEqual([
      {
        label: strings.siteNav.methodology,
        href: contentPath(METHODOLOGY_SLUG),
      },
      ...FOOTER_PROVINCE_SLUGS.filter((s) => s !== slug).map((s) => ({
        label: strings.siteNav.provinceNames[s],
        href: contentPath(s),
      })),
    ]);
  });

  it('has no link on any form while no form page is published', () => {
    for (const list of lists(page)) {
      for (const item of list.items) {
        expect(item.href, item.label).toBeUndefined();
      }
    }
  });

  it('links a form only when its page is published', () => {
    const [first] = OWN[slug];
    const id = first?.[0] ?? '';
    const published = build(slug, [formSlug(id)]);
    for (const item of lists(published).flatMap((list) => list.items)) {
      expect(item.href, item.label).toBe(
        item.label === first?.[1] ? contentPath(formSlug(id)) : undefined,
      );
    }
  });

  it('links a federal form when its page is published', () => {
    const published = build(
      slug,
      FEDERAL.map(([id]) => formSlug(id)),
    );
    expect(lists(published)[1]?.items.map((item) => item.href)).toEqual(
      FEDERAL.map(([id]) => contentPath(formSlug(id))),
    );
    expect(lists(published)[0]?.items.every((i) => i.href === undefined)).toBe(
      true,
    );
  });

  it('ignores published slugs that are not its forms', () => {
    const other = build(slug, ['methodology', 'forms/not-a-form', 'ca-on']);
    for (const list of lists(other)) {
      for (const item of list.items) {
        expect(item.href, item.label).toBeUndefined();
      }
    }
  });
});

describe('the Saskatchewan hub', () => {
  const page = build('ca-sk', [], []);

  it('promises no salary examples and describes its form in plain words', () => {
    expect(page.title).toBe('Saskatchewan: forms behind take-home pay');
    expect(
      page.sections.some((s) => s.heading === 'Take-home pay by salary'),
    ).toBe(false);
    expect((lists(page)[0]?.items ?? []).map((i) => i.description)).toEqual([
      'Works out how much income tax you owe Saskatchewan.',
    ]);
  });
});

describe('the Newfoundland and Labrador hub', () => {
  const page = build('ca-nl', [], []);

  it('promises no salary examples and describes its form in plain words', () => {
    expect(page.title).toBe(
      'Newfoundland and Labrador: forms behind take-home pay',
    );
    expect(
      page.sections.some((s) => s.heading === 'Take-home pay by salary'),
    ).toBe(false);
    expect((lists(page)[0]?.items ?? []).map((i) => i.description)).toEqual([
      'Works out how much income tax you owe Newfoundland and Labrador.',
    ]);
  });
});

describe('a hub with no salary pages', () => {
  const page = build('ca-mb', [], []);

  it('promises no salary examples in its title, description or lede', () => {
    expect(page.title).toBe('Manitoba: forms behind take-home pay');
    expect(page.heading).toBe('Manitoba: forms behind take-home pay');
    expect(page.description).toBe(
      'The forms behind take-home pay in Manitoba, each explained in plain words.',
    );
    expect(page.lede).toBe(
      'Everything this site uses to work out take-home pay in Manitoba, in one place. Each form is explained in plain words.',
    );
    for (const text of [page.title, page.description, page.lede ?? '']) {
      expect(text).not.toMatch(/salary|example/i);
    }
  });

  it('has no salary section and links no form that has no page', () => {
    expect(
      page.sections.some((s) => s.heading === 'Take-home pay by salary'),
    ).toBe(false);
    const own = lists(page)[0];
    for (const item of own?.items ?? []) expect(item.href).toBeUndefined();
  });

  it('says the same in the plain words of the printed Manitoba form titles', () => {
    const items = lists(page)[0]?.items ?? [];
    expect(items.map((i) => i.description)).toEqual([
      'Works out how much income tax you owe Manitoba.',
      'Lowers your Manitoba tax if your income is low. You do not need a spouse or child. It is not paid to you as cash.',
      'Works out Manitoba credits that can lower your tax or be paid to you.',
    ]);
  });
});

describe('the province comparison', () => {
  const on = textOf('ca-on');
  const others: ContentLink[] = [];
  const make = (withComparison: boolean) =>
    hubPage(on, 'Ontario', salaryLinks, new Set(), others, withComparison);

  it('adds one section with the approved heading and intro, and the hub slug', () => {
    const found = section(make(true), strings.hubCharts.comparison.heading);
    expect(found?.blocks).toEqual([
      paragraph(strings.hubCharts.comparison.intro),
      { kind: 'provinceComparison', province: 'ca-on' },
    ]);
  });

  it('is left out with the chart sections when asked not to add them, and the rest of the page is the same', () => {
    const without = make(false);
    expect(
      section(without, strings.hubCharts.comparison.heading),
    ).toBeUndefined();
    const chartHeadings = [
      strings.hubCharts.comparison.heading,
      strings.hubCharts.charts.averageRate.title,
      strings.hubCharts.charts.marginalRate.title,
      strings.hubCharts.charts.yearTotal.title,
    ];
    const withIt = make(true);
    const rest = withIt.sections
      .filter((s) => !chartHeadings.includes(s.heading))
      // The take-home section keeps its words and gains its permalink, its chart and the chart's heading and line.
      .map(({ heading, blocks }) => ({
        heading,
        blocks: blocks.filter(
          (block) =>
            block.kind !== 'salaryChart' &&
            block.kind !== 'subheading' &&
            JSON.stringify(block) !==
              JSON.stringify(paragraph(strings.hubCharts.charts.takeHome.text)),
        ),
      }));
    expect(rest).toEqual(without.sections);
  });

  it('has the take-home chart in the section that explains the take-home, then one section for each other chart, each with a permalink', () => {
    const page = make(true);
    const how = section(page, 'How your Ontario take-home is worked out');
    expect(how?.id).toBe('take-home');
    expect(how?.blocks.at(-1)).toEqual({
      kind: 'salaryChart',
      province: 'ca-on',
      chart: 'takeHome',
    });
    const t = strings.hubCharts.charts;
    expect(
      (['averageRate', 'marginalRate', 'yearTotal'] as const).map((chart) => {
        const found = section(page, t[chart].title);
        return [found?.id, found?.blocks];
      }),
    ).toEqual([
      [
        'average-rate',
        [
          paragraph(t.averageRate.text),
          { kind: 'salaryChart', province: 'ca-on', chart: 'averageRate' },
        ],
      ],
      [
        'marginal-rate',
        [
          paragraph(t.marginalRate.text),
          { kind: 'salaryChart', province: 'ca-on', chart: 'marginalRate' },
        ],
      ],
      [
        'tax-and-contributions',
        [
          paragraph(t.yearTotal.text),
          { kind: 'salaryChart', province: 'ca-on', chart: 'yearTotal' },
        ],
      ],
    ]);
  });

  it('keeps the take-home section as it was, with no permalink, on a hub with no charts', () => {
    expect(
      section(make(false), 'How your Ontario take-home is worked out')?.id,
    ).toBeUndefined();
  });
});

describe('province names', () => {
  it('are not written into the hub text: the name is always the one given', () => {
    const page = hubPage(
      textOf('ca-on'),
      'Zedland',
      salaryLinks,
      new Set(),
      [],
      false,
    );
    expect(page.heading).toBe('Zedland: forms and take-home examples');
    expect(page.lede).not.toContain('Ontario');
    expect(page.description).not.toContain('Ontario');
    const shared = page.sections.filter(
      (s) => s.heading !== 'The forms we follow',
    );
    const words = everyString(shared).join(' ');
    expect(words).toContain('Zedland');
    expect(words).not.toContain('Ontario');
  });
});

describe.each(FOOTER_PROVINCE_SLUGS)('the copy of the hub for %s', (slug) => {
  const text = provinceHubs.find((hub) => hub.slug === slug);
  const page = text
    ? hubPage(
        text,
        strings.siteNav.provinceNames[slug],
        [{ label: '$30,000', href: `/${slug}/30000/` }],
        new Set(),
        [],
        false,
      )
    : null;

  it.each(copyRules)('holds no %s', (_name, pattern) => {
    expect(page).not.toBeNull();
    for (const words of everyString(page)) {
      expect(words, words).not.toMatch(pattern);
    }
  });
});

describe('the copy rules', () => {
  it('catch what they are for', () => {
    const samples = [
      'It was checked against the agency',
      'Only in Canada',
      'a Canada-only site',
      'Written by an AI',
      `the ${['CRA', 'calculator'].join(' ')}`,
      `see ${['Tax', 'Tips'].join('')}`,
      'see docs/readme',
    ];
    samples.forEach((text, at) => {
      expect(text).toMatch(copyRules[at]?.[1] ?? /^$/);
    });
  });
});
