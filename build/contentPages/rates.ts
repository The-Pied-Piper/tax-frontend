import { dataBlock } from '../salaryPages/pageHtml';
import { HUB_CHARTS_DATA_ID } from '../../src/state/hubSlots';
import type { ContentPageSpec } from '../../src/state/contentPages';
import type { ProvinceSweep } from '../../src/state/hubCharts';
import { ratesPageText, ratesSlug } from '../../src/state/ratesPage';
import { ratesProvinces } from '../../src/state/ratesPage';
import type { FooterProvinceSlug } from '../../src/state/siteLinks';
import { strings } from '../../src/strings';

/**
 * One rates page for each province that has both its wording (`ratesPageText`) and a sweep, at `/ca-xx/tax-rates/`.
 * The parts are blocks that read the sweep in the page's own data block, so no figure is typed in the spec. A province
 * with wording but no sweep gets no page (and nothing links to it); a sweep that is not the full one fails the build
 * when the page is drawn.
 */
export function ratesPages(chartSlugs: ReadonlySet<string>): ContentPageSpec[] {
  const t = strings.ratesPage;
  return ratesProvinces()
    .filter((province) => chartSlugs.has(province))
    .map((province: FooterProvinceSlug) => {
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
            heading: t.chartHeading,
            blocks: [
              { kind: 'ratesPart', province, part: 'intro' },
              { kind: 'ratesChart', province },
            ],
          },
          {
            heading: t.howToRead,
            id: 'how-to-read',
            blocks: [{ kind: 'ratesPart', province, part: 'howToRead' }],
          },
          {
            heading: t.notesHeading,
            id: 'what-moves-the-rate',
            blocks: [{ kind: 'ratesPart', province, part: 'groups' }],
          },
          {
            heading: t.bracketsHeading,
            id: 'brackets',
            blocks: [{ kind: 'ratesPart', province, part: 'tables' }],
          },
        ],
      };
    });
}

/** The data block of each rates page by its slug: the same sweep block the hubs carry (`blocks` is `hubChartBlocks`' map). */
export function ratesBlocks(
  pages: readonly ContentPageSpec[],
  sweeps: readonly ProvinceSweep[],
): Map<string, string> {
  const blocks = new Map<string, string>();
  if (pages.length === 0) return blocks;
  const block = dataBlock(HUB_CHARTS_DATA_ID, { provinces: sweeps });
  for (const page of pages) blocks.set(page.slug, block);
  return blocks;
}
