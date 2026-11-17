import {
  federalForms,
  provinceHubs,
  type ProvinceHub,
} from '../../src/state/provinceHubs';
import type { ContentBlock } from '../../src/state/contentPages';
import { isContentSlug } from '../../src/state/siteLinks';
import { DESCRIPTION_LIMIT, TITLE_LIMIT } from '../salaryPages/limits';
import { provinces } from '../salaryPages/provinces';
import type { SalaryIndex } from '../salaryPages/salaryIndex';
import { indexUnit, ontarioGroup } from '../../src/test/salaryIndexData';
import { hubPages } from './hubs';

const index: SalaryIndex = {
  groups: [
    ontarioGroup,
    {
      ...ontarioGroup,
      code: 'CA-AB',
      name: 'Alberta',
      pages: [{ salary: '30000', href: '/ca-ab/30000/' }],
    },
  ],
};

function build(overrides: Partial<Parameters<typeof hubPages>[0]> = {}) {
  return hubPages({
    provinces,
    hubs: provinceHubs,
    index,
    published: ['methodology'],
    ...overrides,
  });
}

function page(slug: string, overrides = {}) {
  const found = build(overrides).find((p) => p.slug === slug);
  if (!found) throw new Error(`no hub ${slug}`);
  return found;
}

function blocksOf(slug: string, heading: string, overrides = {}) {
  return (
    page(slug, overrides).sections.find((s) => s.heading === heading)?.blocks ??
    []
  );
}

const lists = (blocks: ContentBlock[]) =>
  blocks.flatMap((b) => (b.kind === 'list' ? [b.items] : []));

describe('hubPages', () => {
  it('writes one page per province with hub text, in the order of the province list, at its slug', () => {
    expect(build().map((p) => p.slug)).toEqual(['ca-on', 'ca-ab', 'ca-bc']);
    expect(page('ca-on').heading).toBe('Ontario: forms and take-home examples');
    expect(page('ca-bc').heading).toBe(
      'British Columbia: forms and take-home examples',
    );
    for (const hub of build()) expect(hub.trail).toEqual([]);
  });

  it('skips a province with no hub text and a hub text with no province', () => {
    expect(
      build({ hubs: [provinceHubs[0] as ProvinceHub] }).map((p) => p.slug),
    ).toEqual(['ca-on']);
    expect(build({ provinces: [] })).toEqual([]);
  });

  it('keeps titles and descriptions inside the search limits and names the place', () => {
    for (const hub of build()) {
      expect(hub.title.length).toBeLessThan(TITLE_LIMIT);
      expect(hub.description.length).toBeLessThan(DESCRIPTION_LIMIT);
      expect(hub.title).toContain(hub.heading.split(':')[0]);
    }
  });

  it('opens with the plain words on how take-home is worked out', () => {
    const [first] = page('ca-on').sections;
    expect(first?.heading).toBe('How your Ontario take-home is worked out');
    expect(first?.paragraphs.join(' ')).toContain('Canada Pension Plan');
    expect(first?.paragraphs.join(' ')).toContain('Employment Insurance');
    expect(page('ca-ab').sections[0]?.paragraphs.join(' ')).toContain(
      'partly to the federal government and partly to Alberta.',
    );
  });

  it('lists the province forms, then the federal forms', () => {
    const [own, federal] = lists(blocksOf('ca-on', 'The forms we follow'));
    expect(own?.map((i) => i.label)).toEqual([
      'Form ON428: Ontario Tax',
      'Schedule ON428-A: LIFT credit',
    ]);
    expect(federal?.map((i) => i.label)).toEqual(
      federalForms.map((f) => f.name),
    );
    expect(
      lists(blocksOf('ca-bc', 'The forms we follow'))[0]?.map((i) => i.label),
    ).toEqual([
      'Form BC428: British Columbia Tax',
      'Form BC479: British Columbia credits',
    ]);
    expect(
      lists(blocksOf('ca-ab', 'The forms we follow'))[0]?.map((i) => i.label),
    ).toEqual(['Form AB428: Alberta Tax']);
  });

  it('lists every form without a link while no form page is listed', () => {
    for (const slug of ['ca-on', 'ca-ab', 'ca-bc']) {
      for (const items of lists(blocksOf(slug, 'The forms we follow'))) {
        for (const item of items) {
          expect(item.href, item.label).toBeUndefined();
          expect(item.text, item.label).toBeTruthy();
        }
      }
    }
  });

  it('links a form only once its page is listed, and never a form whose page is not', () => {
    const published = ['methodology', 'forms/on428', 'forms/t4'];
    const items = lists(
      blocksOf('ca-on', 'The forms we follow', { published }),
    ).flat();
    const linked = items.filter((i) => i.href !== undefined);
    expect(linked.map((i) => [i.label, i.href])).toEqual([
      ['Form ON428: Ontario Tax', '/forms/on428/'],
      ['T4 slip', '/forms/t4/'],
    ]);
    expect(items.filter((i) => i.href === undefined)).toHaveLength(
      items.length - 2,
    );
  });

  it('links to every salary page of the province, with dollar labels, and to no other', () => {
    const [grid] = blocksOf('ca-on', 'Take-home pay by salary');
    expect(grid?.kind).toBe('links');
    if (grid?.kind !== 'links') return;
    expect(grid.layout).toBe('grid');
    expect(grid.links).toHaveLength(25);
    expect(grid.links[0]).toEqual({
      label: '$30,000',
      href: '/ca-on/30000/',
    });
    expect(grid.links.at(-1)).toEqual({
      label: '$150,000',
      href: '/ca-on/150000/',
    });
    expect(grid.links.every((l) => l.href.startsWith('/ca-on/'))).toBe(true);
    expect(indexUnit.name).not.toBe('CA$');
    const alberta = blocksOf('ca-ab', 'Take-home pay by salary')[0];
    expect(alberta?.kind === 'links' && alberta.links).toEqual([
      { label: '$30,000', href: '/ca-ab/30000/' },
    ]);
  });

  it('has no salary section for a province with no pages written', () => {
    const headings = page('ca-bc').sections.map((s) => s.heading);
    expect(headings).not.toContain('Take-home pay by salary');
    expect(headings).toEqual([
      'How your British Columbia take-home is worked out',
      'The forms we follow',
      'More pages',
    ]);
    expect(
      page('ca-on', { index: { groups: [] } }).sections.map((s) => s.heading),
    ).not.toContain('Take-home pay by salary');
  });

  it('ends with the methodology page, the other provinces and the calculator', () => {
    const [more] = blocksOf('ca-on', 'More pages');
    expect(more?.kind === 'links' && more.links).toEqual([
      { label: 'How we calculate', href: '/methodology/' },
      { label: 'Alberta', href: '/ca-ab/' },
      { label: 'British Columbia', href: '/ca-bc/' },
      { label: 'Calculator', href: '/' },
    ]);
  });

  it('leaves out the methodology link when that page is not listed', () => {
    const [more] = blocksOf('ca-ab', 'More pages', { published: [] });
    expect(more?.kind === 'links' && more.links.map((l) => l.href)).toEqual([
      '/ca-on/',
      '/ca-bc/',
      '/',
    ]);
  });

  it('refuses a province with no place name', () => {
    expect(() => build({ names: {} })).toThrow('no name for ca-on');
  });

  it('never names a proprietary or third-party calculator, and says nothing about checking against CRA', () => {
    const text = JSON.stringify(build({ published: [] })).toLowerCase();
    for (const word of [
      'taxtips',
      'checked against',
      'calculator from',
      'turbotax',
      'canada only',
    ]) {
      expect(text, word).not.toContain(word);
    }
  });
});

describe('the hub text', () => {
  it('has one entry for each province of the build, with the same slug', () => {
    expect(provinceHubs.map((h) => h.slug)).toEqual(
      provinces.map((p) => p.slug),
    );
  });

  it('gives every form a valid form-page slug, listed once across the whole site', () => {
    const slugs = [
      ...federalForms,
      ...provinceHubs.flatMap((h) => h.forms),
    ].map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(isContentSlug(slug), slug).toBe(true);
      expect(slug.startsWith('forms/'), slug).toBe(true);
    }
  });

  it('gives every form a name and a short plain explanation', () => {
    for (const form of [
      ...federalForms,
      ...provinceHubs.flatMap((h) => h.forms),
    ]) {
      expect(form.name.length).toBeGreaterThan(0);
      expect(form.line.endsWith('.')).toBe(true);
      expect(form.line.length, form.name).toBeLessThan(100);
    }
  });
});
