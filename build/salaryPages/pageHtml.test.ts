import { readFileSync } from 'node:fs';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import computeFixture from '../../src/api/fixtures/compute-on-2026-70000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { parseSalaryIndex } from '../../src/state/salaryIndex';
import { ontarioGroup, twoProvinceIndex } from '../../src/test/salaryIndexData';
import { buildPageHtml, dataBlock } from './pageHtml';
import { pageMeta } from './pageMeta';
import { pageUrl } from './address';

const compute = computeFixture as ComputeTakeHomeCalculationResponse;
const template = readFileSync('index.html', 'utf8');

const data: SalaryPageData = {
  jurisdictions: jurisdictions.jurisdictions,
  response: compute,
  jurisdictionCode: 'CA-ON',
  year: 2026,
  salary: '70000',
};

function parse(html: string) {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('buildPageHtml', () => {
  const html = buildPageHtml(
    template,
    '<main><p>rendered answer 53,786.25</p></main>',
    data,
  );
  const page = parse(html);

  it('puts the rendered page in #root in place of the old content', () => {
    const root = page.getElementById('root');
    expect(root?.textContent).toContain('rendered answer 53,786.25');
    expect(root?.textContent).not.toContain('What will I take home?');
  });

  it('keeps the rest of the template, including the bundle script', () => {
    expect(page.querySelector('script[type="module"]')).not.toBeNull();
    expect(page.querySelector('meta[name="viewport"]')).not.toBeNull();
    expect(page.querySelector('meta[name="theme-color"]')).not.toBeNull();
  });

  it('carries the data as a JSON block, not executable script', () => {
    const block = page.getElementById('salary-page-data');
    expect(block?.getAttribute('type')).toBe('application/json');
    expect(JSON.parse(block?.textContent ?? '')).toEqual(data);
  });

  it('keeps money as text in the data block', () => {
    expect(html).toContain('"take_home":"53786.25"');
  });

  it('cannot be broken out of by text inside the data', () => {
    const tricky = buildPageHtml(template, '<main></main>', {
      ...data,
      response: { ...compute, salary: '</script><b id="x">' },
    });
    expect(parse(tricky).getElementById('x')).toBeNull();
  });
});

function content(page: Document, selector: string): string | null {
  return page.querySelector(selector)?.getAttribute('content') ?? null;
}

describe('buildPageHtml: the head of each page', () => {
  const meta = pageMeta(data);
  const page = parse(buildPageHtml(template, '<main></main>', data));

  it("has the page's own title, replacing the template's", () => {
    expect(page.title).toBe(meta.title);
    expect(page.title).not.toBe(parse(template).title);
    expect(page.querySelectorAll('title')).toHaveLength(1);
  });

  it("has the page's own meta description, once", () => {
    expect(content(page, 'meta[name="description"]')).toBe(meta.description);
    expect(page.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  });

  it('has the same text for Open Graph and Twitter', () => {
    expect(content(page, 'meta[property="og:title"]')).toBe(meta.title);
    expect(content(page, 'meta[property="og:description"]')).toBe(
      meta.description,
    );
    expect(content(page, 'meta[name="twitter:title"]')).toBe(meta.title);
    expect(content(page, 'meta[name="twitter:description"]')).toBe(
      meta.description,
    );
  });

  it('leaves og:url, canonical and the other meta tags as the template has them (#81 owns them)', () => {
    const before = parse(template);
    for (const selector of [
      'meta[property="og:url"]',
      'meta[property="og:type"]',
      'meta[name="twitter:card"]',
      'link[rel="canonical"]',
    ]) {
      expect(page.querySelectorAll(selector).length).toBe(
        before.querySelectorAll(selector).length,
      );
      expect(page.querySelector(selector)?.outerHTML).toBe(
        before.querySelector(selector)?.outerHTML,
      );
    }
  });

  it('escapes the text, so a place name cannot break out of an attribute or the title', () => {
    const nasty = {
      ...data,
      jurisdictions: [
        {
          code: 'CA-ON',
          name: 'On"tario </title><b id="x">&amp;',
          years: [{ year: 2026, provisional: true }],
        },
      ],
    };
    const html = buildPageHtml(template, '<main></main>', nasty);
    const out = parse(html);
    expect(out.getElementById('x')).toBeNull();
    const expected = pageMeta(nasty);
    expect(out.title).toBe(expected.title);
    expect(content(out, 'meta[name="description"]')).toBe(expected.description);
    expect(content(out, 'meta[property="og:title"]')).toBe(expected.title);
    expect(content(out, 'meta[name="twitter:description"]')).toBe(
      expected.description,
    );
  });
});

describe('buildPageHtml with the page address (#81)', () => {
  const origin = 'https://aftertaxlens.com';
  const address = pageUrl(origin, 'ca-on', data.salary);
  // What dist/index.html looks like when the site build has run with VITE_SITE_URL.
  const withTags = (canonical: string, ogUrl: string) =>
    template.replace('</head>', `${canonical}${ogUrl}</head>`);
  const plain = withTags(
    `<link rel="canonical" href="${origin}/" />`,
    `<meta property="og:url" content="${origin}/" />`,
  );

  function built(html: string, url: string | null = address) {
    return parse(buildPageHtml(html, '<main></main>', data, url));
  }

  function expectOwnAddress(out: Document, url = address) {
    const canonical = out.querySelectorAll('link[rel~="canonical" i]');
    expect(canonical).toHaveLength(1);
    expect(canonical[0]?.getAttribute('href')).toBe(url);
    expect(out.querySelectorAll('meta[property="og:url"]')).toHaveLength(1);
    expect(content(out, 'meta[property="og:url"]')).toBe(url);
  }

  it('adds one canonical and one og:url when the template has none', () => {
    expectOwnAddress(built(template));
  });

  it('replaces the calculator canonical and og:url the site build put in the template', () => {
    expectOwnAddress(built(plain));
  });

  it('uses the address it is given, whatever it is', () => {
    expectOwnAddress(
      built(template, 'https://aftertaxlens.com/ca-on/30000/'),
      'https://aftertaxlens.com/ca-on/30000/',
    );
  });

  it('escapes the address in the attributes', () => {
    const out = built(template, 'https://aftertaxlens.com/a"b/');
    expect(
      out.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://aftertaxlens.com/a"b/');
    expect(out.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  it.each([
    ['single-quoted canonical', `<link rel='canonical' href='${origin}/'>`],
    ['uppercase REL', `<link REL="canonical" HREF="${origin}/">`],
    [
      'rel with two values',
      `<link rel="alternate canonical" href="${origin}/">`,
    ],
  ])('still ends with exactly one canonical for a %s', (_name, tag) => {
    expectOwnAddress(
      built(withTags(tag, `<meta property="og:url" content="${origin}/" />`)),
    );
  });

  it.each([
    ['single-quoted og:url', `<meta property='og:url' content='${origin}/'>`],
    ['uppercase PROPERTY', `<meta PROPERTY="og:url" CONTENT="${origin}/">`],
  ])('still ends with exactly one og:url for a %s', (_name, tag) => {
    expectOwnAddress(
      built(withTags(`<link rel="canonical" href="${origin}/" />`, tag)),
    );
  });

  it('leaves the template as it was with no address: no canonical added, none changed', () => {
    const out = built(template, null);
    expect(out.querySelector('link[rel="canonical"]')).toBeNull();
    expect(out.querySelector('meta[property="og:url"]')).toBeNull();
    const kept = built(plain, null);
    expect(
      kept.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(`${origin}/`);
    expect(content(kept, 'meta[property="og:url"]')).toBe(`${origin}/`);
  });
});

describe('dataBlock', () => {
  it('is a JSON script element with the id, holding the value', () => {
    const block = parse(`<body>${dataBlock('some-id', { a: 1 })}</body>`);
    const el = block.getElementById('some-id');
    expect(el?.tagName).toBe('SCRIPT');
    expect(el?.getAttribute('type')).toBe('application/json');
    expect(JSON.parse(el?.textContent ?? '')).toEqual({ a: 1 });
  });

  it('escapes every "<" so the text cannot end the element or open a comment', () => {
    const text = dataBlock('x', { name: '</script><!--<b>' });
    expect(
      text.slice(text.indexOf('>') + 1, text.lastIndexOf('</script>')),
    ).not.toContain('<');
    expect(
      JSON.parse(
        parse(`<body>${text}</body>`).getElementById('x')?.textContent ?? '',
      ),
    ).toEqual({ name: '</script><!--<b>' });
  });
});

describe('buildPageHtml: the salary-pages-index block', () => {
  const body = '<main></main>';

  it('writes the index once, next to the page data, and it parses back', () => {
    const page = parse(
      buildPageHtml(template, body, data, null, twoProvinceIndex),
    );
    expect(page.querySelectorAll('script#salary-pages-index')).toHaveLength(1);
    expect(page.querySelectorAll('script#salary-page-data')).toHaveLength(1);
    expect(
      parseSalaryIndex(
        page.getElementById('salary-pages-index')?.textContent ?? null,
      ),
    ).toEqual(twoProvinceIndex);
  });

  it('escapes it like the page data', () => {
    const hostile = {
      groups: [{ ...ontarioGroup, name: '</script><b id="x">' }],
    };
    const html = buildPageHtml(template, body, data, null, hostile);
    expect(parse(html).getElementById('x')).toBeNull();
  });

  it('is absent when no index is given, as before', () => {
    for (const html of [
      buildPageHtml(template, body, data),
      buildPageHtml(template, body, data, null, null),
    ]) {
      expect(html).not.toContain('salary-pages-index');
    }
  });
});
