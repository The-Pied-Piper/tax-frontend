import { strings } from '../strings';
import { provinceHubs } from './provinceHubs';
import { provinceLinks } from './salaryPageLinks';

// provinceLinks(slug, provinceName, published, '70000') builds the `hub` and
// `learnMore` fields of a pre-built salary page's links (#150).
const methodology = { label: 'How we calculate', href: '/methodology/' };

describe('provinceLinks(slug, name, published)', () => {
  it('has the hub, the methodology page and the form page, in that order', () => {
    const { hub, learnMore } = provinceLinks(
      'ca-on',
      'Ontario',
      new Set(['methodology', 'forms/on428']),
      '70000',
    );
    expect(hub).toEqual({ label: 'Ontario', href: '/ca-on/' });
    expect(learnMore).toEqual([
      { label: strings.formPage.hub('Ontario'), href: '/ca-on/' },
      { label: strings.siteNav.methodology, href: '/methodology/' },
      {
        label: expect.stringContaining('Form ON428') as string,
        href: '/forms/on428/',
      },
    ]);
  });

  it('names the form the way the hub does, as "What is ...?"', () => {
    const name = provinceHubs.find((h) => h.slug === 'ca-on')?.own[0]?.name;
    const { learnMore } = provinceLinks(
      'ca-on',
      'Ontario',
      new Set(['forms/on428']),
      '70000',
    );
    expect(learnMore[2]?.label).toBe(`What is ${name ?? ''}?`);
  });

  it('leaves the form link out when forms/on428 is not published', () => {
    const { learnMore } = provinceLinks('ca-on', 'Ontario', new Set(), '70000');
    expect(learnMore.map((l) => l.href)).toEqual(['/ca-on/', '/methodology/']);
    expect(learnMore[1]).toEqual(methodology);
  });

  it('keeps the methodology and hub links even when nothing else is published', () => {
    const { hub, learnMore } = provinceLinks(
      'ca-ab',
      'Alberta',
      new Set(),
      '70000',
    );
    expect(hub.href).toBe('/ca-ab/');
    expect(learnMore).toHaveLength(2);
  });

  it('ignores published forms of another province', () => {
    const { learnMore } = provinceLinks(
      'ca-ab',
      'Alberta',
      new Set(['methodology', 'forms/on428']),
      '70000',
    );
    expect(learnMore.map((l) => l.href)).toEqual(['/ca-ab/', '/methodology/']);
  });

  it.each([
    ['ca-on', 'Ontario', 'on428'],
    ['ca-ab', 'Alberta', 'ab428'],
    ['ca-bc', 'British Columbia', 'bc428'],
  ])(
    'links the first own form of %s once it is published',
    (slug, name, id) => {
      const { learnMore } = provinceLinks(
        slug,
        name,
        new Set([`forms/${id}`]),
        '70000',
      );
      expect(learnMore.map((l) => l.href)).toEqual([
        `/${slug}/`,
        '/methodology/',
        `/forms/${id}/`,
      ]);
    },
  );

  it('does not link the second form of a province (on428-a)', () => {
    const { learnMore } = provinceLinks(
      'ca-on',
      'Ontario',
      new Set(['forms/on428-a']),
      '70000',
    );
    expect(learnMore).toHaveLength(2);
  });

  it('writes absolute site paths with a single leading slash', () => {
    const { hub, learnMore } = provinceLinks(
      'ca-on',
      'Ontario',
      new Set(['methodology', 'forms/on428']),
      '70000',
    );
    for (const { href } of [hub, ...learnMore]) {
      expect(href).toMatch(/^\/(?!\/)[a-z0-9/-]*\/$/);
    }
  });

  it('links the rates page with the salary in its address, once the build writes it', () => {
    const { rates } = provinceLinks(
      'ca-on',
      'Ontario',
      new Set(['ca-on/tax-rates']),
      '90000',
    );
    expect(rates).toEqual({
      label: 'Ontario tax rates by salary',
      href: '/ca-on/tax-rates/?salary=90000',
    });
  });

  it('leaves the rates link out when no rates page is written for the province', () => {
    expect(
      provinceLinks('ca-on', 'Ontario', new Set(), '90000').rates,
    ).toBeNull();
    expect(
      provinceLinks('ca-ab', 'Alberta', new Set(['ca-on/tax-rates']), '90000')
        .rates,
    ).toBeNull();
  });

  it('uses the slug it is given, so a second province needs nothing else', () => {
    const { hub, learnMore } = provinceLinks(
      'ca-xx',
      'Xland',
      new Set(),
      '70000',
    );
    expect(hub).toEqual({ label: 'Xland', href: '/ca-xx/' });
    expect(learnMore[0]).toEqual({
      label: 'Xland forms and salary pages',
      href: '/ca-xx/',
    });
  });
});
