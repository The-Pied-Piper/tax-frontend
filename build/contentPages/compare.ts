import type { ContentPageSpec } from '../../src/state/contentPages';
import type { ProvinceSweep } from '../../src/state/hubCharts';
import {
  COMPARE_SLUG,
  contentPath,
  type FooterProvinceSlug,
  FOOTER_PROVINCE_SLUGS,
} from '../../src/state/siteLinks';
import { strings } from '../../src/strings';

/**
 * The page that compares every province: `/compare-provinces/`. One page for all provinces, not one for
 * each, so it highlights none. Its bars, and the table of every salary, read the sweeps in the page's own
 * data block (the same block a hub carries), so no figure is typed in the spec. With no sweeps there is
 * nothing to compare and no page.
 */
export function comparePage(
  sweeps: readonly ProvinceSweep[],
): ContentPageSpec | null {
  const year = sweeps[0]?.year;
  if (year === undefined) return null;
  const t = strings.comparePage;
  const slugs = FOOTER_PROVINCE_SLUGS.filter((slug) =>
    sweeps.some((sweep) => sweep.slug === slug),
  );
  return {
    slug: COMPARE_SLUG,
    title: t.title(year),
    description: t.description(year),
    heading: t.heading(year),
    lede: t.intro,
    trail: [],
    sections: [
      {
        heading: t.sectionHeading,
        blocks: [{ kind: 'provinceComparison' }],
      },
      {
        heading: t.linksHeading,
        blocks: [
          {
            kind: 'paragraph',
            content: [t.linksLead],
          },
          {
            kind: 'links',
            label: t.linksHeading,
            layout: 'grid',
            links: slugs.map((slug: FooterProvinceSlug) => ({
              label: strings.siteNav.provinceNames[slug],
              href: contentPath(slug),
            })),
          },
        ],
      },
    ],
  };
}

/**
 * The data block of the compare page: the block a hub carries (it holds every province's sweep). No page, no block;
 * a page whose hubs have no block fails the build.
 */
export function compareBlock(
  page: ContentPageSpec | null,
  hubBlocks: ReadonlyMap<string, string>,
): Map<string, string> {
  if (page === null) return new Map<string, string>();
  const block = [...hubBlocks.values()][0];
  if (block === undefined) {
    throw new Error(`Compare: ${page.slug} has no hub data block`);
  }
  return new Map([[page.slug, block]]);
}
