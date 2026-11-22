import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { normalizeSiteUrl } from './seo';
import { formPageIdDefine } from './formPageIds';
import { createApiClient, type ListJurisdictionsResponse } from '../src/api';
import { generateSalaryPages } from './salaryPages/generate';
import { readEngineFigures } from './localEngine/read';
import { generateContentPages } from './contentPages/generate';
import { generateNotFoundPage } from './contentPages/notFound';
import { generateMovedPages } from './contentPages/moved';
import { provinces } from './salaryPages/provinces';
import { rewriteHome } from './salaryPages/home';
import { pageDates } from './salaryPages/lastmod';
import { rewriteSitemap } from './salaryPages/sitemap';
import { contentPages, type ContentPageSpec } from '../src/state/contentPages';
import { notFoundPage } from '../src/state/notFoundPage';
import {
  contentSlugOfFile,
  MOVED_PAGES,
  PROVINCES_WITHOUT_SALARY_PAGES,
} from '../src/state/siteLinks';
import { hubPages } from './contentPages/hubs';
import { withSalaryLinks } from './contentPages/forms';
import type { SalaryPageData } from '../src/state/useTakeHome';

/** The built template of the content pages: it loads only the theme switch, and is removed from dist once they are written. */
const CONTENT_TEMPLATE = 'content.html';

type Prerender = {
  renderSalaryApp: (data: SalaryPageData) => string;
  renderSiteFooter: () => string;
  renderContentPage: (spec: ContentPageSpec) => string;
};

function isAppRenderer(value: unknown): value is Prerender['renderSalaryApp'] {
  return typeof value === 'function';
}

function isFooterRenderer(
  value: unknown,
): value is Prerender['renderSiteFooter'] {
  return typeof value === 'function';
}

function isContentRenderer(
  value: unknown,
): value is Prerender['renderContentPage'] {
  return typeof value === 'function';
}

/** Builds build/salaryPages/prerender.tsx for Node, in a temp folder, and loads it. */
async function loadRenderer(tempDir: string): Promise<Prerender> {
  await build({
    configFile: false,
    logLevel: 'warn',
    plugins: [react()],
    define: formPageIdDefine(),
    // Same CSS-module naming as the client build, so class names match.
    build: {
      ssr: resolve('build/salaryPages/prerender.tsx'),
      outDir: tempDir,
      emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: 'prerender.mjs' } },
    },
    ssr: { noExternal: true },
  });
  const loaded: unknown = await import(
    pathToFileURL(join(tempDir, 'prerender.mjs')).href
  );
  if (
    typeof loaded === 'object' &&
    loaded !== null &&
    'renderSalaryApp' in loaded &&
    isAppRenderer(loaded.renderSalaryApp) &&
    'renderSiteFooter' in loaded &&
    isFooterRenderer(loaded.renderSiteFooter) &&
    'renderContentPage' in loaded &&
    isContentRenderer(loaded.renderContentPage)
  ) {
    return {
      renderSalaryApp: loaded.renderSalaryApp,
      renderSiteFooter: loaded.renderSiteFooter,
      renderContentPage: loaded.renderContentPage,
    };
  }
  throw new Error(
    'The prerender build did not export renderSalaryApp, renderSiteFooter and renderContentPage',
  );
}

/** Asks the API which jurisdictions it serves: the one call the build makes to it. */
async function listJurisdictions(
  baseUrl: string,
): Promise<ListJurisdictionsResponse> {
  try {
    return await createApiClient({ baseUrl, fetch }).listJurisdictions();
  } catch (error) {
    throw new Error(`Salary pages: GET ${baseUrl}/jurisdictions failed`, {
      cause: error,
    });
  }
}

/**
 * Writes dist/<slug>/<salary>/index.html for every listed province and step.
 * With the site address set it also lists them in dist/sitemap.xml, each with a
 * last-modified date kept in dist/page-hashes.json, and gives each its own
 * canonical address. The content pages in src/state/contentPages.ts and the
 * province hub pages are written the same way, after them. Every figure on them comes from the
 * file the Python step wrote from the local tax-engine (`engineFile`, see build/localEngine); the API
 * is asked one thing only, which jurisdictions it serves. Only when an engine file is given (deploy
 * builds); local builds and CI write no salary pages.
 */
export function salaryPages(
  apiBaseUrl: string | undefined,
  siteUrlValue?: string,
  engineFile?: string,
): Plugin {
  const siteUrl = normalizeSiteUrl(siteUrlValue);
  const baseUrl = (apiBaseUrl ?? '').trim().replace(/\/+$/, '');
  const plugin: Plugin = { name: 'salary-pages' };
  plugin.apply = 'build';
  plugin.closeBundle = {
    order: 'post',
    sequential: true,
    async handler() {
      const outDir = resolve('dist');
      const contentFile = join(outDir, CONTENT_TEMPLATE);
      if (engineFile === undefined || engineFile.trim() === '') {
        // No pages to write; the content template is not part of the site.
        await rm(contentFile, { force: true });
        return;
      }
      if (baseUrl === '') {
        throw new Error(
          'Salary pages: an engine file is given but VITE_API_BASE_URL is not set; the build asks the API which jurisdictions it serves.',
        );
      }
      const figures = readEngineFigures(engineFile);
      console.log(`Salary pages: figures from tax-engine ${figures.engine}`);
      const list = await listJurisdictions(baseUrl);
      const tempDir = await mkdtemp(join(tmpdir(), 'salary-pages-ssr-'));
      try {
        const { renderSalaryApp, renderSiteFooter, renderContentPage } =
          await loadRenderer(tempDir);
        const template = await readFile(join(outDir, 'index.html'), 'utf8');
        const { written, skipped, built } = await generateSalaryPages({
          answers: figures.answers,
          list,
          baseUrl,
          provinces,
          outDir,
          published: new Set(contentPages.map((p) => p.slug)),
          template,
          render: renderSalaryApp,
          siteUrl,
        });
        await rewriteHome(outDir, renderSiteFooter);
        const hubs = hubPages(
          built,
          provinces,
          new Set(contentPages.map((page) => page.slug)),
          PROVINCES_WITHOUT_SALARY_PAGES,
        );
        const content = await generateContentPages({
          outDir,
          template: await readFile(contentFile, 'utf8'),
          pages: [...withSalaryLinks(contentPages, built), ...hubs],
          render: renderContentPage,
          siteUrl,
        });
        const notFound = await generateNotFoundPage({
          outDir,
          template: await readFile(contentFile, 'utf8'),
          render: renderContentPage,
          spec: notFoundPage,
        });
        await generateMovedPages({
          outDir,
          template: await readFile(contentFile, 'utf8'),
          render: renderContentPage,
          moved: MOVED_PAGES,
          written: new Set(
            content.written.map((file) => contentSlugOfFile(file)),
          ),
          siteUrl,
        });
        const everyPage = [...written, ...content.written];
        const lastmods = await pageDates(
          outDir,
          siteUrl,
          ['index.html', ...everyPage],
          { fetch, now: () => new Date(), warn: console.warn },
        );
        await rewriteSitemap(outDir, siteUrl, everyPage, lastmods);
        console.log(`Salary pages: wrote ${written.length.toString()}`);
        console.log(
          `Content pages: wrote ${content.written.length.toString()}`,
        );
        console.log(`Not-found page: wrote ${notFound}`);
        for (const code of skipped) {
          console.warn(
            `Salary pages: ${code} not returned by the API, skipped`,
          );
        }
      } finally {
        await rm(tempDir, { recursive: true, force: true });
        await rm(contentFile, { force: true });
      }
    },
  };
  return plugin;
}
