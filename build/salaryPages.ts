import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { generateSalaryPages } from './salaryPages/generate';
import { provinces } from './salaryPages/provinces';
import type { SalaryPageData } from '../src/state/useTakeHome';

type Prerender = { renderSalaryApp: (data: SalaryPageData) => string };

function isRenderer(value: unknown): value is Prerender['renderSalaryApp'] {
  return typeof value === 'function';
}

/** Builds build/salaryPages/prerender.tsx for Node, in a temp folder, and loads it. */
async function loadRenderer(tempDir: string): Promise<Prerender> {
  await build({
    configFile: false,
    logLevel: 'warn',
    plugins: [react()],
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
    isRenderer(loaded.renderSalaryApp)
  ) {
    return { renderSalaryApp: loaded.renderSalaryApp };
  }
  throw new Error('The prerender build did not export renderSalaryApp');
}

/**
 * Writes dist/<slug>/<salary>/index.html for every listed province and step.
 * Only when the API address is set (deploy builds); local builds and CI write
 * no salary pages.
 */
export function salaryPages(apiBaseUrl: string | undefined): Plugin {
  const baseUrl = (apiBaseUrl ?? '').trim().replace(/\/+$/, '');
  const plugin: Plugin = { name: 'salary-pages' };
  if (baseUrl === '') return plugin;
  plugin.apply = 'build';
  plugin.closeBundle = {
    order: 'post',
    sequential: true,
    async handler() {
      const outDir = resolve('dist');
      const tempDir = await mkdtemp(join(tmpdir(), 'salary-pages-ssr-'));
      try {
        const { renderSalaryApp } = await loadRenderer(tempDir);
        const template = await readFile(join(outDir, 'index.html'), 'utf8');
        const { written, skipped } = await generateSalaryPages({
          fetch,
          baseUrl,
          provinces,
          outDir,
          template,
          render: renderSalaryApp,
        });
        console.log(`Salary pages: wrote ${written.length.toString()}`);
        for (const code of skipped) {
          console.log(`Salary pages: ${code} not returned by the API, skipped`);
        }
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    },
  };
  return plugin;
}
