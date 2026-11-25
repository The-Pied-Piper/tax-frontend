import { fullHubCharts } from '../../src/test/hubNotesData';
import { ratesBlocks, ratesPages } from './rates';

describe('ratesPages', () => {
  it('writes one page at the province hub address plus tax-rates, under the hub', () => {
    const [page, ...rest] = ratesPages(new Set(['ca-on', 'ca-ab']));
    expect(rest).toEqual([]);
    expect(page?.slug).toBe('ca-on/tax-rates');
    expect(page?.heading).toBe(
      'Ontario marginal and average tax rate by salary, 2026',
    );
    expect(page?.trail).toEqual([{ label: 'Ontario', slug: 'ca-on' }]);
  });

  it('writes no page for a province with no sweep', () => {
    expect(ratesPages(new Set(['ca-ab']))).toEqual([]);
  });

  it('puts the finding and chart first, then the salaries, notes and tables', () => {
    const [page] = ratesPages(new Set(['ca-on']));
    expect(
      page?.sections.map((section) => section.blocks.map((b) => b.kind)),
    ).toEqual([
      ['ratesPart', 'ratesChart'],
      ['ratesPart'],
      ['ratesPart'],
      ['ratesPart'],
    ]);
  });

  it('gives each page the sweep block the hubs carry', () => {
    const pages = ratesPages(new Set(['ca-on']));
    const blocks = ratesBlocks(pages, fullHubCharts(['ca-on']).provinces);
    expect([...blocks.keys()]).toEqual(['ca-on/tax-rates']);
    expect(blocks.get('ca-on/tax-rates')).toContain('hub-charts-data');
    expect(ratesBlocks([], fullHubCharts().provinces).size).toBe(0);
  });
});
