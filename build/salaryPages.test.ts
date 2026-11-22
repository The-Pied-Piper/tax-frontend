import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { contentTemplate, template } from '../src/test/generatedSite';
import { contentPages } from '../src/state/contentPages';
import { salaryPages } from './salaryPages';

// Vitest can only import a module built at run time from inside the project,
// so the temp folders live under node_modules (never committed), and the plugin
// is given the plain path rather than a file:// address.
const { scratch } = await vi.hoisted(async () => {
  const { mkdirSync } = await import('node:fs');
  const folder = `${process.cwd()}/node_modules/.salary-pages-test`;
  mkdirSync(folder, { recursive: true });
  return { scratch: folder };
});

vi.mock('node:os', () => ({ tmpdir: (): string => scratch }));

vi.mock('node:url', () => ({
  pathToFileURL: (path: string): { href: string } => ({ href: path }),
}));

vi.mock('vite', () => ({
  build: vi.fn(async (config: { build: { outDir: string } }): Promise<void> => {
    await writeFile(
      join(config.build.outDir, 'prerender.mjs'),
      'export const renderSalaryApp = () => "";\nexport const renderSiteFooter = () => "";\nexport const renderContentPage = () => "";\n',
    );
  }),
}));

const generateCalls = vi.hoisted(() => ({
  published: [] as unknown[],
  api: [] as unknown[],
  order: [] as string[],
  sweepArgs: [] as unknown[],
}));

const apiOptions = vi.hoisted(() => ({ made: [] as unknown[] }));

vi.mock('./salaryPages/buildApi', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('./salaryPages/buildApi')>();
  return {
    ...actual,
    createBuildApi: (options: Parameters<typeof actual.createBuildApi>[0]) => {
      apiOptions.made.push(options);
      return actual.createBuildApi(options);
    },
  };
});

vi.mock('./salaryPages/sweep', () => ({
  sweepProvinces: (args: unknown): Promise<unknown[]> => {
    generateCalls.order.push('sweep');
    generateCalls.sweepArgs.push(args);
    const unit = {
      name: 'CAD',
      placement: 'before',
      singular: '$',
      plural: '$',
      spaced: false,
    };
    return Promise.resolve([
      {
        slug: 'ca-on',
        year: 2026,
        provisional: false,
        unit,
        rateUnit: unit,
        points: [['1000', '1000.00', '0.00', '0.0000', '0.0505']],
      },
    ]);
  },
}));

vi.mock('./salaryPages/generate', async () => {
  const { mkdir: makeDir, writeFile: write } = await import('node:fs/promises');
  const { join: joinPath } = await import('node:path');
  return {
    generateSalaryPages: async ({
      outDir,
      published,
      api,
    }: {
      outDir: string;
      published: unknown;
      api?: unknown;
    }): Promise<{
      written: string[];
      skipped: string[];
      built: never[];
    }> => {
      generateCalls.published.push(published);
      generateCalls.api.push(api);
      generateCalls.order.push('pages');
      const written = ['ca-on/30000/index.html', 'ca-on/35000/index.html'];
      for (const file of written) {
        await makeDir(joinPath(outDir, file, '..'), { recursive: true });
        await write(joinPath(outDir, file), `<html>${file}</html>`);
      }
      return { written, skipped: [], built: [] };
    },
  };
});

vi.mock('./salaryPages/home', () => ({
  rewriteHome: vi.fn((): Promise<void> => Promise.resolve()),
}));

async function runCloseBundle(plugin: Plugin): Promise<void> {
  const hook = plugin.closeBundle;
  if (typeof hook !== 'object' || typeof hook.handler !== 'function') {
    throw new Error('closeBundle has no handler');
  }
  await hook.handler.call({} as never);
}

describe('salaryPages plugin', () => {
  it('runs after the bundle is written when the API address is set', () => {
    const plugin = salaryPages('https://api.example.com/api/v1');
    expect(plugin.name).toBe('salary-pages');
    expect(plugin.closeBundle).toBeDefined();
  });
});

describe('salaryPages closeBundle', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'salary-pages-test-'));
    await mkdir(join(root, 'dist'));
    await writeFile(join(root, 'dist', 'index.html'), template);
    await writeFile(join(root, 'dist', 'content.html'), contentTemplate);
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('not found', { status: 404 }))),
    );
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await rm(root, { recursive: true, force: true });
  });

  it('hands the generator the slugs of every content page, so salary pages link only to pages that exist (#150)', async () => {
    generateCalls.published.length = 0;
    await runCloseBundle(
      salaryPages('https://api.example.com/api/v1', 'https://example.com'),
    );
    const [published] = generateCalls.published;
    expect(published).toEqual(new Set(contentPages.map((page) => page.slug)));
    expect((published as Set<string>).has('methodology')).toBe(true);
    expect((published as Set<string>).has('forms/on428')).toBe(true);
  });

  it('paces the real build to 5 API requests a second, in one queue for the pages and the sweep (#243)', async () => {
    apiOptions.made.length = 0;
    generateCalls.api.length = 0;
    generateCalls.sweepArgs.length = 0;
    await runCloseBundle(
      salaryPages('https://api.example.com/api/v1', 'https://example.com'),
    );
    expect(apiOptions.made).toHaveLength(1);
    const [options] = apiOptions.made as [
      { pace?: { minGapMs?: number; sleep?: unknown; now?: unknown } },
    ];
    const pace = options.pace;
    expect(pace).toBeDefined();
    // Defaults: a real timer and the real clock, and a gap of 200 ms (5 a second) or unset.
    expect(pace?.minGapMs ?? 200).toBe(200);
    expect(pace?.sleep).toBeUndefined();
    expect(pace?.now).toBeUndefined();
    // The pages and the sweep get that one client.
    const [pagesApi] = generateCalls.api;
    const [sweepArgs] = generateCalls.sweepArgs as [{ api: unknown }];
    expect(pagesApi).toBeDefined();
    expect(sweepArgs.api).toBe(pagesApi);
  });

  it('sweeps after the salary pages, then writes the sweep into each swept province hub only (#270)', async () => {
    generateCalls.order.length = 0;
    await runCloseBundle(
      salaryPages('https://api.example.com/api/v1', 'https://example.com'),
    );
    expect(generateCalls.order).toEqual(['pages', 'sweep']);
    const hub = await readFile(
      join(root, 'dist', 'ca-on', 'index.html'),
      'utf8',
    );
    expect(hub).toContain('id="hub-charts-data"');
    const other = await readFile(
      join(root, 'dist', 'ca-ab', 'index.html'),
      'utf8',
    );
    expect(other).not.toContain('hub-charts-data');
  });

  it('dates every page in the sitemap and keeps the dates in page-hashes.json', async () => {
    await runCloseBundle(
      salaryPages('https://api.example.com/api/v1', 'https://example.com'),
    );

    const hashes = JSON.parse(
      await readFile(join(root, 'dist', 'page-hashes.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(Object.keys(hashes)).toEqual([
      '/',
      '/ca-ab/',
      '/ca-bc/',
      '/ca-mb/',
      '/ca-nl/',
      '/ca-on/',
      '/ca-on/30000/',
      '/ca-on/35000/',
      '/ca-sk/',
      '/forms/ab428/',
      '/forms/bc428/',
      '/forms/bc479/',
      '/forms/mb428-a/',
      '/forms/mb428/',
      '/forms/mb479/',
      '/forms/nl428/',
      '/forms/on428-a/',
      '/forms/on428/',
      '/forms/schedule-6/',
      '/forms/schedule-8/',
      '/forms/sk428/',
      '/forms/t1/',
      '/forms/t2204/',
      '/forms/t4/',
      '/methodology/',
    ]);

    const sitemap = await readFile(join(root, 'dist', 'sitemap.xml'), 'utf8');
    const urls = sitemap.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    expect(urls).toHaveLength(25);
    for (const url of urls) {
      expect(url).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    }
  });

  it('writes a page at each old T1 address that points at the merged page, and keeps them out of the sitemap', async () => {
    await runCloseBundle(
      salaryPages('https://api.example.com/api/v1', 'https://example.com'),
    );
    for (const old of ['t1-income', 't1-tax']) {
      const html = await readFile(
        join(root, 'dist', 'forms', old, 'index.html'),
        'utf8',
      );
      expect(html).toContain('url=/forms/t1/');
      expect(html).toContain('<meta name="robots" content="noindex" />');
    }
    const sitemap = await readFile(join(root, 'dist', 'sitemap.xml'), 'utf8');
    expect(sitemap).not.toContain('t1-income');
    expect(sitemap).not.toContain('t1-tax');
    expect(sitemap).toContain('/forms/t1/');
  });

  it('writes no page list and no sitemap without a site address', async () => {
    await runCloseBundle(salaryPages('https://api.example.com/api/v1'));

    await expect(
      readFile(join(root, 'dist', 'page-hashes.json'), 'utf8'),
    ).rejects.toThrow();
    await expect(
      readFile(join(root, 'dist', 'sitemap.xml'), 'utf8'),
    ).rejects.toThrow();
  });

  it('writes no pages without an explicit API address (local builds and CI)', async () => {
    for (const address of [undefined, '', '  ']) {
      await runCloseBundle(salaryPages(address));
    }

    await expect(
      readFile(join(root, 'dist', 'sitemap.xml'), 'utf8'),
    ).rejects.toThrow();
    await expect(
      readFile(join(root, 'dist', 'methodology', 'index.html'), 'utf8'),
    ).rejects.toThrow();
  });

  it('writes the content pages from the content template, which loads no calculator', async () => {
    await runCloseBundle(salaryPages('https://api.example.com/api/v1'));

    const page = await readFile(
      join(root, 'dist', 'methodology', 'index.html'),
      'utf8',
    );
    expect(page).toContain('/src/contentMain.tsx');
    expect(page).not.toContain('/src/main.tsx');
  });

  it('leaves no content template in dist, with or without an API address', async () => {
    await runCloseBundle(salaryPages('https://api.example.com/api/v1'));
    await expect(
      readFile(join(root, 'dist', 'content.html'), 'utf8'),
    ).rejects.toThrow();

    await writeFile(join(root, 'dist', 'content.html'), contentTemplate);
    await runCloseBundle(salaryPages(undefined));
    await expect(
      readFile(join(root, 'dist', 'content.html'), 'utf8'),
    ).rejects.toThrow();
  });
});
