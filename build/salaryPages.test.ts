import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import jurisdictions from '../src/api/fixtures/jurisdictions.json';
import { contentTemplate, template } from '../src/test/generatedSite';
import { contentPages } from '../src/state/contentPages';
import { salaryPages as salaryPagesPlugin } from './salaryPages';

const API = 'https://api.example.com/api/v1';
const ENGINE_FILE = 'engine-figures.json';

/** The plugin with an engine file, as a deploy build has it. */
function salaryPages(api: string | undefined, site?: string) {
  return salaryPagesPlugin(api, site, ENGINE_FILE);
}

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
  answers: [] as unknown[],
  list: [] as unknown[],
}));

vi.mock('./salaryPages/generate', async () => {
  const { mkdir: makeDir, writeFile: write } = await import('node:fs/promises');
  const { join: joinPath } = await import('node:path');
  return {
    generateSalaryPages: async ({
      outDir,
      published,
      answers,
      list,
    }: {
      outDir: string;
      published: unknown;
      answers: unknown;
      list: unknown;
    }): Promise<{
      written: string[];
      skipped: string[];
      built: never[];
    }> => {
      generateCalls.published.push(published);
      generateCalls.answers.push(answers);
      generateCalls.list.push(list);
      const written = ['ca-on/30000/index.html', 'ca-on/35000/index.html'];
      for (const file of written) {
        await makeDir(joinPath(outDir, file, '..'), { recursive: true });
        await write(joinPath(outDir, file), `<html>${file}</html>`);
      }
      return { written, skipped: [], built: [] };
    },
  };
});

vi.mock('./localEngine/read', () => ({
  readEngineFigures: vi.fn((file: string) => ({
    engine: '0.0.0',
    answers: { file },
    sweeps: { file },
  })),
}));

const sweepCalls = vi.hoisted(() => ({ args: [] as unknown[][] }));

vi.mock('./salaryPages/sweep', () => ({
  provinceSweeps: (...args: unknown[]): unknown[] => {
    sweepCalls.args.push(args);
    const unit = {
      name: 'CAD',
      placement: 'before',
      singular: '$',
      plural: '$',
      spaced: false,
      as_percentage: false,
    };
    return [
      {
        slug: 'ca-on',
        year: 2026,
        provisional: false,
        unit,
        rateUnit: { ...unit, as_percentage: true },
        points: [['1000.00', '1000.00', '0.00', '0.00', '0.0000', '0.0505']],
        edges: [],
        facts: {},
      },
    ];
  },
}));

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
  it('runs after the bundle is written', () => {
    const plugin = salaryPages(API);
    expect(plugin.name).toBe('salary-pages');
    expect(plugin.closeBundle).toBeDefined();
  });
});

describe('salaryPages closeBundle', () => {
  let root: string;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'salary-pages-test-'));
    await mkdir(join(root, 'dist'));
    await writeFile(join(root, 'dist', 'index.html'), template);
    await writeFile(join(root, 'dist', 'content.html'), contentTemplate);
    vi.spyOn(process, 'cwd').mockReturnValue(root);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    fetchMock = vi.fn((input: string) =>
      Promise.resolve(
        input.endsWith('/jurisdictions')
          ? Response.json(jurisdictions)
          : new Response('not found', { status: 404 }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await rm(root, { recursive: true, force: true });
  });

  it('hands the generator the slugs of every content page, so salary pages link only to pages that exist (#150)', async () => {
    generateCalls.published.length = 0;
    await runCloseBundle(salaryPages(API, 'https://example.com'));
    const [published] = generateCalls.published;
    // The rates pages of the listed provinces are written too, so salary pages link to them.
    expect(published).toEqual(
      new Set([
        ...contentPages.map((page) => page.slug),
        'ca-on/tax-rates',
        'ca-ab/tax-rates',
        'ca-sk/tax-rates',
        'ca-bc/tax-rates',
        'ca-mb/tax-rates',
        'ca-nl/tax-rates',
        'ca-nb/tax-rates',
        'ca-qc/tax-rates',
        // The compare page is written whenever a province has salary pages.
        'compare-provinces',
      ]),
    );
    expect((published as Set<string>).has('methodology')).toBe(true);
    expect((published as Set<string>).has('forms/on428')).toBe(true);
  });

  it("gives the generator the engine file's answers and the API's one list of places", async () => {
    generateCalls.answers.length = 0;
    generateCalls.list.length = 0;
    await runCloseBundle(salaryPages(API, 'https://example.com'));
    expect(generateCalls.answers).toEqual([{ file: ENGINE_FILE }]);
    expect(generateCalls.list).toEqual([jurisdictions]);
  });

  it("gives the sweep the engine file's sweeps, what was built and the API's list", async () => {
    sweepCalls.args.length = 0;
    await runCloseBundle(salaryPages(API, 'https://example.com'));
    expect(sweepCalls.args).toEqual([
      [{ file: ENGINE_FILE }, [], jurisdictions],
    ]);
  });

  it('writes the sweep into the hub of each swept province only', async () => {
    await runCloseBundle(salaryPages(API, 'https://example.com'));
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

  it('makes one call to the API, the list of places, and computes nothing there', async () => {
    await runCloseBundle(salaryPages(API, 'https://example.com'));
    const apiCalls = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((url) => url.startsWith(API));
    expect(apiCalls).toEqual([`${API}/jurisdictions`]);
  });

  it('fails, naming the call, when the list of places cannot be fetched', async () => {
    fetchMock.mockImplementation(() => {
      throw new Error('offline');
    });
    await expect(
      runCloseBundle(salaryPages(API, 'https://example.com')),
    ).rejects.toThrow(`GET ${API}/jurisdictions failed`);
  });

  it('fails when there is an engine file but no API address to ask for the places', async () => {
    await expect(runCloseBundle(salaryPages(undefined))).rejects.toThrow(
      /VITE_API_BASE_URL/,
    );
  });

  it('dates every page in the sitemap and keeps the dates in page-hashes.json', async () => {
    await runCloseBundle(salaryPages(API, 'https://example.com'));

    const hashes = JSON.parse(
      await readFile(join(root, 'dist', 'page-hashes.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(Object.keys(hashes)).toEqual([
      '/',
      '/ca-ab/',
      '/ca-bc/',
      '/ca-mb/',
      '/ca-nb/',
      '/ca-nl/',
      '/ca-ns/',
      '/ca-on/',
      '/ca-on/30000/',
      '/ca-on/35000/',
      '/ca-on/tax-rates/',
      '/ca-pe/',
      '/ca-qc/',
      '/ca-sk/',
      '/compare-provinces/',
      '/forms/ab428/',
      '/forms/bc428/',
      '/forms/bc479/',
      '/forms/mb428-a/',
      '/forms/mb428/',
      '/forms/mb479/',
      '/forms/nb428/',
      '/forms/nl428/',
      '/forms/ns428/',
      '/forms/on428-a/',
      '/forms/on428/',
      '/forms/pe428/',
      '/forms/schedule-6/',
      '/forms/schedule-8-qc/',
      '/forms/schedule-8/',
      '/forms/schedule-b/',
      '/forms/schedule-f/',
      '/forms/schedule-k/',
      '/forms/schedule-u/',
      '/forms/sk428/',
      '/forms/t1/',
      '/forms/t2204/',
      '/forms/t4/',
      '/forms/tp1/',
      '/methodology/',
    ]);

    const sitemap = await readFile(join(root, 'dist', 'sitemap.xml'), 'utf8');
    const urls = sitemap.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    expect(urls).toHaveLength(40);
    for (const url of urls) {
      expect(url).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    }
  });

  it('writes a page at each old T1 address that points at the merged page, and keeps them out of the sitemap', async () => {
    await runCloseBundle(salaryPages(API, 'https://example.com'));
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
    await runCloseBundle(salaryPages(API));

    await expect(
      readFile(join(root, 'dist', 'page-hashes.json'), 'utf8'),
    ).rejects.toThrow();
    await expect(
      readFile(join(root, 'dist', 'sitemap.xml'), 'utf8'),
    ).rejects.toThrow();
  });

  it('writes no pages without an engine file (local builds and CI)', async () => {
    for (const file of [undefined, '', '  ']) {
      await runCloseBundle(salaryPagesPlugin(API, undefined, file));
    }

    await expect(
      readFile(join(root, 'dist', 'sitemap.xml'), 'utf8'),
    ).rejects.toThrow();
    await expect(
      readFile(join(root, 'dist', 'methodology', 'index.html'), 'utf8'),
    ).rejects.toThrow();
  });

  it('writes the content pages from the content template, which loads no calculator', async () => {
    await runCloseBundle(salaryPages(API));

    const page = await readFile(
      join(root, 'dist', 'methodology', 'index.html'),
      'utf8',
    );
    expect(page).toContain('/src/contentMain.tsx');
    expect(page).not.toContain('/src/main.tsx');
  });

  it('leaves no content template in dist, with or without an engine file', async () => {
    await runCloseBundle(salaryPages(API));
    await expect(
      readFile(join(root, 'dist', 'content.html'), 'utf8'),
    ).rejects.toThrow();

    await writeFile(join(root, 'dist', 'content.html'), contentTemplate);
    await runCloseBundle(salaryPagesPlugin(undefined));
    await expect(
      readFile(join(root, 'dist', 'content.html'), 'utf8'),
    ).rejects.toThrow();
  });
});
