import { existsSync, readFileSync } from 'node:fs';
import { strings } from '../src/strings';

const html = readFileSync('index.html', 'utf8');
const page = new DOMParser().parseFromString(html, 'text/html');

function text(selector: string): string {
  return (page.querySelector(selector)?.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function publicBytes(href: string): Buffer {
  const file = `public${href}`;
  expect(existsSync(file), `${file} should exist`).toBe(true);
  return readFileSync(file);
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
    expect(text('#root main h1')).toBe(strings.title);
    expect(text('#root main .lede')).toBe(strings.intro);
  });

  it('links the .ico, the SVG and the apple touch icon', () => {
    const ico = page.querySelector('link[rel="icon"][href="/favicon.ico"]');
    expect(ico?.getAttribute('sizes')).toBe('48x48');
    const svg = page.querySelector('link[rel="icon"][href="/favicon.svg"]');
    expect(svg?.getAttribute('type')).toBe('image/svg+xml');
    expect(
      page.querySelector(
        'link[rel="apple-touch-icon"][href="/apple-touch-icon.png"]',
      ),
    ).not.toBeNull();
  });

  it('uses root-relative icon hrefs that exist under public/', () => {
    const links = [
      ...page.querySelectorAll(
        'link[rel~="icon"], link[rel="apple-touch-icon"]',
      ),
    ];
    expect(links).toHaveLength(3);
    for (const link of links) {
      const href = link.getAttribute('href') ?? '';
      expect(href).toMatch(/^\/[^/]/);
      expect(publicBytes(href).length).toBeGreaterThan(0);
    }
  });

  it('has a favicon.ico holding 16, 32 and 48 px images', () => {
    const bytes = publicBytes('/favicon.ico');
    expect([...bytes.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
    expect(bytes.readUInt16LE(4)).toBe(3);
    const sizes = [0, 1, 2].map((i) => [
      bytes.readUInt8(6 + 16 * i),
      bytes.readUInt8(7 + 16 * i),
    ]);
    expect(sizes).toEqual([
      [16, 16],
      [32, 32],
      [48, 48],
    ]);
  });

  it('has a 180x180 opaque PNG apple touch icon', () => {
    const bytes = publicBytes('/apple-touch-icon.png');
    expect([...bytes.subarray(0, 8)]).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(bytes.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect(bytes.readUInt32BE(16)).toBe(180);
    expect(bytes.readUInt32BE(20)).toBe(180);
    expect(bytes.readUInt8(25)).toBe(2); // colour type 2: RGB, no alpha
  });

  it('has a 64x64 viewBox SVG favicon without text', () => {
    const svg = new DOMParser().parseFromString(
      publicBytes('/favicon.svg').toString('utf8'),
      'image/svg+xml',
    );
    expect(svg.querySelector('parsererror')).toBeNull();
    expect(svg.documentElement.localName).toBe('svg');
    expect(svg.documentElement.getAttribute('viewBox')).toBe('0 0 64 64');
    expect(svg.getElementsByTagName('text')).toHaveLength(0);
  });

  it('has no web manifest', () => {
    expect(page.querySelector('link[rel="manifest"]')).toBeNull();
  });
});
