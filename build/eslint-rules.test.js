// Each architecture rule must fire on a small example. The examples are linted
// as text at the path where the rule applies, without type information (none of
// these rules need it).
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import config from '../eslint.config.js';

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    ...config,
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: { parserOptions: { projectService: false } },
    },
    tseslint.configs.disableTypeChecked,
  ],
});

async function ruleIds(filePath, code) {
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.map((m) => m.ruleId ?? `parse: ${m.message}`);
}

const IMPORT = '@typescript-eslint/no-restricted-imports';
const SYNTAX = 'no-restricted-syntax';
const GLOBALS = 'no-restricted-globals';

describe('layering', () => {
  const cases = [
    [
      'a component importing the api client',
      'src/components/A.tsx',
      "import { createApiClient } from '../api/client';\nexport const x = createApiClient;\n",
    ],
    [
      'a component importing mocks',
      'src/components/A.tsx',
      "import { server } from '../mocks/server';\nexport const x = server;\n",
    ],
    [
      'api importing a component',
      'src/api/a.ts',
      "import { A } from '../components/A';\nexport const x = A;\n",
    ],
    [
      'api importing strings',
      'src/api/a.ts',
      "import { strings } from '../strings';\nexport const x = strings;\n",
    ],
    [
      'api importing react',
      'src/api/a.ts',
      "import { useState } from 'react';\nexport const x = useState;\n",
    ],
    [
      'money importing the api',
      'src/money/a.ts',
      "import { apiBaseUrl } from '../api';\nexport const x = apiBaseUrl;\n",
    ],
    [
      'an adapter importing react',
      'src/adapters/ca-on.ts',
      "import { useMemo } from 'react';\nexport const x = useMemo;\n",
    ],
    [
      'an adapter importing a component',
      'src/adapters/ca-on.ts',
      "import { A } from '../components/A';\nexport const x = A;\n",
    ],
    [
      'an adapter importing api values',
      'src/adapters/ca-on.ts',
      "import { apiBaseUrl } from '../api';\nexport const x = apiBaseUrl;\n",
    ],
    [
      'theme importing react',
      'src/theme/theme.ts',
      "import { useState } from 'react';\nexport const x = useState;\n",
    ],
    [
      'state importing a component',
      'src/state/useX.ts',
      "import { A } from '../components/A';\nexport const x = A;\n",
    ],
    [
      'non-test code outside main importing mocks',
      'src/state/useX.ts',
      "import { server } from '../mocks/server';\nexport const x = server;\n",
    ],
    [
      'a dynamic import of the api client in a component',
      'src/components/A.tsx',
      "export const x = () => import('../api/client');\n",
      SYNTAX,
    ],
    [
      'a dynamic import of mocks in App',
      'src/App.tsx',
      "export const x = () => import('./mocks/browser');\n",
      SYNTAX,
    ],
    [
      'a dynamic import of react in money',
      'src/money/a.ts',
      "export const x = () => import('react');\n",
      SYNTAX,
    ],
    [
      'a .js-suffixed import of strings in api',
      'src/api/a.ts',
      "import { strings } from '../strings.js';\nexport const x = strings;\n",
      IMPORT,
    ],
    [
      'react-dom/client in an adapter',
      'src/adapters/ca-on.ts',
      "import { createRoot } from 'react-dom/client';\nexport const x = createRoot;\n",
      IMPORT,
    ],
    [
      'a mock handler importing the api client',
      'src/mocks/handlers.ts',
      "import { createApiClient } from '../api/client';\nexport const x = createApiClient;\n",
      IMPORT,
    ],
    [
      'an inline type specifier in a component',
      'src/components/A.tsx',
      "import { type Problem } from '../api';\nexport type X = Problem;\n",
      '@typescript-eslint/no-import-type-side-effects',
    ],
    [
      'a folder outside the table importing mocks',
      'src/test-utils/render.tsx',
      "import { server } from '../mocks/server';\nexport const x = server;\n",
      IMPORT,
    ],
    [
      'a .js-suffixed api client import in a mock handler',
      'src/mocks/handlers.ts',
      "import { createApiClient } from '../api/client.js';\nexport const x = createApiClient;\n",
    ],
    [
      'a dynamic .js-suffixed api import in a mock handler',
      'src/mocks/handlers.ts',
      "export const x = () => import('../api/index.js');\n",
      SYNTAX,
    ],
    [
      'a template-literal dynamic import in api',
      'src/api/a.ts',
      'export const x = () => import(`../strings`);\n',
      SYNTAX,
    ],
    [
      'a ./api import from App-level code in a component folder',
      'src/components/A.tsx',
      "import { apiBaseUrl } from './api';\nexport const x = apiBaseUrl;\n",
    ],
    [
      'an @/ alias import of mocks',
      'src/state/useX.ts',
      "import { server } from '@/mocks/server';\nexport const x = server;\n",
    ],
    [
      'a bare src/ path import of mocks',
      'src/state/useX.ts',
      "import { server } from 'src/mocks/server';\nexport const x = server;\n",
    ],
    [
      'an absolute /src path import of mocks',
      'src/state/useX.ts',
      "import { server } from '/src/mocks/server';\nexport const x = server;\n",
    ],
    [
      'a re-export from a refused folder',
      'src/components/A.tsx',
      "export { createApiClient } from '../api/client';\n",
    ],
    [
      'App importing mocks',
      'src/App.tsx',
      "import { server } from './mocks/server';\nexport const x = server;\n",
    ],
  ];
  it.each(cases)('flags %s', async (_name, path, code, rule = IMPORT) => {
    expect(await ruleIds(path, code)).toContain(rule);
  });

  const allowed = [
    [
      'a component importing api types',
      'src/components/A.tsx',
      "import type { Problem } from '../api';\nexport type X = Problem;\n",
    ],
    [
      'a component importing strings and money',
      'src/components/A.tsx',
      "import { strings } from '../strings';\nimport { amountForPeriod } from '../money/payPeriod';\nexport const x = [strings, amountForPeriod];\n",
    ],
    [
      'an adapter importing api types',
      'src/adapters/ca-on.ts',
      "import type { Problem } from '../api';\nexport type X = Problem;\n",
    ],
    [
      'state importing the api client',
      'src/state/useX.ts',
      "import { createApiClient } from '../api';\nexport const x = createApiClient;\n",
    ],
    [
      'a mock handler importing a fixture and api types',
      'src/mocks/handlers.ts',
      "import fixture from '../api/fixtures/compute-on-2025-70000.json';\nimport type { Problem } from '../api';\nexport const x = [fixture, {} as Problem];\n",
    ],
    [
      'a component importing an npm package whose name ends in a folder name',
      'src/components/A.tsx',
      "import s from '@mui/styles';\nimport t from 'some-lib/api';\nexport const x = [s, t];\n",
    ],
    [
      'a test importing mocks',
      'src/components/A.test.tsx',
      "import { server } from '../mocks/server';\nexport const x = server;\n",
    ],
    [
      'main importing mocks',
      'src/main.tsx',
      "import { server } from './mocks/server';\nexport const x = server;\n",
    ],
  ];
  it.each(allowed)('allows %s', async (_name, path, code) => {
    expect(await ruleIds(path, code)).not.toContain(IMPORT);
  });
});

describe('money is text', () => {
  const cases = [
    ['parseFloat', 'export const x = parseFloat("1.5");\n', GLOBALS],
    ['parseInt', 'export const x = parseInt("1", 10);\n', GLOBALS],
    ['Number(', 'export const x = Number("1.5");\n', GLOBALS],
    [
      'Number.parseFloat',
      'export const x = Number.parseFloat("1.5");\n',
      GLOBALS,
    ],
    [
      'window.parseFloat',
      'export const x = window.parseFloat("1.5");\n',
      SYNTAX,
    ],
    ['.toFixed(', 'export const x = (1.5).toFixed(2);\n', SYNTAX],
    [
      'Intl.NumberFormat',
      "export const x = new Intl.NumberFormat('en-CA');\n",
      SYNTAX,
    ],
    [
      'bracket access globalThis["parseFloat"]',
      'export const x = globalThis["parseFloat"]("1");\n',
      SYNTAX,
    ],
    ['window["Number"]', 'export const x = window["Number"]("1");\n', SYNTAX],
    ['global.parseFloat', 'export const x = global.parseFloat("1");\n', SYNTAX],
    [
      'destructured parseFloat',
      'const { parseFloat: pf } = globalThis;\nexport const x = pf;\n',
      SYNTAX,
    ],
    [
      'destructured Number from window',
      'const { Number: N } = window;\nexport const x = N;\n',
      SYNTAX,
    ],
    ['a["toFixed"](2)', 'export const x = (1.5)["toFixed"](2);\n', SYNTAX],
    ['toFixed without a call', 'export const x = (1.5).toFixed;\n', SYNTAX],
    [
      'Intl["NumberFormat"]',
      'export const x = Intl["NumberFormat"];\n',
      SYNTAX,
    ],
    [
      'globalThis.Intl.NumberFormat',
      'export const x = globalThis.Intl.NumberFormat;\n',
      SYNTAX,
    ],
    [
      'destructured NumberFormat',
      'const { NumberFormat } = Intl;\nexport const x = NumberFormat;\n',
      SYNTAX,
    ],
    ['unary plus', 'export const x = +"1.5";\n', SYNTAX],
    ['a template-literal key', 'export const x = (1.5)[`toFixed`];\n', SYNTAX],
  ];
  it.each(cases)('flags %s outside src/money', async (_name, code, rule) => {
    expect(await ruleIds('src/components/A.tsx', code)).toContain(rule);
    expect(await ruleIds('src/state/useX.ts', code)).toContain(rule);
  });
  it('allows number parsing in src/styles (colour maths is not money)', async () => {
    const code = 'export const x = parseInt("ff", 16) + Number("1");\n';
    expect(await ruleIds('src/styles/tokens.test.ts', code)).not.toContain(
      GLOBALS,
    );
  });
  it.each(cases)('allows %s inside src/money', async (_name, code, rule) => {
    expect(await ruleIds('src/money/a.ts', code)).not.toContain(rule);
  });
});

describe('accessibility', () => {
  it('flags a label that is not tied to a control', async () => {
    const code =
      'export const A = () => <><label>Salary</label><input type="text" /></>;\n';
    expect(await ruleIds('src/components/A.tsx', code)).toContain(
      'jsx-a11y/label-has-associated-control',
    );
  });
  it('flags an image without alt text', async () => {
    const code = 'export const A = () => <img src="x.png" />;\n';
    expect(await ruleIds('src/components/A.tsx', code)).toContain(
      'jsx-a11y/alt-text',
    );
  });
});
