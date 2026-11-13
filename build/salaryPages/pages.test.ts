import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { generateSalaryPages } from './generate';
import { pageMeta } from './pageMeta';
import { renderSalaryApp } from './prerender';
import { provinces } from './provinces';
import { duplicates, pageData, syntheticResponse } from './syntheticPages';

// Whole build: 25 Ontario pages from a fake API whose answer differs per salary
// (SYNTHETIC responses, see syntheticPages.ts), rendered by the real App.
const baseUrl = 'https://api.test/api/v1';
const template = readFileSync('index.html', 'utf8');

const fakeFetch: typeof fetch = (input, init) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  if (url === `${baseUrl}/jurisdictions`) {
    return Promise.resolve(Response.json(jurisdictions));
  }
  const body = JSON.parse(
    typeof init?.body === 'string' ? init.body : '{}',
  ) as {
    salary: string;
  };
  const n = salaries.find((s) => s.toString() === body.salary);
  if (n === undefined)
    return Promise.reject(new Error(`salary ${body.salary}`));
  return Promise.resolve(Response.json(syntheticResponse(n)));
};

const salaries = Array.from({ length: 25 }, (_, i) => 30000 + i * 5000);
const outDir = mkdtempSync(join(tmpdir(), 'salary-meta-'));
const pages = new Map<number, Document>();

beforeAll(async () => {
  await generateSalaryPages({
    fetch: fakeFetch,
    baseUrl,
    provinces,
    outDir,
    template,
    render: renderSalaryApp,
  });
  for (const n of salaries) {
    pages.set(
      n,
      new DOMParser().parseFromString(
        readFileSync(join(outDir, 'ca-on', n.toString(), 'index.html'), 'utf8'),
        'text/html',
      ),
    );
  }
});
afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

function pageOf(n: number): Document {
  const page = pages.get(n);
  if (!page) throw new Error(`no page written for ${n.toString()}`);
  return page;
}

function description(page: Document): string {
  return (
    page.querySelector('meta[name="description"]')?.getAttribute('content') ??
    ''
  );
}

describe('the 25 written Ontario pages', () => {
  it('each has its own title and description from pageMeta', () => {
    for (const n of salaries) {
      const expected = pageMeta(pageData(syntheticResponse(n), n.toString()));
      expect(pageOf(n).title).toBe(expected.title);
      expect(description(pageOf(n))).toBe(expected.description);
    }
  });

  it('have no duplicate title and no duplicate description', () => {
    expect(duplicates(salaries.map((n) => pageOf(n).title))).toEqual([]);
    expect(duplicates(salaries.map((n) => description(pageOf(n))))).toEqual([]);
  });

  it('stay under 60 and 160 characters, and have exactly one h1', () => {
    for (const n of salaries) {
      expect(pageOf(n).title.length).toBeLessThan(60);
      expect(description(pageOf(n)).length).toBeLessThan(160);
      expect(pageOf(n).querySelectorAll('h1')).toHaveLength(1);
    }
  });

  it("show the API's own take-home, total taken off and rates in the HTML", () => {
    for (const n of salaries) {
      const takeHome = syntheticResponse(n).take_home;
      const [whole = '', cents = ''] = takeHome.split('.');
      const grouped = whole.replace(/\B(?=(\d{3})+$)/g, ',');
      const text = pageOf(n).body.textContent;
      expect(text).toContain(`CA$${grouped}.${cents}`);
      expect(text).toContain('CA$16,213.75');
      expect(text).toContain('15.91%');
      expect(text).toContain('29.65%');
    }
  });

  it('show the CPP, EI and income tax lines of the response in the HTML', () => {
    const text = pageOf(70000).body.textContent;
    expect(text).toContain('Canada Pension Plan');
    expect(text).toContain('Employment Insurance');
    expect(text).toContain('Federal income tax');
    expect(text).toContain('Ontario income tax');
  });

  it('keep the h1 and the paragraph the same in the HTML as pageMeta says', () => {
    for (const n of salaries) {
      const expected = pageMeta(pageData(syntheticResponse(n), n.toString()));
      expect(pageOf(n).querySelector('h1')?.textContent).toBe(expected.heading);
      expect(pageOf(n).body.textContent).toContain(expected.paragraph);
    }
  });

  it('have no hidden text except the closed help bubbles of HelpTerm', () => {
    for (const n of salaries) {
      const page = pageOf(n);
      // HelpTerm's bubble: hidden, and named by the aria-controls of a closed "?" button.
      const bubbleIds = new Set(
        Array.from(
          page.querySelectorAll('button[aria-expanded="false"][aria-controls]'),
        ).map((b) => b.getAttribute('aria-controls')),
      );
      const hidden = Array.from(page.querySelectorAll('[hidden]'));
      expect(hidden.length).toBeGreaterThan(0);
      for (const el of hidden) {
        expect(bubbleIds.has(el.id)).toBe(true);
      }
      // aria-hidden is allowed only on decorations: empty, or the form's visible "$" sign.
      for (const el of page.querySelectorAll('[aria-hidden="true"]')) {
        expect(['', '$']).toContain(el.textContent.trim());
      }
      expect(page.querySelectorAll('noscript')).toHaveLength(0);
      expect(
        page.querySelectorAll(
          '[style*="display:none"], [style*="display: none"]',
        ),
      ).toHaveLength(0);
    }
  });
});
