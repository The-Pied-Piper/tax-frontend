import { normalizeSiteUrl, robotsTxt, sitemapXml } from './vite-plugin-seo';

describe('normalizeSiteUrl', () => {
  it('is null when unset or blank', () => {
    expect(normalizeSiteUrl(undefined)).toBeNull();
    expect(normalizeSiteUrl('  ')).toBeNull();
  });

  it('drops trailing slashes', () => {
    expect(normalizeSiteUrl('https://aftertaxlens.com/')).toBe(
      'https://aftertaxlens.com',
    );
  });

  it('rejects other schemes and non-URLs', () => {
    expect(() => normalizeSiteUrl('ftp://example.com')).toThrow();
    expect(() => normalizeSiteUrl('aftertaxlens.com')).toThrow();
  });
});

describe('robots.txt and sitemap.xml', () => {
  it('allows everything and names the sitemap when the site URL is known', () => {
    expect(robotsTxt('https://aftertaxlens.com')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://aftertaxlens.com/sitemap.xml\n',
    );
  });

  it('allows everything without a sitemap line when the site URL is unknown', () => {
    expect(robotsTxt(null)).toBe('User-agent: *\nAllow: /\n');
  });

  it('lists the one URL', () => {
    expect(sitemapXml('https://aftertaxlens.com')).toContain(
      '<loc>https://aftertaxlens.com/</loc>',
    );
  });
});
