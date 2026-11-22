import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  contentTemplate,
  siteUrl,
  tmpDirs,
} from '../../src/test/generatedSite';
import { HUB_CHARTS_DATA_ID } from '../../src/state/hubCharts';
import { PROVINCE_COMPARISON_SLOT_ID } from '../../src/state/hubChartSlots';
import { strings } from '../../src/strings';
import { sampleHubCharts, sampleSweeps } from '../../src/test/hubChartsData';
import { provinces } from '../salaryPages/provinces';
import { renderContentPage } from '../salaryPages/prerender';
import { generateContentPages } from './generate';
import { hubChartBlocks, hubPages } from './hubs';

// A written hub carries the whole comparison in its HTML, so a crawler that
// runs no script reads every province's figures at $70,000.
const outDir = tmpDirs('hub-comparison');
const names = strings.siteNav.provinceNames;

async function writeHubs(swept: typeof sampleSweeps) {
  const dir = outDir();
  const hubs = hubPages(
    [],
    provinces,
    new Set(),
    [],
    new Set(swept.map((sweep) => sweep.slug)),
  );
  await generateContentPages({
    outDir: dir,
    template: contentTemplate,
    pages: hubs,
    render: (spec) =>
      renderContentPage(spec, swept.length === 0 ? null : { provinces: swept }),
    siteUrl,
    dataBlocks: hubChartBlocks(swept),
  });
  return (slug: string) =>
    new DOMParser().parseFromString(
      readFileSync(join(dir, slug, 'index.html'), 'utf8'),
      'text/html',
    );
}

describe('a written hub with a sweep', () => {
  let page: Document;
  beforeAll(async () => {
    page = (await writeHubs(sampleSweeps))('ca-on');
  });

  it('has the heading, the intro and the slot with the hub province', () => {
    const slot = page.getElementById(PROVINCE_COMPARISON_SLOT_ID);
    expect(slot?.dataset.province).toBe('ca-on');
    expect(
      Array.from(page.querySelectorAll('h2')).map((h) => h.textContent),
    ).toContain(strings.hubCharts.comparison.heading);
    expect(page.body.textContent).toContain(strings.hubCharts.comparison.intro);
  });

  it('has every province at $70,000 in the page itself, bars and table', () => {
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
    expect(slot?.querySelectorAll('table tbody tr')).toHaveLength(6);
    expect(slot?.textContent).toContain(
      'Bars are for a $70,000 salary in 2026, from highest to lowest.',
    );
  });

  it('links each other province to its own hub, a page this build wrote', () => {
    const slot = page.getElementById(PROVINCE_COMPARISON_SLOT_ID);
    expect(
      Array.from(slot?.querySelectorAll('a') ?? []).map((a) =>
        a.getAttribute('href'),
      ),
    ).toEqual(['/ca-bc/', '/ca-ab/', '/ca-sk/', '/ca-mb/', '/ca-nl/']);
  });

  it('carries the data block the comparison is mounted from, once', () => {
    const blocks = page.querySelectorAll(`script#${HUB_CHARTS_DATA_ID}`);
    expect(blocks).toHaveLength(1);
    expect(JSON.parse(blocks[0]?.textContent ?? '')).toEqual(sampleHubCharts);
  });

  it('keeps the charts data out of the visible text', () => {
    const copy = new DOMParser().parseFromString(
      page.documentElement.outerHTML,
      'text/html',
    );
    copy.querySelectorAll('script').forEach((script) => {
      script.remove();
    });
    expect(copy.body.textContent).not.toContain('"provinces"');
  });
});

describe('a written hub with no sweep', () => {
  it('has no comparison, no slot and no data block, and no error', async () => {
    const read = await writeHubs([]);
    const page = read('ca-on');
    expect(page.getElementById(PROVINCE_COMPARISON_SLOT_ID)).toBeNull();
    expect(page.getElementById(HUB_CHARTS_DATA_ID)).toBeNull();
    expect(page.body.textContent).not.toContain(
      strings.hubCharts.comparison.heading,
    );
  });
});

describe('a written hub of a province the sweep left out', () => {
  it('shows no comparison and no bar for it', async () => {
    const [, ...rest] = sampleSweeps;
    const read = await writeHubs(rest);
    expect(
      read('ca-on').getElementById(PROVINCE_COMPARISON_SLOT_ID),
    ).toBeNull();
    const other = read('ca-ab');
    const bars = Array.from(
      other.querySelectorAll(`#${PROVINCE_COMPARISON_SLOT_ID} ol > li`),
    ).map((li) => li.textContent);
    expect(bars).toHaveLength(5);
    expect(bars.join('')).not.toContain(names['ca-on']);
  });
});
