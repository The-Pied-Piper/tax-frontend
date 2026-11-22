import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  engineOptions,
  listedIn,
  siteUrl as site,
  template,
  tmpDirs,
  withAlberta,
} from '../../src/test/generatedSite';
import { fileFor, parse } from '../../src/test/crawlSite';
import { contentPages } from '../../src/state/contentPages';
import {
  contentFile,
  formSlug,
  METHODOLOGY_SLUG,
} from '../../src/state/siteLinks';
import { generateContentPages } from '../contentPages/generate';
import { hubPages } from '../contentPages/hubs';
import { generateSalaryPages } from './generate';
import { renderContentPage, renderSalaryApp } from './prerender';
import { provinces } from './provinces';

// Ticket #150: the full build (salary pages, hubs, content pages with a form
// page) and the links a salary page itself carries, footer left out. The footer
// already links the hubs and the methodology page from every page, so only the
// breadcrumb, neighbour and Learn more links count here.
const SLOW_TEST_MS = 20_000;
const outDir = tmpDirs('salary-learn-more');

async function build() {
  const dir = outDir();
  writeFileSync(join(dir, 'index.html'), template);
  const published = new Set(contentPages.map((page) => page.slug));
  const { written: salaryFiles, built } = await generateSalaryPages({
    published,
    ...engineOptions(provinces, withAlberta),
    // Only the provinces the fake API lists: a site-URL build fails on any other.
    provinces: listedIn(provinces, withAlberta),
    outDir: dir,
    template,
    render: renderSalaryApp,
    siteUrl: site,
  });
  const { written: pageFiles } = await generateContentPages({
    outDir: dir,
    template,
    pages: [...contentPages, ...hubPages(built, provinces, published, [])],
    render: renderContentPage,
    siteUrl: site,
  });
  return { dir, salaryFiles, pageFiles, published };
}

/** The files a salary page links to from its main content, not its footer. */
function bodyTargets(dir: string, file: string): string[] {
  const links = [...parse(dir, file).querySelectorAll('a[href]')].filter(
    (a) => a.closest('footer') === null,
  );
  return links.flatMap((a) => {
    const target = fileFor(a.getAttribute('href') ?? '');
    return target === null ? [] : [target];
  });
}

describe('crawl of the full build for the salary page links (#150)', () => {
  it('has a form page in the build, so there is a form to reach', async () => {
    const { pageFiles, published } = await build();
    expect(published.has(formSlug('on428'))).toBe(true);
    expect(pageFiles).toContain(contentFile(formSlug('on428')));
  });

  it(
    'resolves every link of every salary page, the breadcrumb and Learn more row included, to a written file',
    async () => {
      const { dir, salaryFiles } = await build();
      expect(salaryFiles).toHaveLength(50);
      for (const file of salaryFiles) {
        for (const target of bodyTargets(dir, file)) {
          expect(existsSync(join(dir, target)), `${file} -> ${target}`).toBe(
            true,
          );
        }
      }
    },
    SLOW_TEST_MS,
  );

  it(
    'links the hub, the methodology page and the form page from every Ontario page, not counting the footer',
    async () => {
      const { dir, salaryFiles } = await build();
      const ontario = salaryFiles.filter((f) => f.startsWith('ca-on/'));
      expect(ontario).toHaveLength(25);
      for (const file of ontario) {
        const targets = bodyTargets(dir, file);
        for (const want of [
          'ca-on/index.html',
          contentFile(METHODOLOGY_SLUG),
          contentFile(formSlug('on428')),
        ]) {
          expect(targets, `${file} -> ${want}`).toContain(want);
        }
      }
    },
    SLOW_TEST_MS,
  );

  it(
    'links Alberta pages to the Alberta hub and methodology, and to a form page only when it is built',
    async () => {
      const { dir, salaryFiles, published } = await build();
      const alberta = salaryFiles.filter((f) => f.startsWith('ca-ab/'));
      expect(alberta).toHaveLength(25);
      for (const file of alberta) {
        const targets = bodyTargets(dir, file);
        expect(targets).toContain('ca-ab/index.html');
        expect(targets).toContain(contentFile(METHODOLOGY_SLUG));
        const forms = targets.filter((t) => t.startsWith('forms/'));
        // Alberta's main form is linked exactly when its page is built; the
        // advanced view adds a link per form, each to a page that is built.
        expect(forms.includes(contentFile(formSlug('ab428')))).toBe(
          published.has(formSlug('ab428')),
        );
        for (const form of forms) {
          expect(published, form).toContain(
            form.slice(0, -'/index.html'.length),
          );
        }
      }
    },
    SLOW_TEST_MS,
  );

  it(
    'reaches every hub of a built province, the methodology page and a form page from the salary pages alone',
    async () => {
      const { dir, salaryFiles } = await build();
      const reached = new Set(
        salaryFiles.flatMap((file) => bodyTargets(dir, file)),
      );
      for (const want of [
        'ca-on/index.html',
        'ca-ab/index.html',
        contentFile(METHODOLOGY_SLUG),
        contentFile(formSlug('on428')),
      ]) {
        expect(reached.has(want), want).toBe(true);
        expect(existsSync(join(dir, want)), want).toBe(true);
      }
    },
    SLOW_TEST_MS,
  );
});
