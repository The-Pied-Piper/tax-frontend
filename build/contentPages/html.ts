import type { ContentPageSpec } from '../../src/state/contentPages';
import { pageShell } from '../salaryPages/pageHtml';

/**
 * The template with `#root` holding the rendered content page, its own title
 * and description, and its own canonical link and og:url (left as the template
 * has them when the address is null). No data block: nothing is fetched. The
 * template's early theme script and page bundle stay, so the stored theme
 * shows before first paint and the bundle mounts the theme switch.
 */
export function buildContentPageHtml(
  template: string,
  appHtml: string,
  spec: ContentPageSpec,
  canonicalUrl: string | null,
): string {
  return pageShell(template, appHtml, spec, canonicalUrl);
}
