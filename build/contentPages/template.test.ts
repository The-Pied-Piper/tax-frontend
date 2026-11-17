import { readFileSync } from 'node:fs';

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

  it('has no structured data of its own, like the calculator: each page gets its own breadcrumb block when built', () => {
    const ld = 'script[type="application/ld+json"]';
    expect(content.querySelector(ld)).toBeNull();
    expect(calculator.querySelector(ld)).toBeNull();
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
});
