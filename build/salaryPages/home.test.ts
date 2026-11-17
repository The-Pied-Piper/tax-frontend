import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { SiteFooter } from '../../src/components/SiteFooter';
import { strings } from '../../src/strings';
import { tmpDirs, template } from '../../src/test/generatedSite';
import { rewriteHomeFooter } from './home';
import { renderSiteFooter } from './prerender';

// What the build writes into dist/index.html: the site footer as static HTML,
// so the home page links to the methodology page and the provinces without scripts.
const outDir = tmpDirs('salary-home');

async function home() {
  const dir = outDir();
  writeFileSync(join(dir, 'index.html'), template);
  await rewriteHomeFooter(dir, renderSiteFooter());
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  return {
    dir,
    html,
    page: new DOMParser().parseFromString(html, 'text/html'),
  };
}

const hrefs = (root: ParentNode) =>
  [...root.querySelectorAll('a')].map((a) => a.getAttribute('href'));

describe('rewriteHomeFooter (dist/index.html)', () => {
  it('has the footer after the static main, inside #root, with the site links and the disclaimer', async () => {
    const { page } = await home();
    const footer = page.querySelector('#root > footer');
    expect(footer).not.toBeNull();
    expect(footer?.previousElementSibling?.tagName).toBe('MAIN');
    expect(hrefs(footer as Element)).toEqual([
      '/methodology/',
      '/ca-on/',
      '/ca-ab/',
      '/ca-bc/',
    ]);
    expect(footer?.textContent).toContain(strings.footer);
  });

  it('carries no salary list: the home page no longer links to salary pages', async () => {
    const { page, html } = await home();
    expect(page.querySelector('details')).toBeNull();
    expect(html).not.toContain('Popular salaries');
    expect(html).not.toContain('salary-pages-index');
    expect(page.querySelectorAll('a[href^="/ca-on/"]')).toHaveLength(1);
  });

  it('is the same footer that React mounts', async () => {
    const { page } = await home();
    render(createElement(SiteFooter));
    const mounted = screen.getByRole('navigation', {
      name: strings.siteNav.label,
    });
    const nav = page.querySelector(
      `nav[aria-label="${strings.siteNav.label}"]`,
    );
    expect(hrefs(nav as Element)).toEqual(hrefs(mounted));
    expect(nav?.textContent).toBe(mounted.textContent);
  });

  it('keeps the rest of the home page as it was', async () => {
    const { page } = await home();
    const before = new DOMParser().parseFromString(template, 'text/html');
    expect(page.title).toBe(before.title);
    expect(page.querySelector('h1')?.textContent).toBe(
      before.querySelector('h1')?.textContent,
    );
    expect(page.querySelector('script[src="/src/main.tsx"]')).not.toBeNull();
    expect(page.querySelectorAll('main')).toHaveLength(1);
  });

  it('is idempotent: a second call changes nothing', async () => {
    const { dir, html } = await home();
    await rewriteHomeFooter(dir, renderSiteFooter());
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toBe(html);
  });

  it('fails on a home page with no main in #root', async () => {
    const dir = outDir();
    writeFileSync(join(dir, 'index.html'), '<html><body></body></html>');
    await expect(rewriteHomeFooter(dir, '<footer></footer>')).rejects.toThrow(
      'no main',
    );
  });
});
