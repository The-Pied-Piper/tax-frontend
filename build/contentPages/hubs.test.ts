import { readUnit } from '../../src/adapters/fallback';
import { displayWholeMoney } from '../../src/money/format';
import {
  contentPages,
  type ContentBlock,
  type ContentPageSpec,
} from '../../src/state/contentPages';
import { formSlug } from '../../src/state/siteLinks';
import { strings } from '../../src/strings';
import { xland } from '../../src/test/generatedSite';
import { compute70000 } from '../../src/test/syntheticPages';
import { pagePath } from '../salaryPages/address';
import { provinces } from '../salaryPages/provinces';
import {
  parseHubChartsData,
  type ProvinceSweep,
} from '../../src/state/hubCharts';
import { hubChartBlocks, hubPages, MAX_HUB_CHARTS_CHARS } from './hubs';

// Builds the hub pages from what the salary build wrote.
const unit = readUnit(compute70000.unit) ?? strings.fallbackUnit;
const [ontario, alberta, columbia] = provinces;
if (!ontario || !alberta || !columbia) throw new Error('province list');

const built = (province: typeof ontario, salaries: string[]) => ({
  province,
  unit,
  salaries,
});
const ontarioBuilt = built(ontario, ['30000', '35000', '40000']);
const albertaBuilt = built(alberta, ['50000', '55000']);

type LinksBlock = Extract<ContentBlock, { kind: 'links' }>;
const gridOf = (page: ContentPageSpec) =>
  page.sections
    .flatMap((s) => s.blocks)
    .find((b): b is LinksBlock => b.kind === 'links' && b.layout === 'grid');

function hubOf(pages: ContentPageSpec[], slug: string): ContentPageSpec {
  const page = pages.find((p) => p.slug === slug);
  if (!page) throw new Error(`no hub for ${slug}`);
  return page;
}

describe('hubPages', () => {
  it('makes one hub per listed province, in list order, at the province slug', () => {
    const pages = hubPages(
      [ontarioBuilt, albertaBuilt],
      provinces,
      new Set(),
      [],
    );
    expect(pages.map((p) => p.slug)).toEqual(provinces.map((p) => p.slug));
  });

  it('links each salary that was built, with the money label and the page address', () => {
    const page = hubOf(
      hubPages([ontarioBuilt], provinces, new Set(), []),
      'ca-on',
    );
    expect(gridOf(page)?.links).toEqual(
      ontarioBuilt.salaries.map((salary) => ({
        label: displayWholeMoney(salary, 'annually', unit),
        href: pagePath('ca-on', salary),
      })),
    );
  });

  it('gives each hub only its own province salaries', () => {
    const pages = hubPages(
      [ontarioBuilt, albertaBuilt],
      provinces,
      new Set(),
      [],
    );
    const hrefs = pages.map((p) => gridOf(p)?.links.map((l) => l.href));
    expect(hrefs[0]).toEqual([
      '/ca-on/30000/',
      '/ca-on/35000/',
      '/ca-on/40000/',
    ]);
    expect(hrefs[1]).toEqual(['/ca-ab/50000/', '/ca-ab/55000/']);
  });

  it('still makes the hub of a province the API did not return, with no salary section', () => {
    const pages = hubPages([ontarioBuilt], provinces, new Set(), []);
    expect(pages).toHaveLength(provinces.length);
    const skipped = hubOf(pages, 'ca-ab');
    expect(gridOf(skipped)).toBeUndefined();
    expect(
      skipped.sections.some((s) => s.heading === 'Take-home pay by salary'),
    ).toBe(false);
    expect(gridOf(hubOf(pages, 'ca-on'))).toBeDefined();
  });

  it('makes every hub with no salary section when nothing was built', () => {
    const pages = hubPages([], provinces, new Set(), []);
    expect(pages).toHaveLength(provinces.length);
    for (const page of pages) expect(gridOf(page)).toBeUndefined();
  });

  // No province is hub-only at present, so these tests list all but Newfoundland and Labrador and treat it as the hub-only one.
  const withoutNl = provinces.filter((p) => p.slug !== 'ca-nl');

  it('makes the hub of a hub-only province after the listed ones, with no salary section', () => {
    const pages = hubPages([ontarioBuilt], withoutNl, new Set(), ['ca-nl']);
    expect(pages.map((p) => p.slug)).toEqual([
      ...withoutNl.map((p) => p.slug),
      'ca-nl',
    ]);
    const newfoundland = hubOf(pages, 'ca-nl');
    expect(gridOf(newfoundland)).toBeUndefined();
    expect(
      newfoundland.sections.some(
        (s) => s.heading === 'Take-home pay by salary',
      ),
    ).toBe(false);
  });

  it('links the hub-only province from every other hub, and links them back', () => {
    const pages = hubPages([], withoutNl, new Set(), ['ca-nl']);
    const hrefsOf = (page: ContentPageSpec) =>
      page.sections
        .flatMap((s) => s.blocks)
        .filter(
          (b): b is LinksBlock => b.kind === 'links' && b.layout === 'row',
        )
        .flatMap((b) => b.links.map((l) => l.href));
    expect(hrefsOf(hubOf(pages, 'ca-on'))).toContain('/ca-nl/');
    expect(hrefsOf(hubOf(pages, 'ca-nl'))).toEqual([
      '/methodology/',
      '/ca-on/',
      '/ca-ab/',
      '/ca-bc/',
      '/ca-mb/',
      '/ca-sk/',
    ]);
  });

  it('throws, naming the province, when a hub-only province has no hub text', () => {
    expect(() => hubPages([], provinces, new Set(), ['ca-xx'])).toThrow(
      'Hubs: ca-xx has no hub text',
    );
  });

  it('throws, naming the province, when a listed province has no hub text', () => {
    expect(() => hubPages([], [...provinces, xland], new Set(), [])).toThrow(
      'Hubs: ca-xx has no hub text',
    );
  });

  it('links a form only when its page is in the published set', () => {
    const [page] = hubPages(
      [ontarioBuilt],
      provinces,
      new Set([formSlug('on428')]),
      [],
    );
    const items = (page?.sections ?? [])
      .flatMap((s) => s.blocks)
      .flatMap((b) => (b.kind === 'list' ? b.items : []));
    expect(items.find((i) => i.label.includes('ON428:'))?.href).toBe(
      '/forms/on428/',
    );
    expect(items.filter((i) => i.href !== undefined)).toHaveLength(1);
  });

  it('counts the other hubs as published, so every hub links the others', () => {
    const pages = hubPages([ontarioBuilt], provinces, new Set(), []);
    const row = pages[0]?.sections
      .flatMap((s) => s.blocks)
      .find((b): b is LinksBlock => b.kind === 'links' && b.layout === 'row');
    expect(row?.links.map((l) => l.href)).toEqual([
      '/methodology/',
      '/ca-ab/',
      '/ca-bc/',
      '/ca-mb/',
      '/ca-sk/',
      '/ca-nl/',
    ]);
  });

  it('is not given the slugs of the content pages as hubs', () => {
    const pages = hubPages(
      [],
      provinces,
      new Set(contentPages.map((p) => p.slug)),
      [],
    );
    expect(pages.map((p) => p.slug)).not.toContain('methodology');
  });
});

describe('hubChartBlocks', () => {
  const sweepUnit = readUnit(compute70000.unit) ?? strings.fallbackUnit;
  const sweepOf = (slug: string, points = 300): ProvinceSweep => ({
    slug,
    year: 2026,
    provisional: false,
    unit: sweepUnit,
    rateUnit: sweepUnit,
    points: Array.from({ length: points }, (_, i) => [
      String((i + 1) * 1000),
      '12345.67',
      '2345.67',
      '0.1234',
      '0.2965',
    ]),
  });

  it('gives each swept province a hub block holding every province', () => {
    const sweeps = [sweepOf('ca-on'), sweepOf('ca-ab')];
    const blocks = hubChartBlocks(sweeps);
    expect([...blocks.keys()]).toEqual(['ca-on', 'ca-ab']);
    const block = blocks.get('ca-on') ?? '';
    expect(block).toMatch(
      /^<script type="application\/json" id="hub-charts-data">/,
    );
    const text = /^<script[^>]*>(.*)<\/script>$/s.exec(block)?.[1] ?? '';
    expect(parseHubChartsData(text)?.provinces.map((p) => p.slug)).toEqual([
      'ca-on',
      'ca-ab',
    ]);
  });

  it('writes no block when nothing was swept', () => {
    expect(hubChartBlocks([]).size).toBe(0);
  });

  it('fails when the data would not pass the data guard', () => {
    const bad = { ...sweepOf('ca-on'), points: [] };
    expect(() => hubChartBlocks([bad])).toThrow('does not pass the data guard');
  });

  it('keeps six full provinces under the size cap', () => {
    const six = provinces.map((p) => sweepOf(p.slug));
    const block = hubChartBlocks(six).get('ca-on') ?? '';
    expect(block.length).toBeLessThan(MAX_HUB_CHARTS_CHARS);
  });

  it('fails when the block would pass the cap', () => {
    const big = provinces.map((p) => sweepOf(p.slug, 3000));
    expect(() => hubChartBlocks(big)).toThrow('Hubs: the chart data block is');
  });
});
