import type { ContentPageSpec } from '../../src/state/contentPages';
import { pageShell } from '../salaryPages/pageHtml';

/**
 * The template with `#root` holding the rendered content page, its own title
 * and description, and its own canonical link and og:url (left as the template
 * has them when the address is null). A data block (a hub's chart data) goes at the end of the body when given; nothing is fetched. The
 * template's early theme script and page bundle stay, so the stored theme
 * shows before first paint and the bundle mounts the theme switch. A head
 * block, such as the breadcrumb's structured data, goes at the end of the head.
 */
export function buildContentPageHtml(
  template: string,
  appHtml: string,
  spec: ContentPageSpec,
  canonicalUrl: string | null,
  headBlock: string | null = null,
  dataBlockHtml: string | null = null,
): string {
  const page = pageShell(template, appHtml, spec, canonicalUrl, headBlock);
  return dataBlockHtml === null
    ? page
    : page.replace('</body>', () => `${dataBlockHtml}\n  </body>`);
}
