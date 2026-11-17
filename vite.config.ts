/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { salaryPages } from './build/salaryPages.ts';
import { keepCssModules } from './build/keepCssModules.ts';
import { seo } from './build/seo.ts';
import { formPageIdDefine } from './build/formPageIds.ts';

// Local development: the dev server forwards /api to a tax-service started
// with ./dev.sh (http://localhost:8000). Override with DEV_API_TARGET.
const apiTarget = process.env.DEV_API_TARGET ?? 'http://localhost:8000';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [
      react(),
      keepCssModules(),
      seo(env.VITE_SITE_URL),
      salaryPages(env.VITE_API_BASE_URL, env.VITE_SITE_URL),
    ],
    define: formPageIdDefine(),
    // Two pages: the calculator (index.html) and the template of the pre-built
    // content pages (content.html), which loads only the Light/Dark switch.
    build: {
      rollupOptions: {
        input: { main: 'index.html', content: 'content.html' },
      },
    },
    server: {
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/setupTests.ts'],
    },
  };
});
