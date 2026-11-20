import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  contentFile,
  contentPath,
  isContentSlug,
} from '../../src/state/siteLinks';

/** The page at an old address: it sends the reader to the new one, and tells search engines the move is permanent and to drop the old address. */
export function movedPageHtml(target: string): string {
  const href = contentPath(target);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page has moved</title>
    <meta name="robots" content="noindex" />
    <meta http-equiv="refresh" content="0; url=${href}" />
    <link rel="canonical" href="${href}" />
  </head>
  <body>
    <p>This page has moved to <a href="${href}">${href}</a>.</p>
  </body>
</html>
`;
}

/**
 * Writes dist/<old>/index.html for each moved page. Throws before writing when
 * an address is not a slug, points at itself or at another moved page, or
 * points at a page that was not written. Returns the files written.
 */
export async function generateMovedPages(options: {
  outDir: string;
  moved: Readonly<Record<string, string>>;
  /** The slugs of the pages that were written. */
  written: ReadonlySet<string>;
}): Promise<string[]> {
  const { outDir, moved, written } = options;
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
    const path = contentFile(from);
    const file = join(outDir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, movedPageHtml(to));
    files.push(path);
  }
  return files;
}
