import type { Plugin } from 'vite';

/**
 * SEO values that depend on the environment. Everything else (title,
 * description, share-card text) is plain text in index.html.
 *
 * `VITE_SITE_URL` is the public address of the site, for example
 * `https://aftertaxlens.com`. Unset (local development), the page gets no
 * canonical link and no absolute share-image address, and no sitemap is written.
 */
export const SHARE_IMAGE_PATH = '/share-card.png';

export function normalizeSiteUrl(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') return null;
  const url = new URL(trimmed);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(
      `VITE_SITE_URL must start with http:// or https://: ${trimmed}`,
    );
  }
  return url.origin + url.pathname.replace(/\/+$/, '');
}

export function robotsTxt(siteUrl: string | null): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
  return lines.join('\n') + '\n';
}

export function sitemapXml(siteUrl: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `  <url><loc>${siteUrl}/</loc></url>\n` +
    '</urlset>\n'
  );
}

export function seo(siteUrlValue: string | undefined): Plugin {
  const siteUrl = normalizeSiteUrl(siteUrlValue);
  return {
    name: 'seo',
    transformIndexHtml() {
      if (!siteUrl) return [];
      const image = `${siteUrl}${SHARE_IMAGE_PATH}`;
      return [
        {
          tag: 'link',
          attrs: { rel: 'canonical', href: `${siteUrl}/` },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { property: 'og:url', content: `${siteUrl}/` },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: image },
          injectTo: 'head',
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: image },
          injectTo: 'head',
        },
      ];
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: robotsTxt(siteUrl),
      });
      if (siteUrl) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: sitemapXml(siteUrl),
        });
      }
    },
  };
}
