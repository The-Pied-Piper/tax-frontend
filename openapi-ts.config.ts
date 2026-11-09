import { defineConfig } from '@hey-api/openapi-ts';

// Types only: the client in src/api/client.ts is written by hand.
export default defineConfig({
  input: './api/openapi.yml',
  output: { path: 'src/api/generated', postProcess: ['prettier'] },
  plugins: [{ name: '@hey-api/typescript', enums: false }],
});
