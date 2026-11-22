import { readFileSync } from 'node:fs';
import { renderContentPage } from '../salaryPages/prerender';
import { hubPages } from './hubs';
import { contentTemplate as template } from '../../src/test/generatedSite';
import { plainSpec } from '../../src/test/contentPageData';
import { provinces } from '../salaryPages/provinces';
import { buildContentPageHtml } from './html';

// A stored choice must show before first paint on a built content page: the
// page loads the same early script as the calculator.
const html = buildContentPageHtml(
  template,
  renderContentPage(plainSpec),
  plainSpec,
  'https://aftertaxlens.com/plain-page/',
);
const page = new DOMParser().parseFromString(html, 'text/html');

// Each hub page is built the same way, so it carries the same early script and slot.
const hubs = hubPages([], provinces, new Set(), [], new Set()).map((spec) =>
  new DOMParser().parseFromString(
    buildContentPageHtml(
      template,
      renderContentPage(spec),
      spec,
      `https://aftertaxlens.com/${spec.slug}/`,
    ),
    'text/html',
  ),
);

/** Runs the page's own early scripts (the ones in <head> that are not modules) in the test document, as a browser would. */
function runHeadScripts() {
  for (const script of page.head.querySelectorAll('script[src]')) {
    if (script.getAttribute('type') === 'module') continue;
    const src = script.getAttribute('src') ?? '';
    const run = document.createElement('script');
    run.textContent = readFileSync(`public${src}`, 'utf8');
    document.head.append(run);
    run.remove();
  }
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe('theme carry-over on a built content page', () => {
  it('loads /theme-init.js in the head', () => {
    const srcs = [...page.head.querySelectorAll('script[src]')].map((s) =>
      s.getAttribute('src'),
    );
    expect(srcs).toContain('/theme-init.js');
  });

  it('makes <html data-theme> dark when "dark" is stored', () => {
    localStorage.setItem('theme', 'dark');
    runHeadScripts();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('makes <html data-theme> light when "light" is stored', () => {
    localStorage.setItem('theme', 'light');
    runHeadScripts();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('sets nothing when nothing is stored, so the device decides', () => {
    runHeadScripts();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('has the slot for the Light/Dark switch in the rendered page', () => {
    const slot = page.querySelector('#root #content-theme-toggle');
    expect(slot).not.toBeNull();
    expect(page.querySelectorAll('#content-theme-toggle')).toHaveLength(1);
  });
});

describe('theme carry-over on a built hub page', () => {
  it('has one hub per listed province to check', () => {
    expect(hubs).toHaveLength(provinces.length);
  });

  it('loads /theme-init.js in the head and has the one slot in the page', () => {
    for (const hubPage of hubs) {
      const srcs = [...hubPage.head.querySelectorAll('script[src]')].map((s) =>
        s.getAttribute('src'),
      );
      expect(srcs).toContain('/theme-init.js');
      expect(
        hubPage.querySelectorAll('#root #content-theme-toggle'),
      ).toHaveLength(1);
    }
  });

  it('makes <html data-theme> dark when "dark" is stored, running the early script of a hub', () => {
    localStorage.setItem('theme', 'dark');
    for (const script of hubs[0]?.head.querySelectorAll('script[src]') ?? []) {
      if (script.getAttribute('type') === 'module') continue;
      const run = document.createElement('script');
      run.textContent = readFileSync(
        `public${script.getAttribute('src') ?? ''}`,
        'utf8',
      );
      document.head.append(run);
      run.remove();
    }
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
