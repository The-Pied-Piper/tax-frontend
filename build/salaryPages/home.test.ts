import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { SalaryIndexNav } from '../../src/components/SalaryIndexNav';
import { displayMoney } from '../../src/money/format';
import { parseSalaryIndex, SALARY_INDEX_ID } from '../../src/state/salaryIndex';
import { strings } from '../../src/strings';
import { tmpDirs, template } from '../../src/test/generatedSite';
import {
  indexUnit,
  ontarioIndex,
  twoProvinceIndex,
} from '../../src/test/salaryIndexData';
import { rewriteHome } from './home';
import { renderSalaryIndexNav } from './prerender';

// What the build writes into dist/index.html: the data block for React and the
// same nav as static HTML, so the home page links to every page without scripts.
const outDir = tmpDirs('salary-home');

async function home(index = ontarioIndex) {
  const dir = outDir();
  writeFileSync(join(dir, 'index.html'), template);
  await rewriteHome(dir, index, renderSalaryIndexNav);
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  return {
    dir,
    html,
    page: new DOMParser().parseFromString(html, 'text/html'),
  };
}

const popular = (page: Document) =>
  [...page.querySelectorAll('nav')].filter(
    (n) => n.getAttribute('aria-label') === 'Popular salaries',
  );

/** What a reader sees of a nav: its name, its headings, and each link's text and address. */
function shape(nav: Element) {
  return {
    label: nav.getAttribute('aria-label'),
    headings: [...nav.querySelectorAll('h2, h3')].map((h) => h.textContent),
    links: [...nav.querySelectorAll('a')].map((a) => [
      a.textContent,
      a.getAttribute('href'),
    ]),
  };
}

describe('rewriteHome (dist/index.html)', () => {
  it('names the data block the page reads', () => {
    expect(SALARY_INDEX_ID).toBe('salary-pages-index');
  });

  it('puts the index in a JSON data block that the guard accepts', async () => {
    const { page } = await home();
    const blocks = page.querySelectorAll('script#salary-pages-index');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.getAttribute('type')).toBe('application/json');
    expect(parseSalaryIndex(blocks[0]?.textContent ?? null)).toEqual(
      ontarioIndex,
    );
  });

  it('has a static Popular salaries nav at the end of #root main, with a link to every page', async () => {
    const { page } = await home();
    const navs = popular(page);
    expect(navs).toHaveLength(1);
    const nav = navs[0] as Element;
    expect(nav.closest('#root > main')).not.toBeNull();
    expect(nav.parentElement?.lastElementChild).toBe(nav);
    expect(
      [...nav.querySelectorAll('a')].map((a) => a.getAttribute('href')),
    ).toEqual(ontarioIndex.groups[0]?.pages.map((p) => p.href));
    expect(nav.querySelectorAll('a')).toHaveLength(25);
  });

  it('words each link as the salary in the province, and groups under the province name', async () => {
    const { page } = await home();
    const nav = popular(page)[0] as Element;
    expect(nav.textContent).toContain('Ontario');
    const first = nav.querySelector('a[href="/ca-on/75000/"]');
    expect(first?.textContent).toBe(
      strings.salaryIndex.link(
        displayMoney('75000', 'annually', indexUnit),
        'Ontario',
      ),
    );
  });

  it('keeps the rest of the home page as it was', async () => {
    const { html } = await home();
    const before = new DOMParser().parseFromString(template, 'text/html');
    const after = new DOMParser().parseFromString(html, 'text/html');
    expect(after.title).toBe(before.title);
    expect(after.querySelector('h1')?.textContent).toBe(
      before.querySelector('h1')?.textContent,
    );
    expect(after.querySelector('script[src="/src/main.tsx"]')).not.toBeNull();
    expect(after.querySelectorAll('main')).toHaveLength(1);
  });

  it('gives a second province its own group with no other change', async () => {
    const { page } = await home(twoProvinceIndex);
    const nav = popular(page)[0] as Element;
    expect(nav.querySelectorAll('a')).toHaveLength(28);
    expect(nav.querySelector('a[href="/ca-xx/15000/"]')).not.toBeNull();
    expect(nav.textContent).toContain('Xland');
  });

  it('writes nothing for an index with no groups', async () => {
    const dir = outDir();
    writeFileSync(join(dir, 'index.html'), template);
    await rewriteHome(dir, { groups: [] }, renderSalaryIndexNav);
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toBe(template);
  });

  it('is idempotent: a second call changes nothing', async () => {
    const { dir, html } = await home(twoProvinceIndex);
    await rewriteHome(dir, twoProvinceIndex, renderSalaryIndexNav);
    const again = readFileSync(join(dir, 'index.html'), 'utf8');
    expect(again).toBe(html);
    const page = new DOMParser().parseFromString(again, 'text/html');
    expect(page.querySelectorAll('script#salary-pages-index')).toHaveLength(1);
    expect(popular(page)).toHaveLength(1);
  });

  it('is the same nav that React mounts from the data block', async () => {
    const { page } = await home(twoProvinceIndex);
    const parsed = parseSalaryIndex(
      page.getElementById(SALARY_INDEX_ID)?.textContent ?? null,
    );
    expect(parsed).toEqual(twoProvinceIndex);
    render(createElement(SalaryIndexNav, { index: parsed ?? { groups: [] } }));
    const mounted = screen.getByRole('navigation', {
      name: 'Popular salaries',
    });
    expect(shape(popular(page)[0] as Element)).toEqual(shape(mounted));
  });
});
