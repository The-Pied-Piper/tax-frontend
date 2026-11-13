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

// Only meaningful next to og:image, so they are added with it.
const IMAGE_DETAILS = [
  ['og:image:width', '1200'],
  ['og:image:height', '630'],
  [
    'og:image:alt',
    'Take-home pay estimate. An estimate of what you keep from a yearly salary.',
  ],
] as const;

export function normalizeSiteUrl(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') return null;
  const message = `VITE_SITE_URL must be a site address such as https://example.com (http or https, no path): ${trimmed}`;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(message);
  }
  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.pathname.replace(/\/+$/, '') !== ''
  ) {
    throw new Error(message);
  }
  return url.origin;
}

export function robotsTxt(siteUrl: string | null): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
  return lines.join('\n') + '\n';
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** The calculator plus the given page paths (each with a leading slash). */
export function sitemapXml(siteUrl: string, paths: string[] = []): string {
  const urls = ['/', ...paths].map(
    (path) => `  <url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>\n`,
  );
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join('') +
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
        ...IMAGE_DETAILS.map(([property, content]) => ({
          tag: 'meta',
          attrs: { property, content },
          injectTo: 'head' as const,
        })),
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
