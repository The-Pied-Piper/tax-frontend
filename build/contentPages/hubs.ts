import { dataBlock } from '../salaryPages/pageHtml';
import { HUB_CHARTS_DATA_ID } from '../../src/state/hubSlots';
import {
  parseHubChartsData,
  type ProvinceSweep,
} from '../../src/state/hubCharts';
import { displayWholeMoney } from '../../src/money/format';
import { contentPath } from '../../src/state/siteLinks';
import type { ContentPageSpec } from '../../src/state/contentPages';
import { hubPage, provinceHubs } from '../../src/state/provinceHubs';
import { strings } from '../../src/strings';
import { pagePath } from '../salaryPages/address';
import type { BuiltProvince } from '../salaryPages/generate';
import type { Province } from '../salaryPages/provinces';

/**
 * One hub page per listed province, in list order. Its salary links are the
 * salary pages that were built, so none points at a missing file; a province
 * the API did not return still gets its hub in a build without a site URL
 * (with one, the salary build has already failed), with no salary section.
 * `published` holds the slugs of the other content pages: forms with a page
 * there are linked, and every hub counts as published. `hubOnly` holds the
 * slugs of provinces with a hub but no salary pages (the API does not serve
 * them yet); their hubs come after the listed provinces' and have no salary
 * section. `chartSlugs` holds the slugs of hubs that have a sweep: only those get
 * the salary charts card and the province comparison, and every one of them must
 * have a hub, since the comparison's bars link to hubs.
 */
export function hubPages(
  built: BuiltProvince[],
  provinceList: Province[],
  published: ReadonlySet<string>,
  hubOnly: readonly string[],
  chartSlugs: ReadonlySet<string> = new Set(),
): ContentPageSpec[] {
  const slugs = [...provinceList.map((province) => province.slug), ...hubOnly];
  for (const slug of chartSlugs) {
    if (!slugs.includes(slug)) {
      throw new Error(`Hubs: ${slug} has a sweep but no hub`);
    }
  }
  const listed = slugs.map((slug) => {
    const text = provinceHubs.find((hub) => hub.slug === slug);
    if (!text) throw new Error(`Hubs: ${slug} has no hub text`);
    return { slug, text, name: strings.siteNav.provinceNames[text.slug] };
  });
  const everyPublished = new Set([...published, ...slugs]);
  return listed.map(({ slug, text, name }) => {
    const found = built.find((b) => b.province.slug === slug);
    const salaryLinks = (found?.salaries ?? []).map((salary) => ({
      label: displayWholeMoney(
        salary,
        'annually',
        found?.unit ?? strings.fallbackUnit,
      ),
      href: pagePath(slug, salary),
    }));
    const otherHubs = listed
      .filter((other) => other.slug !== slug)
      .map((other) => ({
        label: other.name,
        href: contentPath(other.slug),
      }));
    return hubPage(
      text,
      name,
      salaryLinks,
      everyPublished,
      otherHubs,
      chartSlugs.has(slug),
    );
  });
}

/** The most a hub's chart data block may weigh, in characters of JSON: growing it is a decision. */
export const MAX_HUB_CHARTS_CHARS = 200000;

/**
 * The data block of each hub that has a sweep, by hub slug: every province's sweep in
 * one block (the comparison needs them all). A province with no sweep gets no block.
 * Fails when the data does not pass `parseHubChartsData` or a block would pass `MAX_HUB_CHARTS_CHARS`.
 */
export function hubChartBlocks(
  sweeps: readonly ProvinceSweep[],
): Map<string, string> {
  const blocks = new Map<string, string>();
  if (sweeps.length === 0) return blocks;
  const data = { provinces: sweeps };
  // What the page will read must pass the page's own guard, or the charts would silently vanish.
  if (parseHubChartsData(JSON.stringify(data)) === null) {
    throw new Error('Hubs: the chart data does not pass the data guard');
  }
  const block = dataBlock(HUB_CHARTS_DATA_ID, data);
  if (block.length > MAX_HUB_CHARTS_CHARS) {
    throw new Error(
      `Hubs: the chart data block is ${block.length.toString()} characters, limit ${MAX_HUB_CHARTS_CHARS.toString()}`,
    );
  }
  for (const sweep of sweeps) blocks.set(sweep.slug, block);
  return blocks;
}
