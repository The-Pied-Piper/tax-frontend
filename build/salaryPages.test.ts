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
}));

vi.mock('./salaryPages/generate', async () => {
  const { mkdir: makeDir, writeFile: write } = await import('node:fs/promises');
  const { join: joinPath } = await import('node:path');
  return {
    generateSalaryPages: async ({
      outDir,
      published,
    }: {
      outDir: string;
      published: unknown;
    }): Promise<{
      written: string[];
      skipped: string[];
      built: never[];
    }> => {
      generateCalls.published.push(published);
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
      '/ca-on/',
      '/ca-on/30000/',
      '/ca-on/35000/',
      '/forms/ab428/',
      '/forms/bc428/',
      '/forms/on428/',
      '/forms/t4/',
      '/methodology/',
    ]);

    const sitemap = await readFile(join(root, 'dist', 'sitemap.xml'), 'utf8');
    const urls = sitemap.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    expect(urls).toHaveLength(11);
    for (const url of urls) {
      expect(url).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    }
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
