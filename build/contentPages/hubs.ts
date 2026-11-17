import { displayWholeMoney } from '../../src/money/format';
import type {
  ContentBlock,
  ContentLink,
  ContentPageSpec,
} from '../../src/state/contentPages';
import {
  federalForms,
  type HubForm,
  type ProvinceHub,
} from '../../src/state/provinceHubs';
import {
  contentPath,
  HOME_PATH,
  METHODOLOGY_SLUG,
} from '../../src/state/siteLinks';
import { strings } from '../../src/strings';
import type { Province } from '../salaryPages/provinces';
import type { SalaryIndex } from '../salaryPages/salaryIndex';

export type HubOptions = {
  /** The provinces of the build, in order; one page for each that has hub text. */
  provinces: Province[];
  /** The hub text of each province. */
  hubs: ProvinceHub[];
  /** The links to every salary page that was written. */
  index: SalaryIndex;
  /** The slugs of the other content pages, so a link goes only to a page that exists. */
  published: string[];
  /** The place name of each hub slug. */
  names?: Record<string, string>;
};

function formList(forms: HubForm[], published: string[]): ContentBlock {
  return {
    kind: 'list',
    items: forms.map((form) => ({
      label: form.name,
      // A form whose page is not listed yet is shown without a link.
      ...(published.includes(form.slug)
        ? { href: contentPath(form.slug) }
        : {}),
      text: form.line,
    })),
  };
}

/**
 * One page for each province (it is an error for one to have no hub text): how take-home is worked out,
 * the forms followed, a link to every salary page that was written, and the
 * methodology page and the other provinces. Links go only to pages that exist.
 */
export function hubPages(options: HubOptions): ContentPageSpec[] {
  const { provinces, hubs, index, published } = options;
  const names: Record<string, string> = options.names ?? {
    ...strings.siteNav.provinceNames,
  };
  const listed = provinces.map((province) => {
    const hub = hubs.find((h) => h.slug === province.slug);
    if (!hub) {
      // Without its page, a province's salary pages would have no link to them.
      throw new Error(
        `Hub pages: ${province.slug} has no entry in provinceHubs`,
      );
    }
    return { province, hub };
  });
  const placeOf = (slug: string): string => {
    const name = names[slug];
    if (name === undefined) throw new Error(`Hub pages: no name for ${slug}`);
    return name;
  };
  return listed.map(({ province, hub }) => {
    const place = placeOf(hub.slug);
    const group = index.groups.find((g) => g.code === province.code);
    const more: ContentLink[] = [
      ...(published.includes(METHODOLOGY_SLUG)
        ? [
            {
              label: strings.siteNav.methodology,
              href: contentPath(METHODOLOGY_SLUG),
            },
          ]
        : []),
      ...listed
        .filter((other) => other.hub.slug !== hub.slug)
        .map((other) => ({
          label: placeOf(other.hub.slug),
          href: contentPath(other.hub.slug),
        })),
      { label: strings.provinceHub.calculator, href: HOME_PATH },
    ];
    const text = strings.provinceHub;
    return {
      slug: hub.slug,
      title: text.title(place),
      description: text.description(place),
      heading: text.heading(place),
      lede: text.lede(place),
      trail: [],
      sections: [
        { heading: text.howHeading(place), paragraphs: [text.how(place)] },
        {
          heading: text.formsHeading,
          paragraphs: [text.formsIntro],
          blocks: [
            { kind: 'subheading', text: place },
            formList(hub.forms, published),
            { kind: 'subheading', text: text.federalHeading(place) },
            formList(federalForms, published),
          ],
        },
        ...(group && group.pages.length > 0
          ? [
              {
                heading: text.salariesHeading,
                paragraphs: [text.salariesIntro],
                blocks: [
                  {
                    kind: 'links' as const,
                    label: text.salariesLabel(place),
                    layout: 'grid' as const,
                    links: group.pages.map((page) => ({
                      label: displayWholeMoney(
                        page.salary,
                        'annually',
                        group.unit,
                      ),
                      href: page.href,
                    })),
                  },
                ],
              },
            ]
          : []),
        {
          heading: text.moreHeading,
          paragraphs: [],
          blocks: [
            {
              kind: 'links',
              label: text.moreLabel,
              layout: 'row',
              links: more,
            },
          ],
        },
      ],
    };
  });
}
