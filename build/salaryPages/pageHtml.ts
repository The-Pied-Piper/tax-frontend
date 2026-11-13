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

/** The template with `#root` holding the rendered page, plus the data block for React. */
export function buildPageHtml(
  template: string,
  appHtml: string,
  data: SalaryPageData,
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
  return tags
    .reduce((html, [key, text]) => withContent(html, key, text), head)
    .replace('</body>', () => `${block}\n  </body>`);
}
