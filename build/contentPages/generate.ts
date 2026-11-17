import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type {
  ContentBlock,
  ContentPageSpec,
} from '../../src/state/contentPages';
import {
  contentFile,
  contentPath,
  isContentSlug,
} from '../../src/state/siteLinks';
import { DESCRIPTION_LIMIT, TITLE_LIMIT } from '../salaryPages/limits';
import { buildContentPageHtml } from './html';

export type ContentOptions = {
  outDir: string;
  /** The built index.html. */
  template: string;
  pages: ContentPageSpec[];
  /** The real ContentPage as a string for one page. */
  render: (spec: ContentPageSpec) => string;
  /** The normalized site origin; null leaves canonical and og:url as the template has them. */
  siteUrl: string | null;
};

/** An address on this site: one slash first, then no second slash, as in `/ca-on/75000/`. */
function isSitePath(href: string): boolean {
  return /^\/(?!\/)\S*$/.test(href);
}

function checkBlock(slug: string, block: ContentBlock): void {
  const hrefs: string[] =
    block.kind === 'list'
      ? block.items.flatMap((item) =>
          item.href === undefined ? [] : [item.href],
        )
      : block.kind === 'links'
        ? block.links.map((link) => link.href)
        : [];
  for (const href of hrefs) {
    if (!isSitePath(href)) {
      throw new Error(
        `Content pages: ${slug} links to "${href}", which is not an address on this site`,
      );
    }
  }
  if (block.kind === 'table') {
    for (const row of block.rows) {
      if (row.length !== block.columns.length) {
        throw new Error(
          `Content pages: ${slug} table "${block.caption}" has a row of ${row.length.toString()} cells for ${block.columns.length.toString()} columns`,
        );
      }
    }
  }
}

function check(pages: ContentPageSpec[]): void {
  const seen = new Set<string>();
  for (const { slug } of pages) {
    if (!isContentSlug(slug)) {
      throw new Error(`Content pages: "${slug}" is not a valid slug`);
    }
    if (/^[a-z0-9-]+\/\d+$/.test(slug)) {
      throw new Error(
        `Content pages: "${slug}" is the address of a salary page`,
      );
    }
    if (seen.has(slug)) {
      throw new Error(`Content pages: ${slug} is listed twice`);
    }
    seen.add(slug);
  }
  for (const page of pages) {
    if (page.title.length >= TITLE_LIMIT) {
      throw new Error(
        `Content pages: ${page.slug} title is ${page.title.length.toString()} characters, limit ${(TITLE_LIMIT - 1).toString()}`,
      );
    }
    if (page.description.length >= DESCRIPTION_LIMIT) {
      throw new Error(
        `Content pages: ${page.slug} description is ${page.description.length.toString()} characters, limit ${(DESCRIPTION_LIMIT - 1).toString()}`,
      );
    }
    for (const section of page.sections) {
      for (const block of section.blocks ?? []) {
        checkBlock(page.slug, block);
      }
    }
    for (const step of page.trail) {
      if (!seen.has(step.slug)) {
        throw new Error(
          `Content pages: ${page.slug} trail step ${step.slug} is not a listed page`,
        );
      }
    }
  }
}

/** Writes dist/<slug>/index.html for every listed page, only once all are valid and rendered. */
export async function generateContentPages(
  options: ContentOptions,
): Promise<{ written: string[] }> {
  const { outDir, template, pages, render, siteUrl } = options;
  check(pages);
  const built = pages.map((spec) => ({
    path: contentFile(spec.slug),
    html: buildContentPageHtml(
      template,
      render(spec),
      spec,
      siteUrl === null ? null : `${siteUrl}${contentPath(spec.slug)}`,
    ),
  }));
  for (const { path, html } of built) {
    const file = join(outDir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  return { written: built.map((p) => p.path) };
}
