import { readFileSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { ContentPage } from '../../src/components/ContentPage';
import { plainSpec, sampleSpec } from '../../src/test/contentPageData';
import { buildContentPageHtml } from './html';

const template = readFileSync('content.html', 'utf8');
const canonical = 'https://aftertaxlens.com/sample-page/';

function parse(html: string) {
  return new DOMParser().parseFromString(html, 'text/html');
}

function meta(page: Document, key: string): string | null {
  return (
    page
      .querySelector(`meta[name="${key}"], meta[property="${key}"]`)
      ?.getAttribute('content') ?? null
  );
}

describe('buildContentPageHtml', () => {
  const appHtml = '<main><h1>rendered heading 4711</h1></main>';
  const html = buildContentPageHtml(template, appHtml, sampleSpec, canonical);
  const page = parse(html);

  it('puts the rendered page in #root in place of the old content', () => {
    const root = page.getElementById('root');
    expect(root?.textContent).toContain('rendered heading 4711');
    expect(root?.textContent).not.toContain('What will I take home?');
  });

  it('gives the page its own title and description everywhere', () => {
    expect(page.title).toBe(sampleSpec.title);
    expect(meta(page, 'description')).toBe(sampleSpec.description);
    expect(meta(page, 'og:title')).toBe(sampleSpec.title);
    expect(meta(page, 'og:description')).toBe(sampleSpec.description);
    expect(meta(page, 'twitter:title')).toBe(sampleSpec.title);
    expect(meta(page, 'twitter:description')).toBe(sampleSpec.description);
  });

  it('has its own canonical link and og:url, once each', () => {
    const links = page.querySelectorAll('link[rel="canonical"]');
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute('href')).toBe(canonical);
    const urls = page.querySelectorAll('meta[property="og:url"]');
    expect(urls).toHaveLength(1);
    expect(urls[0]?.getAttribute('content')).toBe(canonical);
  });

  it('replaces the canonical and og:url a template already has', () => {
    const withOld = template.replace(
      '</head>',
      '<link rel="canonical" href="https://aftertaxlens.com/" />\n<meta property="og:url" content="https://aftertaxlens.com/" /></head>',
    );
    const built = parse(
      buildContentPageHtml(withOld, appHtml, sampleSpec, canonical),
    );
    expect(built.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(
      built.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(canonical);
    expect(built.querySelectorAll('meta[property="og:url"]')).toHaveLength(1);
  });

  it('leaves canonical and og:url as the template has them when the address is null', () => {
    const built = parse(
      buildContentPageHtml(template, appHtml, sampleSpec, null),
    );
    expect(built.querySelector('link[rel="canonical"]')).toBeNull();
    expect(built.querySelector('meta[property="og:url"]')).toBeNull();
    expect(built.title).toBe(sampleSpec.title);
  });

  it('escapes quotes, ampersands and angle brackets in the title and description', () => {
    const tricky = {
      ...plainSpec,
      title: 'Tom & "Jerry" <b>',
      description: 'A "quoted" & <tagged> line.',
    };
    const built = parse(
      buildContentPageHtml(template, appHtml, tricky, canonical),
    );
    expect(built.title).toBe(tricky.title);
    expect(meta(built, 'description')).toBe(tricky.description);
    expect(meta(built, 'og:title')).toBe(tricky.title);
    expect(built.querySelector('b')).toBeNull();
  });

  it('loads the early theme script before the page bundle', () => {
    const scripts = [...page.querySelectorAll('script[src]')];
    const srcs = scripts.map((s) => s.getAttribute('src'));
    expect(srcs).toContain('/theme-init.js');
    expect(srcs).toContain('/src/contentMain.tsx');
    expect(srcs.indexOf('/theme-init.js')).toBeLessThan(
      srcs.indexOf('/src/contentMain.tsx'),
    );
  });

  it('has no salary data block and no link index', () => {
    expect(page.getElementById('salary-page-data')).toBeNull();
    expect(page.getElementById('salary-index')).toBeNull();
    expect(html).not.toContain('application/json');
  });

  it('keeps the rest of the template', () => {
    expect(page.querySelector('meta[name="viewport"]')).not.toBeNull();
    expect(page.querySelector('link[rel="icon"]')).not.toBeNull();
  });

  it('works on the page the real ContentPage renders, slot included', () => {
    const real = parse(
      buildContentPageHtml(
        template,
        renderToString(createElement(ContentPage, sampleSpec)),
        sampleSpec,
        canonical,
      ),
    );
    expect(real.querySelector('#root #content-theme-toggle')).not.toBeNull();
    expect(real.querySelector('#root h1')?.textContent).toBe(
      sampleSpec.heading,
    );
  });
});

describe('buildContentPageHtml with a head block', () => {
  const block = '<script type="application/ld+json">{"a":1}</script>';

  it('puts the block at the end of the head', () => {
    const out = parse(
      buildContentPageHtml(
        template,
        '<main></main>',
        sampleSpec,
        canonical,
        block,
      ),
    );
    expect(out.head.lastElementChild?.outerHTML).toBe(block);
  });

  it('adds nothing when there is no block', () => {
    const out = parse(
      buildContentPageHtml(template, '<main></main>', sampleSpec, canonical),
    );
    expect(out.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
});
