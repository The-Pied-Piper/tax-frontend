import { normalizeSiteUrl, robotsTxt, seo, sitemapXml } from './seo';

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
    expect(() => normalizeSiteUrl('aftertaxlens.com')).toThrow(
      /VITE_SITE_URL must be a site address/,
    );
  });

  it('rejects a path, because robots.txt and the sitemap sit at the site root', () => {
    expect(() => normalizeSiteUrl('https://example.com/tax/')).toThrow();
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

// The two hooks are called directly with a stand-in for Rollup's context.
function run(siteUrl: string | undefined) {
  const plugin = seo(siteUrl);
  const tags = (plugin.transformIndexHtml as () => unknown[])();
  const files: Record<string, string> = {};
  const context = {
    emitFile: (file: { fileName: string; source: string }) => {
      files[file.fileName] = file.source;
    },
  };
  (plugin.generateBundle as unknown as (this: typeof context) => void).call(
    context,
  );
  return { tags, files };
}

describe('seo plugin with a site URL', () => {
  const { tags, files } = run('https://aftertaxlens.com/');

  it('adds the canonical link and the absolute share tags', () => {
    expect(tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tag: 'link',
          attrs: { rel: 'canonical', href: 'https://aftertaxlens.com/' },
        }),
        expect.objectContaining({
          attrs: { property: 'og:url', content: 'https://aftertaxlens.com/' },
        }),
        expect.objectContaining({
          attrs: {
            property: 'og:image',
            content: 'https://aftertaxlens.com/share-card.png',
          },
        }),
        expect.objectContaining({
          attrs: {
            name: 'twitter:image',
            content: 'https://aftertaxlens.com/share-card.png',
          },
        }),
        expect.objectContaining({
          attrs: { property: 'og:image:width', content: '1200' },
        }),
      ]),
    );
  });

  it('writes robots.txt and sitemap.xml', () => {
    expect(Object.keys(files).sort()).toEqual(['robots.txt', 'sitemap.xml']);
    expect(files['robots.txt']).toContain(
      'Sitemap: https://aftertaxlens.com/sitemap.xml',
    );
  });
});

describe('seo plugin without a site URL', () => {
  const { tags, files } = run(undefined);

  it('adds no tags', () => {
    expect(tags).toEqual([]);
  });

  it('writes only a robots.txt without a sitemap line', () => {
    expect(Object.keys(files)).toEqual(['robots.txt']);
    expect(files['robots.txt']).not.toContain('Sitemap');
  });
});
