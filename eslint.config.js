import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// Dependency direction, from the folder table in the architecture doc. Imports
// are matched on the written path, so a folder is `**/<name>/**`. Per folder:
// `allow` may be imported freely, `types` only with `import type`; everything
// else under src is refused. Tests are exempt (they wire real pieces together).
const TESTS = ['**/*.test.{ts,tsx}', 'src/setupTests.ts'];
const SRC_PARTS = [
  'api',
  'adapters',
  'components',
  'state',
  'money',
  'theme',
  'styles',
  'mocks',
  'strings',
  'App',
  'main',
];
const PLAIN_TS = ['react', 'react-dom', 'react/jsx-runtime'];

const LAYERS = {
  api: { allow: [], types: [], react: false },
  money: { allow: [], types: [], react: false },
  theme: { allow: [], types: [], react: false },
  adapters: { allow: ['strings'], types: ['api'], react: false },
  state: {
    allow: ['api', 'adapters', 'money', 'strings'],
    types: [],
    react: true,
  },
  components: {
    allow: ['money', 'theme', 'state', 'strings'],
    types: ['api', 'adapters'],
    react: true,
  },
  mocks: { allow: ['api'], types: [], react: false },
};

function layerRule(folder, { allow, types, react }) {
  const refused = SRC_PARTS.filter(
    (part) => part !== folder && !allow.includes(part),
  );
  const where = (part) =>
    /^[A-Z]|^strings$|^main$/.test(part)
      ? [`**/${part}`]
      : [`**/${part}`, `**/${part}/**`];
  const patterns = refused.map((part) =>
    types.includes(part)
      ? {
          group: where(part),
          allowTypeImports: true,
          message: `Only types may come from src/${part} here: use "import type".`,
        }
      : {
          group: where(part),
          message: `src/${folder} may not import src/${part} (architecture doc, folder table).`,
        },
  );
  const paths = react
    ? []
    : PLAIN_TS.map((name) => ({
        name,
        message: `src/${folder} is plain TypeScript: no React.`,
      }));
  return {
    '@typescript-eslint/no-restricted-imports': ['error', { paths, patterns }],
  };
}

// Money is text: nothing outside src/money/ turns an amount into a number.
const MONEY_MESSAGE =
  'Money stays text. Only src/money/ may do arithmetic on an amount.';
const NO_NUMBER_PARSING = {
  'no-restricted-globals': [
    'error',
    ...['Number', 'parseFloat', 'parseInt'].map((name) => ({
      name,
      message: MONEY_MESSAGE,
    })),
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: "CallExpression[callee.property.name='toFixed']",
      message: MONEY_MESSAGE,
    },
    {
      selector:
        "MemberExpression[object.name='Intl'][property.name='NumberFormat']",
      message: MONEY_MESSAGE,
    },
    {
      selector:
        'MemberExpression[object.name=/^(window|globalThis|self)$/][property.name=/^(Number|parseFloat|parseInt)$/]',
      message: MONEY_MESSAGE,
    },
  ],
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'src/api/generated'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  { ...jsxA11y.flatConfigs.recommended, files: ['**/*.tsx'] },
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
  { files: ['**/*.{ts,tsx}'], rules: NO_NUMBER_PARSING },
  {
    files: ['src/money/**'],
    rules: { 'no-restricted-globals': 'off', 'no-restricted-syntax': 'off' },
  },

  // Dependency direction, one block per folder.
  ...Object.entries(LAYERS).map(([folder, layer]) => ({
    files: [`src/${folder}/**`],
    ignores: TESTS,
    rules: layerRule(folder, layer),
  })),
  // Root files: strings.ts imports nothing; App.tsx composes everything but the
  // mock server, which only main.tsx (mock mode) and tests may import.
  {
    files: ['src/strings.ts'],
    rules: layerRule('strings', { allow: [], types: [], react: false }),
  },
  {
    files: ['src/App.tsx'],
    rules: layerRule('App', {
      allow: SRC_PARTS.filter((part) => part !== 'mocks'),
      types: [],
      react: true,
    }),
  },
);
