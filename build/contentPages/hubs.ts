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
 * the API did not return still gets its hub, with no salary section.
 * `published` holds the slugs of the other content pages: forms with a page
 * there are linked, and every hub counts as published.
 */
export function hubPages(
  built: BuiltProvince[],
  provinceList: Province[],
  published: ReadonlySet<string>,
): ContentPageSpec[] {
  const listed = provinceList.map((province) => {
    const text = provinceHubs.find((hub) => hub.slug === province.slug);
    if (!text) throw new Error(`Hubs: ${province.slug} has no hub text`);
    return { province, text, name: strings.siteNav.provinceNames[text.slug] };
  });
  const everyPublished = new Set([
    ...published,
    ...listed.map(({ province }) => province.slug),
  ]);
  return listed.map(({ province, text, name }) => {
    const found = built.find((b) => b.province.slug === province.slug);
    const salaryLinks = (found?.salaries ?? []).map((salary) => ({
      label: displayWholeMoney(
        salary,
        'annually',
        found?.unit ?? strings.fallbackUnit,
      ),
      href: pagePath(province.slug, salary),
    }));
    const otherHubs = listed
      .filter((other) => other.province.slug !== province.slug)
      .map((other) => ({
        label: other.name,
        href: contentPath(other.province.slug),
      }));
    return hubPage(text, name, salaryLinks, everyPublished, otherHubs);
  });
}
