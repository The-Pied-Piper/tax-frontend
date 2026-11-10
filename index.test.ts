import { readFileSync } from 'node:fs';
import { strings } from './src/strings';

const html = readFileSync('index.html', 'utf8');
const page = new DOMParser().parseFromString(html, 'text/html');

function text(selector: string): string {
  return (page.querySelector(selector)?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function meta(selector: string): string {
  return page.querySelector(selector)?.getAttribute('content') ?? '';
}

describe('index.html (what a crawler sees without JavaScript)', () => {
  it('has a title under 60 characters', () => {
    expect(page.title.length).toBeGreaterThan(0);
    expect(page.title.length).toBeLessThan(60);
  });

  it('has a description under 160 characters in estimate wording', () => {
    const description = meta('meta[name="description"]');
    expect(description.length).toBeGreaterThan(0);
    expect(description.length).toBeLessThan(160);
    expect(description.toLowerCase()).toContain('estimate');
    expect(html.toLowerCase()).not.toContain('checked against cra');
  });

  it('is English and has theme colours for both themes', () => {
    expect(page.documentElement.lang).toBe('en');
    expect(page.querySelectorAll('meta[name="theme-color"]')).toHaveLength(2);
  });

  it('has Open Graph and Twitter card tags that agree with title and description', () => {
    expect(meta('meta[property="og:type"]')).toBe('website');
    expect(meta('meta[property="og:title"]')).toBe(page.title);
    expect(meta('meta[name="twitter:title"]')).toBe(page.title);
    const description = meta('meta[name="description"]');
    expect(meta('meta[property="og:description"]')).toBe(description);
    expect(meta('meta[name="twitter:description"]')).toBe(description);
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image');
  });

  it('leaves canonical and absolute share addresses to the build (VITE_SITE_URL)', () => {
    expect(page.querySelector('link[rel="canonical"]')).toBeNull();
    expect(page.querySelector('meta[property="og:image"]')).toBeNull();
  });

  it('has the heading and intro as static text matching strings.ts', () => {
    expect(text('#root > main > h1')).toBe(strings.title);
    expect(text('#root > main > p')).toBe(strings.intro);
  });
});
