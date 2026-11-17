import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ContentPageSpec } from '../../src/state/contentPages';
import { NOT_FOUND_FILE } from '../../src/state/siteLinks';
import { withoutAddress } from '../salaryPages/pageHtml';
import { buildContentPageHtml } from './html';

export type NotFoundOptions = {
  outDir: string;
  /** The built content template. */
  template: string;
  /** The real ContentPage as a string for one page. */
  render: (spec: ContentPageSpec) => string;
  spec: ContentPageSpec;
};

/**
 * Writes the page for an address with no page to the top of the output
 * folder: no address of its own, and marked so search engines leave it out.
 * Returns the file name.
 */
export async function generateNotFoundPage({
  outDir,
  template,
  render,
  spec,
}: NotFoundOptions): Promise<string> {
  const html = withoutAddress(
    buildContentPageHtml(template, render(spec), spec, null),
  );
  if (!html.includes('</head>')) {
    throw new Error('The template has no </head>');
  }
  const page = html.replace(
    '</head>',
    () => '<meta name="robots" content="noindex" />\n  </head>',
  );
  await writeFile(join(outDir, NOT_FOUND_FILE), page);
  return NOT_FOUND_FILE;
}
