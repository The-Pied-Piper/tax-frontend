// Each architecture rule must fire on a small example. The examples are linted
// as text at the path where the rule applies, without type information (none of
// these rules need it).
import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import config from './eslint.config.js';

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
      'App importing mocks',
      'src/App.tsx',
      "import { server } from './mocks/server';\nexport const x = server;\n",
    ],
  ];
  it.each(cases)('flags %s', async (_name, path, code) => {
    expect(await ruleIds(path, code)).toContain(IMPORT);
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
  ];
  it.each(cases)('flags %s outside src/money', async (_name, code, rule) => {
    expect(await ruleIds('src/components/A.tsx', code)).toContain(rule);
    expect(await ruleIds('src/state/useX.ts', code)).toContain(rule);
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
