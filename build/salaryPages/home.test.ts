import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { SiteFooter } from '../../src/components/SiteFooter';
import { FOOTER_PROVINCE_SLUGS } from '../../src/state/siteLinks';
import { strings } from '../../src/strings';
import { tmpDirs, template } from '../../src/test/generatedSite';
import { rewriteHome } from './home';
import { renderSiteFooter } from './prerender';

// What the build writes into dist/index.html: the real footer as static HTML,
// so the home page links to the methodology page and the province pages
// without scripts.
const outDir = tmpDirs('salary-home');

async function home() {
  const dir = outDir();
  writeFileSync(join(dir, 'index.html'), template);
  await rewriteHome(dir, renderSiteFooter);
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  return {
    dir,
    html,
    page: new DOMParser().parseFromString(html, 'text/html'),
  };
}

const hrefs = (root: ParentNode) =>
  [...root.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));

describe('rewriteHome (dist/index.html)', () => {
  it('links the methodology page and the four hubs in the static html', async () => {
    const { page } = await home();
    expect(page.querySelector('nav a[href="/methodology/"]')).not.toBeNull();
    for (const slug of FOOTER_PROVINCE_SLUGS) {
      expect(
        page.querySelector(`nav a[href="/${slug}/"]`),
        slug,
      ).not.toBeNull();
    }
    expect(hrefs(page)).toEqual([
      '/methodology/',
      '/ca-on/',
      '/ca-ab/',
      '/ca-bc/',
      '/ca-mb/',
    ]);
  });

  it('has the footer inside #root after the main, with the disclaimer', async () => {
    const { page } = await home();
    const footer = page.querySelector('#root > footer');
    expect(footer).not.toBeNull();
    expect(footer?.previousElementSibling?.tagName).toBe('MAIN');
    expect(footer?.textContent).toContain(strings.footer);
    expect(page.querySelectorAll('footer')).toHaveLength(1);
  });

  it('has no Popular salaries list and no salary links or data block', async () => {
    const { html, page } = await home();
    expect(html).not.toContain('Popular salaries');
    expect(page.querySelector('details')).toBeNull();
    expect(page.querySelector('script[type="application/json"]')).toBeNull();
    expect(page.querySelectorAll('a[href^="/ca-on/"]')).toHaveLength(1);
  });

  it('is the same footer that React draws', async () => {
    const { page } = await home();
    const { container } = render(createElement(SiteFooter));
    const pairs = (root: ParentNode) =>
      [...root.querySelectorAll('a')].map((a) => [
        a.textContent,
        a.getAttribute('href'),
      ]);
    expect(pairs(page.querySelector('#root > footer') as Element)).toEqual(
      pairs(container),
    );
    expect(page.querySelector('#root > footer')?.outerHTML).toBe(
      container.querySelector('footer')?.outerHTML,
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
    expect(after.querySelector('main')?.outerHTML).toBe(
      before.querySelector('main')?.outerHTML,
    );
    expect(after.querySelector('script[src="/src/main.tsx"]')).not.toBeNull();
    expect(after.querySelectorAll('main')).toHaveLength(1);
  });

  it('is idempotent: a second call leaves exactly one footer and the same bytes', async () => {
    const { dir, html } = await home();
    await rewriteHome(dir, renderSiteFooter);
    const again = readFileSync(join(dir, 'index.html'), 'utf8');
    expect(again).toBe(html);
    const page = new DOMParser().parseFromString(again, 'text/html');
    expect(page.querySelectorAll('footer')).toHaveLength(1);
    expect(page.querySelectorAll('nav a[href="/methodology/"]')).toHaveLength(
      1,
    );
  });

  it('writes whatever footer it is given, once, even on a repeat call', async () => {
    const dir = outDir();
    writeFileSync(join(dir, 'index.html'), template);
    const footer = () => '<footer class="page-footer">stand-in</footer>';
    await rewriteHome(dir, footer);
    await rewriteHome(dir, footer);
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    expect(html.match(/stand-in/g)).toHaveLength(1);
  });

  it('throws when index.html has no main in #root', async () => {
    const dir = outDir();
    writeFileSync(join(dir, 'index.html'), '<html><body></body></html>');
    await expect(rewriteHome(dir, renderSiteFooter)).rejects.toThrow(/main/);
  });
});
