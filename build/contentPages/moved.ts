import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { paragraph, type ContentPageSpec } from '../../src/state/contentPages';
import {
  contentFile,
  contentPath,
  isContentSlug,
} from '../../src/state/siteLinks';
import { withoutAddress } from '../salaryPages/pageHtml';
import { buildContentPageHtml } from './html';

export type MovedOptions = {
  outDir: string;
  /** The built content template. */
  template: string;
  /** The real ContentPage as a string for one page. */
  render: (spec: ContentPageSpec) => string;
  /** Old slug to the slug it moved to. */
  moved: Readonly<Record<string, string>>;
  /** The slugs of the pages that were written. */
  written: ReadonlySet<string>;
  /** The normalized site origin; null leaves the canonical link out. */
  siteUrl: string | null;
};

/** The page at an old address: it says where the page went and links to it. */
function movedSpec(from: string, to: string): ContentPageSpec {
  return {
    slug: from,
    title: 'This page has moved',
    description: 'This page has moved to a new address on this site.',
    heading: 'This page has moved',
    trail: [],
    sections: [
      {
        heading: 'Where it went',
        blocks: [
          paragraph(
            'Go to the ',
            { label: 'new page', href: contentPath(to) },
            '.',
          ),
        ],
      },
    ],
  };
}

/**
 * Writes dist/<old>/index.html for each moved page: it sends the reader on at
 * once, tells search engines the new address is the page and to leave the old
 * one out (as the not-found page does), and is never in the sitemap. Throws
 * before writing when an address is not a slug, is also a listed page, or
 * points at a page that was not written. Returns the files written.
 */
export async function generateMovedPages(
  options: MovedOptions,
): Promise<string[]> {
  const { outDir, template, render, moved, written, siteUrl } = options;
  const entries = Object.entries(moved);
  for (const [from, to] of entries) {
    if (!isContentSlug(from) || !isContentSlug(to)) {
      throw new Error(`Moved pages: ${from} to ${to} is not a valid slug`);
    }
    if (written.has(from)) {
      throw new Error(`Moved pages: ${from} is also a listed page`);
    }
    if (!written.has(to)) {
      throw new Error(
        `Moved pages: ${from} points at ${to}, which is not written`,
      );
    }
  }
  const files: string[] = [];
  for (const [from, to] of entries) {
    const spec = movedSpec(from, to);
    const html = withoutAddress(
      buildContentPageHtml(
        template,
        render(spec),
        spec,
        siteUrl === null ? null : `${siteUrl}${contentPath(to)}`,
      ),
    );
    if (!html.includes('</head>')) {
      throw new Error('The template has no </head>');
    }
    const refresh = `<meta http-equiv="refresh" content="0; url=${contentPath(to)}" />`;
    const canonical =
      siteUrl === null
        ? ''
        : `\n  <link rel="canonical" href="${siteUrl}${contentPath(to)}" />`;
    const page = html.replace(
      '</head>',
      () =>
        `<meta name="robots" content="noindex" />\n  ${refresh}${canonical}\n  </head>`,
    );
    const path = contentFile(from);
    const file = join(outDir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, page);
    files.push(path);
  }
  return files;
}
