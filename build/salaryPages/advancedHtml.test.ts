import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { caOnAdapter } from '../../src/adapters/ca-on';
import { strings } from '../../src/strings';
import { compute70000 } from '../../src/test/syntheticPages';
import { template } from '../../src/test/generatedSite';
import { generateSalaryPages } from './generate';
import { renderSalaryApp } from './prerender';

// The advanced view's groups and lines are in the written page, folded in a
// real <details>, never in a CSS-hidden panel.
const baseUrl = 'https://api.test/api/v1';
const answer: ComputeTakeHomeCalculationResponse = compute70000;

const fakeFetch: typeof fetch = (input) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  return Promise.resolve(
    url === `${baseUrl}/jurisdictions`
      ? Response.json(jurisdictions)
      : Response.json(answer),
  );
};

const outDir = mkdtempSync(join(tmpdir(), 'salary-advanced-'));
let html = '';
let page: Document;
beforeAll(async () => {
  await generateSalaryPages({
    fetch: fakeFetch,
    baseUrl,
    provinces: [
      {
        code: 'CA-ON',
        slug: 'ca-on',
        year: 2026,
        from: 70000,
        to: 70000,
        step: 1,
      },
    ],
    outDir,
    template,
    render: renderSalaryApp,
  });
  html = readFileSync(join(outDir, 'ca-on', '70000', 'index.html'), 'utf8');
  page = new DOMParser().parseFromString(html, 'text/html');
});
afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

const groups = caOnAdapter.adapt(answer).advanced;

function fold(): Element {
  const summary = Array.from(page.querySelectorAll('summary')).find(
    (s) => s.textContent === strings.advanced.toggle,
  );
  const details = summary?.closest('details');
  if (!details) throw new Error('no advanced fold in the page');
  return details;
}

// The data block (a script) repeats the API trace, so it is cut out: only the
// markup a crawler reads without running JavaScript counts here.
function visibleText(text: string): string {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  doc.querySelectorAll('script').forEach((s) => {
    s.remove();
  });
  return doc.body.textContent;
}

describe('advanced view in the written CA-ON page', () => {
  it('has groups to check', () => {
    expect(groups.length).toBeGreaterThan(0);
  });

  it('wraps everything in one real details that is closed on load', () => {
    const details = fold();
    expect(details.tagName).toBe('DETAILS');
    expect(details.hasAttribute('open')).toBe(false);
    expect(details.querySelector('summary')?.textContent).toBe(
      strings.advanced.toggle,
    );
  });

  it('writes every form name and every line label inside that fold', () => {
    const text = fold().textContent;
    for (const group of groups) {
      expect(text).toContain(group.name);
      for (const line of group.lines) expect(text).toContain(line.label);
    }
  });

  it('writes every form name and line label in the page markup outside the data block', () => {
    const body = visibleText(html);
    for (const group of groups) {
      expect(body).toContain(group.name);
      for (const line of group.lines) expect(body).toContain(line.label);
    }
  });

  it('has one nested details per form, also closed', () => {
    const nested = Array.from(fold().querySelectorAll('details'));
    expect(nested).toHaveLength(groups.length);
    for (const d of nested) expect(d.hasAttribute('open')).toBe(false);
  });

  it('hides no group or line with display:none, visibility:hidden or the hidden attribute', () => {
    // (A line's own help bubble keeps the hidden attribute until its ? is pressed.)
    const details = fold();
    const shown = Array.from(details.querySelectorAll('summary, dl, dt, dd'));
    expect(shown.length).toBeGreaterThan(groups.length);
    for (const el of [details, ...shown]) {
      expect(el.closest('[hidden]')).toBeNull();
      expect(el.closest('[style]')).toBeNull();
    }
    expect(html).not.toMatch(/display:\s*none|visibility:\s*hidden/i);
  });

  it('does not render a checkbox for the advanced view', () => {
    expect(fold().querySelector('input[type="checkbox"]')).toBeNull();
  });
});
