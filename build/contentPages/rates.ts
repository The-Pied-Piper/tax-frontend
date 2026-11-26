import type {
  ContentSection,
  ContentPageSpec,
} from '../../src/state/contentPages';
import { ratesPageText, ratesProvinces } from '../../src/state/ratesPage';
import {
  contentPath,
  ratesSlug,
  type FooterProvinceSlug,
} from '../../src/state/siteLinks';
import { strings } from '../../src/strings';

/** The order the other provinces' links come in. */
export const LINK_ORDER: readonly FooterProvinceSlug[] = [
  'ca-on',
  'ca-qc',
  'ca-bc',
  'ca-ab',
  'ca-sk',
  'ca-mb',
  'ca-nl',
];

/** A paragraph linking the rates page of every other province that has one in this build. */
function otherProvinces(
  province: FooterProvinceSlug,
  live: readonly FooterProvinceSlug[],
): ContentSection[] {
  const links = LINK_ORDER.filter(
    (other) => other !== province && live.includes(other),
  ).map((other) => ({
    label: strings.ratesPage.otherLink(strings.siteNav.provinceNames[other]),
    href: contentPath(ratesSlug(other)),
  }));
  if (links.length === 0) return [];
  return [
    {
      heading: strings.ratesPage.othersHeading,
      blocks: [
        {
          kind: 'links',
          label: strings.ratesPage.othersHeading,
          layout: 'row',
          links,
        },
      ],
    },
  ];
}

/**
 * One rates page for each province that has both its wording (`ratesPageText`) and a sweep, at `/ca-xx/tax-rates/`.
 * The parts are blocks that read the sweep in the page's own data block, so no figure is typed in the spec. A province
 * with wording but no sweep gets no page (and nothing links to it); a sweep that is not the full one fails the build
 * in `provinceSweeps`, before any page is drawn.
 */
export function ratesPages(chartSlugs: ReadonlySet<string>): ContentPageSpec[] {
  const t = strings.ratesPage;
  const live = ratesProvinces().filter((province) => chartSlugs.has(province));
  return live.map((province: FooterProvinceSlug) => {
    const text = ratesPageText[province];
    if (!text) throw new Error(`Rates: ${province} has no text`);
    return {
      slug: ratesSlug(province),
      title: text.title,
      description: text.description,
      heading: text.heading,
      trail: [
        {
          label: strings.siteNav.provinceNames[province],
          slug: province,
        },
      ],
      sections: [
        {
          blocks: [
            { kind: 'ratesPart', province, part: 'lead' },
            { kind: 'ratesPart', province, part: 'jump' },
          ],
        },
        {
          heading: t.chartHeading,
          blocks: [{ kind: 'ratesChart', province }],
        },
        {
          heading: t.countedHeading,
          id: 'what-is-counted',
          blocks: [{ kind: 'ratesPart', province, part: 'basis' }],
        },
        {
          heading: t.notesHeading,
          id: 'what-moves-the-rate',
          blocks: [{ kind: 'ratesPart', province, part: 'groups' }],
        },
        {
          heading: t.howToRead,
          id: 'how-to-read',
          blocks: [{ kind: 'ratesPart', province, part: 'howToRead' }],
        },
        {
          heading: t.bracketsHeading,
          id: 'brackets',
          blocks: [{ kind: 'ratesPart', province, part: 'tables' }],
        },
        ...otherProvinces(province, live),
      ],
    };
  });
}

/**
 * The data block of each rates page by its slug: the block the hub of the same province carries (`hubBlocks` is
 * `hubChartBlocks`' map, so its guard and size limit already ran). A page whose province has no hub block fails.
 */
export function ratesBlocks(
  pages: readonly ContentPageSpec[],
  hubBlocks: ReadonlyMap<string, string>,
): Map<string, string> {
  const blocks = new Map<string, string>();
  for (const page of pages) {
    const province = page.trail[0]?.slug ?? '';
    const block = hubBlocks.get(province);
    if (block === undefined) {
      throw new Error(`Rates: ${page.slug} has no hub data block`);
    }
    blocks.set(page.slug, block);
  }
  return blocks;
}
