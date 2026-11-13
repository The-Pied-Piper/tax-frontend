import { SALARY_PAGE_DATA_ID } from '../../src/state/salaryPageData';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { pageUrl } from './address';
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

/**
 * Gives the page its own canonical link and og:url, replacing the calculator's
 * that the site build put in the template.
 */
function withAddress(html: string, address: string): string {
  const url = escapeHtml(address);
  return html
    .replace(/<link\s[^>]*rel="canonical"[^>]*>\s*/g, '')
    .replace(/<meta\s[^>]*property="og:url"[^>]*>\s*/g, '')
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
  origin: string | null = null,
  slug: string = data.jurisdictionCode.toLowerCase(),
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
    origin === null
      ? described
      : withAddress(described, pageUrl(origin, slug, data.salary));
  return addressed.replace('</body>', () => `${block}\n  </body>`);
}
