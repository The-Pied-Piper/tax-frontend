import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  contentTemplate,
  siteUrl,
  tmpDirs,
} from '../../src/test/generatedSite';
import {
  HUB_CHARTS_DATA_ID,
  PROVINCE_COMPARISON_SLOT_ID,
} from '../../src/state/hubSlots';
import { COMPARE_SLUG } from '../../src/state/siteLinks';
import { strings } from '../../src/strings';
import { sampleHubCharts, sampleSweeps } from '../../src/test/comparisonData';
import { renderContentPage } from '../salaryPages/prerender';
import { compareBlock, comparePage } from './compare';
import { generateContentPages } from './generate';
import { hubChartBlocks } from './hubs';

// The compare page carries the whole comparison in its HTML, so a crawler that
// runs no script reads every province's figures at $70,000 and the table of every salary.
const outDir = tmpDirs('compare-page');
const names = strings.siteNav.provinceNames;

async function writePage(swept: typeof sampleSweeps) {
  const dir = outDir();
  const page = comparePage(swept);
  if (!page) return null;
  // The page links to hubs, which the build writes too; list them as trail-less pages here.
  const hubs = swept.map((sweep) => ({
    slug: sweep.slug,
    title: sweep.slug,
    description: sweep.slug,
    heading: sweep.slug,
    trail: [],
    sections: [],
  }));
  await generateContentPages({
    outDir: dir,
    template: contentTemplate,
    pages: [page, ...hubs],
    render: (spec) => renderContentPage(spec, { provinces: swept }),
    siteUrl,
    dataBlocks: compareBlock(page, hubChartBlocks(swept)),
  });
  return new DOMParser().parseFromString(
    readFileSync(join(dir, COMPARE_SLUG, 'index.html'), 'utf8'),
    'text/html',
  );
}

describe('the written compare page', () => {
  let page: Document;
  beforeAll(async () => {
    const written = await writePage(sampleSweeps);
    if (!written) throw new Error('no page');
    page = written;
  });

  it('has the year in its title, heading and description, and no province highlighted', () => {
    expect(page.title).toBe(
      'Compare take-home pay and tax across provinces, 2026',
    );
    expect(page.querySelector('h1')?.textContent).toBe(
      'Compare take-home pay and tax across provinces, 2026',
    );
    expect(
      page.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe(
      'Compare take-home pay, tax and contributions across provinces at a salary you choose. Estimates for 2026, for a single person whose only income is a salary.',
    );
    const slot = page.getElementById(PROVINCE_COMPARISON_SLOT_ID);
    expect(slot?.dataset.province).toBeUndefined();
    expect(slot?.querySelector('[aria-current]')).toBeNull();
  });

  it('says which provinces it covers, in the list order', () => {
    expect(page.body.textContent).toContain(
      `These are the provinces this site covers so far: ${names['ca-on']}, ${names['ca-ab']}, ${names['ca-bc']}, ${names['ca-mb']}, ${names['ca-sk']} and ${names['ca-nl']}.`,
    );
  });

  it('puts the covered-provinces line after the comparison, so the bars come first on a phone', () => {
    const slot = page.getElementById(PROVINCE_COMPARISON_SLOT_ID);
    const line = Array.from(page.querySelectorAll('p')).find((p) =>
      p.textContent.includes('the provinces this site covers'),
    );
    expect(slot).not.toBeNull();
    expect(line).toBeDefined();
    expect(
      slot && line
        ? slot.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING
        : 0,
    ).toBeTruthy();
  });

  it('has every province at $70,000 in the page itself, lowest tax and contributions first', () => {
    const slot = page.getElementById(PROVINCE_COMPARISON_SLOT_ID);
    const bars = Array.from(slot?.querySelectorAll('ol > li') ?? []).map(
      (li) => li.textContent,
    );
    expect(bars).toEqual([
      `${names['ca-bc']}$54,348.15`,
      `${names['ca-ab']}$54,107.20`,
      `${names['ca-on']}$53,786.25`,
      `${names['ca-sk']}$52,669.31`,
      `${names['ca-mb']}$51,899.32`,
      `${names['ca-nl']}$51,703.00`,
    ]);
  });

  it('has the table of every salary in the HTML, without script', () => {
    const slot = page.getElementById(PROVINCE_COMPARISON_SLOT_ID);
    // Two heading rows and a row for each regular salary of the sample.
    expect(slot?.querySelectorAll('table tr')).toHaveLength(2 + 8);
    expect(slot?.querySelector('table caption')?.textContent).toContain(
      'all 8 salaries behind the chart',
    );
    const row = Array.from(slot?.querySelectorAll('tbody tr') ?? []).find(
      (tr) => tr.querySelector('th')?.textContent === '$70,000',
    );
    expect(
      Array.from(row?.querySelectorAll('td') ?? []).map((td) => td.textContent),
    ).toHaveLength(sampleSweeps.length * 3);
  });

  it('links every province to its own hub, in the bars and in the list of provinces', () => {
    const slot = page.getElementById(PROVINCE_COMPARISON_SLOT_ID);
    expect(
      Array.from(slot?.querySelectorAll('ol a') ?? []).map((a) =>
        a.getAttribute('href'),
      ),
    ).toEqual([
      '/ca-bc/',
      '/ca-ab/',
      '/ca-on/',
      '/ca-sk/',
      '/ca-mb/',
      '/ca-nl/',
    ]);
    const nav = page.querySelector(
      `nav[aria-label="${strings.comparePage.linksHeading}"]`,
    );
    expect(
      Array.from(nav?.querySelectorAll('a') ?? []).map((a) =>
        a.getAttribute('href'),
      ),
    ).toEqual([
      '/ca-on/',
      '/ca-ab/',
      '/ca-bc/',
      '/ca-mb/',
      '/ca-sk/',
      '/ca-nl/',
    ]);
  });

  it('carries the data block the comparison is mounted from, once', () => {
    const blocks = page.querySelectorAll(`script#${HUB_CHARTS_DATA_ID}`);
    expect(blocks).toHaveLength(1);
    expect(JSON.parse(blocks[0]?.textContent ?? '')).toEqual(sampleHubCharts);
  });
});

describe('the compare page with no data block', () => {
  it('fails the build when its hubs have no block', () => {
    const page = comparePage(sampleSweeps);
    expect(() => compareBlock(page, new Map())).toThrow(
      'Compare: compare-provinces has no hub data block',
    );
  });
});

describe('the compare page with no sweep', () => {
  it('is not written at all', () => {
    expect(comparePage([])).toBeNull();
    expect(compareBlock(null, new Map()).size).toBe(0);
  });
});
