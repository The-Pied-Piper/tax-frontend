import { readFileSync } from 'node:fs';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import computeFixture from '../../src/api/fixtures/compute-on-2026-70000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { buildPageHtml } from './pageHtml';

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
    expect(page.title).toBe(parse(template).title);
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
