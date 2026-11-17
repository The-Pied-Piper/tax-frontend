import { existsSync, readFileSync } from 'node:fs';

// The content pages' template is the calculator's page with a different
// script: it must not pull the calculator in, and must not send the beacon.
function parse(file: string) {
  return new DOMParser().parseFromString(
    readFileSync(file, 'utf8'),
    'text/html',
  );
}

const content = parse('content.html');
const calculator = parse('index.html');

/** The head's tags other than the ones every page gets its own text for. */
function sharedHead(page: Document): string[] {
  return [...page.head.children]
    .filter((tag) => {
      const key = tag.getAttribute('name') ?? tag.getAttribute('property');
      return !(
        tag.tagName === 'TITLE' ||
        ['description', 'og:title', 'og:description'].includes(key ?? '') ||
        ['twitter:title', 'twitter:description'].includes(key ?? '')
      );
    })
    .map((tag) => tag.outerHTML.replace(/\s+/g, ' '));
}

describe('content.html', () => {
  it('loads only the content entry as a module', () => {
    const modules = [...content.querySelectorAll('script[type="module"]')].map(
      (s) => s.getAttribute('src'),
    );
    expect(modules).toEqual(['/src/contentMain.tsx']);
  });

  it('loads the early theme script, like the calculator', () => {
    expect(
      content.querySelector('head script[src="/theme-init.js"]'),
    ).not.toBeNull();
  });

  it('has the calculator head, apart from the page text each page replaces', () => {
    expect(sharedHead(content)).toEqual(sharedHead(calculator));
  });

  it('has an empty #root and no data block', () => {
    expect(content.getElementById('root')?.children).toHaveLength(0);
    expect(content.querySelector('script[type="application/json"]')).toBeNull();
  });
});

describe('the content entry', () => {
  const source = readFileSync('src/contentMain.tsx', 'utf8');

  it('does not import the calculator or the visit beacon', () => {
    expect(source).not.toMatch(/from '\.\/(App|api|adapters|beacon|mocks)/);
    expect(source).not.toContain('sendVisitBeacon');
  });

  it('loads the stylesheet of every component a content page is built from', () => {
    const page = readFileSync('src/components/ContentPage.tsx', 'utf8');
    const used = [...page.matchAll(/from '\.\/([A-Za-z]+)';/g)].map(
      (m) => m[1] ?? '',
    );
    const sheets = used.filter((name) =>
      existsSync(`src/components/${name}.module.css`),
    );
    expect(sheets).toContain('Breadcrumb');
    for (const name of sheets) {
      // A component the entry mounts itself brings its own sheet.
      const loaded =
        source.includes(`'./components/${name}.module.css'`) ||
        source.includes(`'./components/${name}'`);
      expect(loaded, name).toBe(true);
    }
  });
});
