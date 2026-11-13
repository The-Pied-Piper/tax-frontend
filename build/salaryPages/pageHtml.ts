import { SALARY_PAGE_DATA_ID } from '../../src/state/salaryPageData';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { pageMeta } from './pageMeta';

/** JSON that cannot end its own script element or start a comment inside it. */
function safeJson(data: SalaryPageData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Sets the content of the one meta tag with this name or property. */
function withContent(html: string, key: string, text: string): string {
  const tag = new RegExp(
    `(<meta\\s+(?:name|property)="${key}"[^>]*?\\scontent=")[^"]*(")`,
  );
  if (!tag.test(html)) throw new Error(`index.html has no ${key} meta tag`);
  return html.replace(
    tag,
    (_m, open: string, close: string) => open + escapeHtml(text) + close,
  );
}

// A whole tag, quoted attribute values included (they may contain ">").
const LINK_TAG = /<link\b(?:[^>"']|"[^"]*"|'[^']*')*>\s*/gi;
const META_TAG = /<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>\s*/gi;

/** The words of an attribute of a tag, lower-cased; none when it has no such attribute. */
function attributeWords(tag: string, name: string): string[] {
  const found = new RegExp(
    `\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    'i',
  ).exec(tag);
  const value = found?.[1] ?? found?.[2] ?? found?.[3] ?? '';
  return value.toLowerCase().split(/\s+/);
}

/**
 * Gives the page its own canonical link and og:url: every canonical link and
 * og:url tag the template has (the calculator's, from the site build) is
 * removed and one of each is added.
 */
function withAddress(html: string, address: string): string {
  const url = escapeHtml(address);
  return html
    .replace(LINK_TAG, (tag) =>
      attributeWords(tag, 'rel').includes('canonical') ? '' : tag,
    )
    .replace(META_TAG, (tag) =>
      attributeWords(tag, 'property').includes('og:url') ? '' : tag,
    )
    .replace(
      '</head>',
      () =>
        `<link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />\n  </head>`,
    );
}

/** The template with `#root` holding the rendered page, plus the data block for React. */
export function buildPageHtml(
  template: string,
  appHtml: string,
  data: SalaryPageData,
  canonicalUrl: string | null = null,
): string {
  const block = `<script type="application/json" id="${SALARY_PAGE_DATA_ID}">${safeJson(data)}</script>`;
  // #root ends at the </div> that is followed by a script or the end of the body.
  const root = /(<div id="root">)[\s\S]*?(?=<\/div>\s*(?:<script|<\/body>))/;
  if (!root.test(template)) throw new Error('index.html has no #root element');
  const meta = pageMeta(data);
  const withRoot = template.replace(root, (_m, open: string) => open + appHtml);
  if (!/<title>[\s\S]*?<\/title>/.test(withRoot)) {
    throw new Error('index.html has no title element');
  }
  const head = withRoot.replace(
    /<title>[\s\S]*?<\/title>/,
    () => `<title>${escapeHtml(meta.title)}</title>`,
  );
  const tags: [string, string][] = [
    ['description', meta.description],
    ['og:title', meta.title],
    ['og:description', meta.description],
    ['twitter:title', meta.title],
    ['twitter:description', meta.description],
  ];
  const described = tags.reduce(
    (html, [key, text]) => withContent(html, key, text),
    head,
  );
  const addressed =
    canonicalUrl === null ? described : withAddress(described, canonicalUrl);
  return addressed.replace('</body>', () => `${block}\n  </body>`);
}
