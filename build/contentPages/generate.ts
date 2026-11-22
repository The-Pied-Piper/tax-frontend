import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type {
  ContentBlock,
  ContentPageSpec,
} from '../../src/state/contentPages';
import {
  contentFile,
  contentPath,
  ENGINE_REPO_URL,
  isContentSlug,
} from '../../src/state/siteLinks';
import { isSitePath } from '../../src/state/salaryPageData';
import { contentBreadcrumb } from '../../src/state/breadcrumbs';
import { breadcrumbJsonLd } from '../breadcrumbJsonLd';
import { isSalaryPageSlug } from '../salaryPages/address';
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
  /** A data block for a page's React to read, by slug, put at the end of its body. */
  dataBlocks?: ReadonlyMap<string, string>;
};

/** Why a block cannot be drawn, or null when it can. */
function blockProblem(block: ContentBlock): string | null {
  const badAddress = (href: string) =>
    isSitePath(href) || href === ENGINE_REPO_URL
      ? null
      : `has a link to ${href}, which is not a site path`;
  switch (block.kind) {
    case 'paragraph':
      for (const part of block.content) {
        const problem = typeof part === 'string' ? null : badAddress(part.href);
        if (problem) return problem;
      }
      return null;
    case 'list':
      if (block.items.length === 0) return 'has a list with no items';
      for (const item of block.items) {
        const problem = item.href === undefined ? null : badAddress(item.href);
        if (problem) return problem;
      }
      return null;
    case 'links':
      if (block.links.length === 0) return 'has a links block with no links';
      for (const link of block.links) {
        const problem = badAddress(link.href);
        if (problem) return problem;
      }
      return null;
    case 'table':
      if (block.rows.length === 0) return 'has a table with no rows';
      return block.rows.some((row) => row.length !== block.head.length)
        ? `has a table row that does not have ${block.head.length.toString()} cells`
        : null;
  }
}

function check(pages: ContentPageSpec[]): void {
  const seen = new Set<string>();
  for (const { slug } of pages) {
    if (!isContentSlug(slug)) {
      throw new Error(`Content pages: "${slug}" is not a valid slug`);
    }
    if (isSalaryPageSlug(slug)) {
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
    for (const block of page.sections.flatMap((s) => s.blocks)) {
      const problem = blockProblem(block);
      if (problem) throw new Error(`Content pages: ${page.slug} ${problem}`);
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
  const { outDir, template, pages, render, siteUrl, dataBlocks } = options;
  check(pages);
  const built = pages.map((spec) => ({
    path: contentFile(spec.slug),
    html: buildContentPageHtml(
      template,
      render(spec),
      spec,
      siteUrl === null ? null : `${siteUrl}${contentPath(spec.slug)}`,
      siteUrl === null
        ? null
        : breadcrumbJsonLd(
            contentBreadcrumb(spec),
            siteUrl,
            contentPath(spec.slug),
          ),
      dataBlocks?.get(spec.slug) ?? null,
    ),
  }));
  for (const { path, html } of built) {
    const file = join(outDir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  return { written: built.map((p) => p.path) };
}
