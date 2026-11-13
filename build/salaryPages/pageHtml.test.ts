import { readFileSync } from 'node:fs';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import computeFixture from '../../src/api/fixtures/compute-on-2026-70000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { buildPageHtml } from './pageHtml';
import { pageMeta } from './pageMeta';

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
