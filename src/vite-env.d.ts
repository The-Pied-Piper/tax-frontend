/// <reference types="vite/client" />

/** The ids of the published form pages, set at build time (build/formPageIds.ts). */
declare const __FORM_PAGE_IDS__: readonly string[];

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
