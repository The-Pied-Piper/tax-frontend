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
 * section.
 */
export function hubPages(
  built: BuiltProvince[],
  provinceList: Province[],
  published: ReadonlySet<string>,
  hubOnly: readonly string[],
): ContentPageSpec[] {
  const slugs = [...provinceList.map((province) => province.slug), ...hubOnly];
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
    return hubPage(text, name, salaryLinks, everyPublished, otherHubs);
  });
}
