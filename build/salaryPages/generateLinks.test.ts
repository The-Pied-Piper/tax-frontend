import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixture70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { parseSalaryPageData } from '../../src/state/salaryPageData';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { generateSalaryPages } from './generate';
import { pageUrl } from './address';
import { provinces, type Province } from './provinces';

const compute70000 = fixture70000 as ComputeTakeHomeCalculationResponse;
const baseUrl = 'https://api.test/api/v1';
const site = 'https://aftertaxlens.com';
const template = readFileSync('index.html', 'utf8');

function urlOf(input: Parameters<typeof fetch>[0]): string {
  return typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
}

function fakeFetch(list: unknown = jurisdictions): typeof fetch {
  return (input) => {
    const url = urlOf(input);
    if (url === `${baseUrl}/jurisdictions`) {
      return Promise.resolve(Response.json(list));
    }
    if (url === `${baseUrl}/take-home-calculations:compute`) {
      return Promise.resolve(Response.json(compute70000));
    }
    return Promise.reject(new Error(`unexpected request ${url}`));
  };
}

const made: string[] = [];
function outDir() {
  const dir = mkdtempSync(join(tmpdir(), 'salary-links-'));
  made.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of made.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

const render = (data: SalaryPageData) => `<main>${data.salary}</main>`;

const xland: Province = {
  code: 'CA-XX',
  slug: 'ca-xx',
  year: 2026,
  from: 10000,
  to: 20000,
  step: 5000,
};
const withXland = {
  jurisdictions: [
    ...jurisdictions.jurisdictions,
    {
      code: 'CA-XX',
      name: 'Xland',
      years: [{ year: 2026, provisional: false }],
    },
  ],
};

async function run(
  dir: string,
  options: {
    provinces?: Province[];
    list?: unknown;
    siteUrl?: string | null;
  } = {},
) {
  const result = await generateSalaryPages({
    fetch: fakeFetch(options.list),
    baseUrl,
    provinces: options.provinces ?? provinces,
    outDir: dir,
    template,
    render,
    siteUrl: options.siteUrl ?? null,
  });
  return result;
}

function html(dir: string, file: string): Document {
  return new DOMParser().parseFromString(
    readFileSync(join(dir, file), 'utf8'),
    'text/html',
  );
}

function dataOf(dir: string, file: string): SalaryPageData {
  const text =
    html(dir, file).getElementById('salary-page-data')?.textContent ?? null;
  const data = parseSalaryPageData(text);
  if (!data) throw new Error(`no readable data block in ${file}`);
  return data;
}

describe('generateSalaryPages links', () => {
  it('puts $65,000 and $75,000 and the calculator in the $70,000 data block', async () => {
    const dir = outDir();
    await run(dir);
    const { links } = dataOf(dir, 'ca-on/70000/index.html');
    expect(links?.calculator).toBe('/');
    expect(links?.previous).toEqual({ salary: '65000', href: '/ca-on/65000/' });
    expect(links?.next).toEqual({ salary: '75000', href: '/ca-on/75000/' });
    expect(links?.others.map((l) => l.salary)).toEqual([
      '65000',
      '75000',
      '60000',
      '80000',
      '55000',
      '85000',
    ]);
  });

  it('gives the ends one neighbour each', async () => {
    const dir = outDir();
    await run(dir);
    const first = dataOf(dir, 'ca-on/30000/index.html').links;
    expect(first?.previous).toBeNull();
    expect(first?.next?.href).toBe('/ca-on/35000/');
    const last = dataOf(dir, 'ca-on/150000/index.html').links;
    expect(last?.next).toBeNull();
    expect(last?.previous?.href).toBe('/ca-on/145000/');
  });

  it('links only to pages in the written list', async () => {
    const dir = outDir();
    const { written } = await run(dir);
    const files = new Set(written);
    for (const file of written) {
      const { links } = dataOf(dir, file);
      for (const l of [
        links?.previous,
        links?.next,
        ...(links?.others ?? []),
      ]) {
        if (!l) continue;
        expect(files).toContain(`${l.href.slice(1)}index.html`);
      }
    }
  });

  it('adds a made-up second province with no other change: its pages link only to themselves, Ontario is untouched', async () => {
    const alone = outDir();
    await run(alone);
    const both = outDir();
    await run(both, {
      provinces: [...provinces, xland],
      list: withXland,
    });
    expect(dataOf(both, 'ca-on/70000/index.html').links).toEqual(
      dataOf(alone, 'ca-on/70000/index.html').links,
    );
    const middle = dataOf(both, 'ca-xx/15000/index.html').links;
    expect(middle?.previous?.href).toBe('/ca-xx/10000/');
    expect(middle?.next?.href).toBe('/ca-xx/20000/');
    expect(middle?.others.map((l) => l.href)).toEqual([
      '/ca-xx/10000/',
      '/ca-xx/20000/',
    ]);
  });

  it('gives a province the API does not return no pages and no links from or to it', async () => {
    const dir = outDir();
    const { written, skipped } = await run(dir, {
      provinces: [...provinces, xland],
    });
    expect(skipped).toEqual(['CA-XX']);
    expect(written.some((f) => f.startsWith('ca-xx/'))).toBe(false);
    for (const file of written) {
      const text = readFileSync(join(dir, file), 'utf8');
      expect(text).not.toContain('ca-xx');
    }
  });
});

describe('generateSalaryPages canonical address', () => {
  it('sets each page canonical and og:url to its own sitemap address', async () => {
    const dir = outDir();
    const { written } = await run(dir, { siteUrl: site });
    expect(written).toHaveLength(25);
    for (const file of written) {
      const salary = file.split('/')[1] ?? '';
      const page = html(dir, file);
      const expected = pageUrl(site, 'ca-on', salary);
      expect(
        page.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ).toBe(expected);
      expect(
        page.querySelector('meta[property="og:url"]')?.getAttribute('content'),
      ).toBe(expected);
    }
  });

  it('writes no canonical when the site address is not set', async () => {
    const dir = outDir();
    const { written } = await run(dir);
    for (const file of written) {
      expect(html(dir, file).querySelector('link[rel="canonical"]')).toBeNull();
    }
  });
});
