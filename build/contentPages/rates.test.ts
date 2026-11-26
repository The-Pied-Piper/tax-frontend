import { fullHubCharts } from '../../src/test/hubNotesData';
import { hubChartBlocks } from './hubs';
import { FOOTER_PROVINCE_SLUGS } from '../../src/state/siteLinks';
import { LINK_ORDER, ratesBlocks, ratesPages } from './rates';

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

  it('puts the finding first, then the chart, what is counted, the notes, how to read the salaries and the tables', () => {
    const [page] = ratesPages(new Set(['ca-on']));
    expect(
      page?.sections.map((section) => section.blocks.map((b) => b.kind)),
    ).toEqual([
      ['ratesPart', 'ratesPart'],
      ['ratesChart'],
      ['ratesPart'],
      ['ratesPart'],
      ['ratesPart'],
      ['ratesPart'],
    ]);
    // Only the first section has no heading.
    expect(
      page?.sections.map((section) => section.heading === undefined),
    ).toEqual([true, false, false, false, false, false]);
  });

  it('orders the links of the other provinces from exactly the footer provinces', () => {
    expect([...LINK_ORDER].sort()).toEqual([...FOOTER_PROVINCE_SLUGS].sort());
  });

  it('links the other live provinces in order, never the page itself, and nothing when there are none', () => {
    const pages = ratesPages(new Set(['ca-on', 'ca-nl', 'ca-qc', 'ca-ab']));
    const linksOf = (slug: string) => {
      const section = pages
        .find((page) => page.slug === slug)
        ?.sections.find(
          (entry) => entry.heading === 'Tax rates by salary in other provinces',
        );
      const block = section?.blocks[0];
      return block?.kind === 'links' ? block.links : undefined;
    };
    expect(linksOf('ca-on/tax-rates')).toEqual([
      { label: 'Québec tax rates by salary', href: '/ca-qc/tax-rates/' },
      { label: 'Alberta tax rates by salary', href: '/ca-ab/tax-rates/' },
      {
        label: 'Newfoundland and Labrador tax rates by salary',
        href: '/ca-nl/tax-rates/',
      },
    ]);
    expect(linksOf('ca-qc/tax-rates')?.map((link) => link.href)).not.toContain(
      '/ca-qc/tax-rates/',
    );
    const [alone] = ratesPages(new Set(['ca-on']));
    expect(
      alone?.sections.some((entry) =>
        entry.heading?.includes('other provinces'),
      ),
    ).toBe(false);
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
