import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// Dependency direction, from the folder table in the architecture doc. Imports
// are matched on the written path, so a folder is `**/<name>/**`. Per folder:
// `allow` may be imported freely, `types` only with a top-level `import type`;
// everything else under src is refused. Tests are exempt (they wire real pieces
// together).
const TESTS = ['**/*.test.{ts,tsx}', 'src/setupTests.ts'];
const FOLDERS = [
  'api',
  'adapters',
  'components',
  'state',
  'money',
  'theme',
  'styles',
  'mocks',
];
const ROOT_FILES = ['strings', 'App', 'main'];
const SRC_PARTS = [...FOLDERS, ...ROOT_FILES];
const REACT_PATTERNS = [
  'react',
  'react/*',
  'react-dom',
  'react-dom/*',
  '@testing-library/react',
];
const REACT_REGEX = String.raw`^(react|react-dom|@testing-library\/react)(\/|$)`;

const LAYERS = {
  api: { allow: [], types: [], react: false },
  money: { allow: [], types: [], react: false },
  theme: { allow: [], types: [], react: false },
  // CSS and the token test only; nothing else belongs here.
  styles: { allow: [], types: [], react: false },
  adapters: { allow: ['money', 'strings'], types: ['api'], react: false },
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
  // Mock handlers read saved fixtures and types, never the client or config.
  mocks: { allow: [], types: ['api'], fixturesOnly: ['api'], react: false },
};

const isFolder = (part) => FOLDERS.includes(part);

// A written path that points into src: relative, absolute, or an alias. Package
// names such as "@mui/styles" are not matched.
const SRC_PATH = String.raw`^(\.\.?\/|\/|@\/|src\/)(.*\/)?`;
const EXT = String.raw`(\.(js|jsx|ts|tsx))?`;

// Regular expression source for a part: a folder (and anything in it), or a
// root file with or without a script extension. Used for import statements
// and for dynamic import().
function regex(part) {
  return isFolder(part)
    ? `${SRC_PATH}${part}(\\/|$)`
    : `${SRC_PATH}${part}${EXT}$`;
}

// The api files a mock handler may not import (fixtures are fine).
const API_NOT_FIXTURES = `${SRC_PATH}api(\\/(client|config|index|generated)${EXT}(\\/|$)|$)`;

function layerRule(folder, { allow, types, react, fixturesOnly = [] }) {
  const refused = SRC_PARTS.filter(
    (part) => part !== folder && !allow.includes(part),
  );
  const patterns = [];
  for (const part of refused) {
    if (fixturesOnly.includes(part)) {
      patterns.push({
        regex: API_NOT_FIXTURES,
        allowTypeImports: true,
        message:
          'src/mocks may import api fixtures, and types with "import type".',
      });
    } else if (types.includes(part)) {
      patterns.push({
        regex: regex(part),
        allowTypeImports: true,
        message: `Only types may come from src/${part} here: use "import type".`,
      });
    } else {
      patterns.push({
        regex: regex(part),
        message: `src/${folder} may not import src/${part} (architecture doc, folder table).`,
      });
    }
  }
  if (!react) {
    patterns.push({
      group: REACT_PATTERNS,
      message: `src/${folder} is plain TypeScript: no React.`,
    });
  }
  // import() is not seen by no-restricted-imports, so refuse it by syntax.
  // Type-only folders are refused too: a dynamic import is a value import.
  const dynamic = refused
    .filter((part) => !fixturesOnly.includes(part))
    .map((part) => ({
      selector: `ImportExpression[source.value=/${regex(part)}/]`,
      message: `src/${folder} may not import src/${part}, not even dynamically.`,
    }));
  if (fixturesOnly.length > 0) {
    dynamic.push({
      selector: `ImportExpression[source.value=/${API_NOT_FIXTURES}/]`,
      message: 'src/mocks may import api fixtures only.',
    });
  }
  dynamic.push({
    selector: "ImportExpression[source.type='TemplateLiteral']",
    message: `src/${folder}: write the import path as a plain string so the layer rules can read it.`,
  });
  if (!react) {
    dynamic.push({
      selector: `ImportExpression[source.value=/${REACT_REGEX}/]`,
      message: `src/${folder} is plain TypeScript: no React.`,
    });
  }
  return {
    '@typescript-eslint/no-restricted-imports': ['error', { patterns }],
    'no-restricted-syntax': [
      'error',
      ...(folder === 'money' ? [] : MONEY_SELECTORS),
      ...dynamic,
    ],
  };
}

// Money is text: nothing outside src/money/ turns an amount into a number.
const MONEY_MESSAGE =
  'Money stays text. Only src/money/ may do arithmetic on an amount.';
const NUMERIC = '(Number|parseFloat|parseInt|toFixed|NumberFormat)';
const GLOBAL_OBJECTS = '(window|globalThis|self|global)';
const MONEY_SELECTORS = [
  // x.toFixed(2), x.toFixed, x['toFixed'](2), Intl.NumberFormat, Intl['NumberFormat'],
  // globalThis.Intl.NumberFormat
  `MemberExpression[property.name=/^(toFixed|NumberFormat)$/]`,
  `MemberExpression[computed=true][property.value=/^${NUMERIC}$/]`,
  `MemberExpression[computed=true][property.type='TemplateLiteral']`,
  // window.parseFloat, globalThis['Number'], global.parseInt
  `MemberExpression[object.name=/^${GLOBAL_OBJECTS}$/][property.name=/^(Number|parseFloat|parseInt)$/]`,
  // const { parseFloat } = globalThis; const { NumberFormat } = Intl;
  `VariableDeclarator[id.type='ObjectPattern'][init.name=/^(${GLOBAL_OBJECTS.slice(1, -1)}|Intl|Number)$/]`,
  `ObjectPattern > Property[key.name=/^${NUMERIC}$/]`,
  // +"1.5"
  `UnaryExpression[operator='+']`,
].map((selector) => ({ selector, message: MONEY_MESSAGE }));

const NO_NUMBER_PARSING = {
  'no-restricted-globals': [
    'error',
    ...['Number', 'parseFloat', 'parseInt'].map((name) => ({
      name,
      message: MONEY_MESSAGE,
    })),
  ],
  'no-restricted-syntax': ['error', ...MONEY_SELECTORS],
};

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'src/api/generated',
      'public/mockServiceWorker.js',
    ],
  },
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
    rules: {
      ...reactHooks.configs.recommended.rules,
      // `import { type A }` still emits an import under verbatimModuleSyntax.
      '@typescript-eslint/no-import-type-side-effects': 'error',
    },
  },
  { ...jsxA11y.flatConfigs.recommended, files: ['**/*.tsx'] },
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
  // Plain browser script, loaded by index.html before the app.
  {
    files: ['public/theme-init.js'],
    languageOptions: { globals: globals.browser },
  },
  { files: ['**/*.{ts,tsx}'], rules: NO_NUMBER_PARSING },
  // src/money does the money arithmetic; src/styles (the token test's colour
  // maths) is not money, so the whole folder is exempt.
  {
    files: ['src/money/**', 'src/styles/**'],
    rules: { 'no-restricted-globals': 'off', 'no-restricted-syntax': 'off' },
  },

  // Any other file under src (a folder outside the table, an extra root file)
  // still may not import the mock server; only main.tsx and tests do.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [...TESTS, 'src/main.tsx', 'src/mocks/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: regex('mocks'),
              message: 'Only src/main.tsx and tests import src/mocks.',
            },
          ],
        },
      ],
    },
  },

  // Dependency direction, one block per folder.
  ...Object.entries(LAYERS).map(([folder, layer]) => ({
    files: [`src/${folder}/**`],
    ignores: TESTS,
    rules: layerRule(folder, layer),
  })),
  // Root files: strings.ts imports nothing; App.tsx composes everything but the
  // mock server.
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
