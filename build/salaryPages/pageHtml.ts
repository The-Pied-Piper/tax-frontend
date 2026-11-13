import type { SalaryPageData } from '../../src/state/useTakeHome';
import { SALARY_PAGE_DATA_ID } from '../../src/state/salaryPageData';

/** JSON that cannot end its own script element or start a comment inside it. */
function safeJson(data: SalaryPageData): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
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
  return template
    .replace(root, (_m, open: string) => open + appHtml)
    .replace('</body>', () => `${block}\n  </body>`);
}
