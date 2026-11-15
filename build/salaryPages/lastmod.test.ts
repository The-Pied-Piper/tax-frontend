import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpDirs } from '../../src/test/generatedSite';
import {
  fetchLiveHashes,
  hashHtml,
  nextHashes,
  writePageHashes,
  type PageHashes,
} from './lastmod';

const outDir = tmpDirs('lastmod');
const site = 'https://aftertaxlens.com';
const hashA = 'a'.repeat(64);
const hashB = 'b'.repeat(64);

/** 23:30 on 15 Nov in UTC-5 is already 16 Nov in UTC. */
const nearMidnight = () => new Date('2026-11-15T23:30:00-05:00');

function jsonFetch(body: unknown, init?: ResponseInit) {
  const urls: string[] = [];
  const fetcher: typeof fetch = (input) => {
    urls.push(typeof input === 'string' ? input : String(input));
    return Promise.resolve(Response.json(body, init));
  };
  return { fetcher, urls };
}

describe('hashHtml', () => {
  it('is the SHA-256 of the html as lowercase hex', () => {
    const html = '<!doctype html><p>hi</p>';
    expect(hashHtml(html)).toBe(
      createHash('sha256').update(html).digest('hex'),
    );
    expect(hashHtml(html)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs when one character differs', () => {
    expect(hashHtml('<p>a</p>')).not.toBe(hashHtml('<p>b</p>'));
  });
});

describe('nextHashes(current, live, now)', () => {
  const live: PageHashes = {
    '/': { hash: hashA, lastmod: '2026-01-02' },
    '/ca-on/70000/': { hash: hashA, lastmod: '2026-03-04' },
  };

  it('keeps the live lastmod for a page whose hash is unchanged', () => {
    const next = nextHashes({ '/ca-on/70000/': hashA }, live, nearMidnight);
    expect(next).toEqual({
      '/ca-on/70000/': { hash: hashA, lastmod: '2026-03-04' },
    });
  });

  it("gives a changed page today's UTC date", () => {
    const next = nextHashes({ '/ca-on/70000/': hashB }, live, nearMidnight);
    expect(next['/ca-on/70000/']).toEqual({
      hash: hashB,
      lastmod: '2026-11-16',
    });
  });

  it("gives a page that is not in the live file today's UTC date", () => {
    const next = nextHashes({ '/ca-on/75000/': hashA }, live, nearMidnight);
    expect(next['/ca-on/75000/']).toEqual({
      hash: hashA,
      lastmod: '2026-11-16',
    });
  });

  it("gives every page today's UTC date when there is no live file", () => {
    const next = nextHashes(
      { '/': hashA, '/ca-on/70000/': hashB },
      null,
      nearMidnight,
    );
    expect(next).toEqual({
      '/': { hash: hashA, lastmod: '2026-11-16' },
      '/ca-on/70000/': { hash: hashB, lastmod: '2026-11-16' },
    });
  });

  it('keeps the calculator entry like any other page', () => {
    const next = nextHashes({ '/': hashA }, live, nearMidnight);
    expect(next['/']).toEqual({ hash: hashA, lastmod: '2026-01-02' });
  });

  it('drops live pages that are no longer built', () => {
    expect(Object.keys(nextHashes({ '/': hashA }, live, nearMidnight))).toEqual(
      ['/'],
    );
  });
});

describe('fetchLiveHashes(siteUrl, fetcher, warn)', () => {
  it('asks <siteUrl>/page-hashes.json and returns the parsed entries', async () => {
    const body: PageHashes = {
      '/': { hash: hashA, lastmod: '2026-01-02' },
    };
    const { fetcher, urls } = jsonFetch(body);
    const warn = vi.fn();
    await expect(fetchLiveHashes(site, fetcher, warn)).resolves.toEqual(body);
    expect(urls).toEqual([`${site}/page-hashes.json`]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('returns null and warns when the request rejects', async () => {
    const warn = vi.fn();
    const fetcher: typeof fetch = () => Promise.reject(new Error('offline'));
    await expect(fetchLiveHashes(site, fetcher, warn)).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('returns null and warns on a 404', async () => {
    const warn = vi.fn();
    const { fetcher } = jsonFetch({ error: 'nope' }, { status: 404 });
    await expect(fetchLiveHashes(site, fetcher, warn)).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('returns null and warns on a 500', async () => {
    const warn = vi.fn();
    const { fetcher } = jsonFetch({}, { status: 500 });
    await expect(fetchLiveHashes(site, fetcher, warn)).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('returns null and warns on invalid JSON', async () => {
    const warn = vi.fn();
    const fetcher: typeof fetch = () =>
      Promise.resolve(new Response('<html>not json'));
    await expect(fetchLiveHashes(site, fetcher, warn)).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it.each([
    ['a list instead of an object', []],
    ['an entry that is not an object', { '/': 'x' }],
    ['a short hash', { '/': { hash: 'abc', lastmod: '2026-01-02' } }],
    [
      'a non-hex hash',
      { '/': { hash: 'z'.repeat(64), lastmod: '2026-01-02' } },
    ],
    ['a missing hash', { '/': { lastmod: '2026-01-02' } }],
    [
      'a lastmod that is not a date',
      { '/': { hash: hashA, lastmod: 'today' } },
    ],
    [
      'a lastmod with a time',
      { '/': { hash: hashA, lastmod: '2026-01-02T10:00:00Z' } },
    ],
    ['a missing lastmod', { '/': { hash: hashA } }],
    [
      'one bad entry among good ones',
      {
        '/': { hash: hashA, lastmod: '2026-01-02' },
        '/ca-on/70000/': { hash: 'bad', lastmod: '2026-01-02' },
      },
    ],
  ])('returns null and warns on %s', async (_name, body) => {
    const warn = vi.fn();
    const { fetcher } = jsonFetch(body);
    await expect(fetchLiveHashes(site, fetcher, warn)).resolves.toBeNull();
    expect(warn).toHaveBeenCalled();
  });
});

describe('writePageHashes(outDir, siteUrl, files, deps)', () => {
  const pages = {
    'index.html': '<p>calculator</p>',
    'ca-on/30000/index.html': '<p>30k</p>',
    'ca-on/150000/index.html': '<p>150k</p>',
  };

  function setup(contents: Record<string, string> = pages) {
    const dir = outDir();
    for (const [file, html] of Object.entries(contents)) {
      mkdirSync(join(dir, file, '..'), { recursive: true });
      writeFileSync(join(dir, file), html);
    }
    return dir;
  }
  const missing: typeof fetch = () =>
    Promise.resolve(new Response('', { status: 404 }));

  it("writes page-hashes.json keyed '/' for index.html and the page path for each page", async () => {
    const dir = setup();
    const result = await writePageHashes(dir, site, Object.keys(pages), {
      fetch: missing,
      now: nearMidnight,
      warn: vi.fn(),
    });
    const onDisk = JSON.parse(
      readFileSync(join(dir, 'page-hashes.json'), 'utf8'),
    ) as PageHashes;
    expect(onDisk).toEqual(result);
    expect(onDisk).toEqual({
      '/': { hash: hashHtml(pages['index.html']), lastmod: '2026-11-16' },
      '/ca-on/30000/': {
        hash: hashHtml(pages['ca-on/30000/index.html']),
        lastmod: '2026-11-16',
      },
      '/ca-on/150000/': {
        hash: hashHtml(pages['ca-on/150000/index.html']),
        lastmod: '2026-11-16',
      },
    });
  });

  it('writes the keys sorted', async () => {
    const dir = setup();
    await writePageHashes(dir, site, Object.keys(pages), {
      fetch: missing,
      now: nearMidnight,
      warn: vi.fn(),
    });
    const keys = Object.keys(
      JSON.parse(readFileSync(join(dir, 'page-hashes.json'), 'utf8')) as object,
    );
    expect(keys).toEqual([...keys].sort());
    expect(keys).toEqual(['/', '/ca-on/150000/', '/ca-on/30000/']);
  });

  it('writes the same bytes whatever order the files are given', async () => {
    const dir = setup();
    const deps = { fetch: missing, now: nearMidnight, warn: vi.fn() };
    await writePageHashes(dir, site, Object.keys(pages), deps);
    const first = readFileSync(join(dir, 'page-hashes.json'), 'utf8');
    await writePageHashes(dir, site, Object.keys(pages).reverse(), deps);
    expect(readFileSync(join(dir, 'page-hashes.json'), 'utf8')).toBe(first);
  });

  it('asks the live site for <siteUrl>/page-hashes.json', async () => {
    const dir = setup();
    const { fetcher, urls } = jsonFetch({});
    await writePageHashes(dir, site, Object.keys(pages), {
      fetch: fetcher,
      now: nearMidnight,
      warn: vi.fn(),
    });
    expect(urls).toEqual([`${site}/page-hashes.json`]);
  });

  it('keeps the live lastmod for unchanged pages and re-dates changed and new ones', async () => {
    const dir = setup();
    const live: PageHashes = {
      '/': { hash: hashHtml(pages['index.html']), lastmod: '2026-01-02' },
      '/ca-on/30000/': { hash: hashA, lastmod: '2026-03-04' },
    };
    const { fetcher } = jsonFetch(live);
    const warn = vi.fn();
    const result = await writePageHashes(dir, site, Object.keys(pages), {
      fetch: fetcher,
      now: nearMidnight,
      warn,
    });
    expect(result['/']?.lastmod).toBe('2026-01-02');
    expect(result['/ca-on/30000/']?.lastmod).toBe('2026-11-16');
    expect(result['/ca-on/150000/']?.lastmod).toBe('2026-11-16');
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns exactly once, and does not throw, when the live file is missing', async () => {
    const dir = setup();
    const warn = vi.fn();
    await writePageHashes(dir, site, Object.keys(pages), {
      fetch: missing,
      now: nearMidnight,
      warn,
    });
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('warns once on a first build when the fetch rejects', async () => {
    const dir = setup();
    const warn = vi.fn();
    const result = await writePageHashes(dir, site, Object.keys(pages), {
      fetch: () => Promise.reject(new Error('offline')),
      now: nearMidnight,
      warn,
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(Object.keys(result)).toHaveLength(3);
  });
});
