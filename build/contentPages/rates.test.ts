import { fullHubCharts } from '../../src/test/hubNotesData';
import { hubChartBlocks } from './hubs';
import { ratesBlocks, ratesPages } from './rates';

describe('ratesPages', () => {
  it('writes one page at the province hub address plus tax-rates, under the hub', () => {
    const [page, alberta, newfoundland, ...rest] = ratesPages(
      new Set(['ca-on', 'ca-ab', 'ca-nl']),
    );
    expect(rest).toEqual([]);
    expect(alberta?.slug).toBe('ca-ab/tax-rates');
    expect(alberta?.heading).toBe(
      'Alberta marginal and average tax rate by salary, 2026',
    );
    expect(newfoundland?.slug).toBe('ca-nl/tax-rates');
    expect(newfoundland?.heading).toBe(
      'Newfoundland and Labrador marginal and average tax rate by salary, 2026',
    );
    expect(page?.slug).toBe('ca-on/tax-rates');
    expect(page?.heading).toBe(
      'Ontario marginal and average tax rate by salary, 2026',
    );
    expect(page?.trail).toEqual([{ label: 'Ontario', slug: 'ca-on' }]);
  });

  it('writes no page for a province with no sweep', () => {
    expect(ratesPages(new Set(['ca-sk']))).toEqual([]);
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
    const hubBlocks = hubChartBlocks(fullHubCharts(['ca-on']).provinces);
    const blocks = ratesBlocks(pages, hubBlocks);
    expect([...blocks.keys()]).toEqual(['ca-on/tax-rates']);
    expect(blocks.get('ca-on/tax-rates')).toBe(hubBlocks.get('ca-on'));
    expect(ratesBlocks([], hubBlocks).size).toBe(0);
  });

  it('fails for a page whose province has no hub block', () => {
    const pages = ratesPages(new Set(['ca-on']));
    expect(() => ratesBlocks(pages, new Map())).toThrow(/no hub data block/);
  });
});
