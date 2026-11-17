import type { Plugin } from 'vite';

/**
 * A page whose HTML is pre-built needs the sheets of the components that built
 * it without importing their code. `import './X.module.css'` alone is dropped
 * as unused; this keeps it, so the content entry can load those sheets.
 */
export function keepCssModules(): Plugin {
  return {
    name: 'keep-css-modules',
    enforce: 'post',
    apply: 'build',
    transform(code, id) {
      if (!id.split('?')[0]?.endsWith('.module.css')) return null;
      return { code, map: null, moduleSideEffects: 'no-treeshake' };
    },
  };
}
