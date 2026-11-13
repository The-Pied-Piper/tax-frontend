import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSalaryPageData } from '../../src/state/salaryPageData';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import {
  apiBaseUrl,
  fakeFetch,
  siteUrl,
  template,
  tmpDirs,
  xland,
} from '../../src/test/generatedSite';
import { generateSalaryPages } from './generate';
import { provinces } from './provinces';

// What the generator alone adds to a page: the links in its data block, and
// the canonical it is given. The crawl test covers the written folder as a whole.
const outDir = tmpDirs('salary-links');
const render = (data: SalaryPageData) => `<main>${data.salary}</main>`;

function run(dir: string, options: { all?: boolean; siteUrl?: string } = {}) {
  return generateSalaryPages({
    fetch: fakeFetch(),
    baseUrl: apiBaseUrl,
    provinces: options.all ? [...provinces, xland] : provinces,
    outDir: dir,
    template,
    render,
    siteUrl: options.siteUrl ?? null,
  });
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
  it('puts $65,000 and $75,000, the calculator and the nearest others in the $70,000 data block', async () => {
    const dir = outDir();
    await run(dir);
    expect(dataOf(dir, 'ca-on/70000/index.html').links).toEqual({
      calculator: '/',
      previous: { salary: '65000', href: '/ca-on/65000/' },
      next: { salary: '75000', href: '/ca-on/75000/' },
      others: [60000, 80000, 55000, 85000, 50000, 90000].map((n) => ({
        salary: n.toString(),
        href: `/ca-on/${n.toString()}/`,
      })),
    });
  });

  it('hands the same links to the render function as it writes in the block', async () => {
    const dir = outDir();
    const seen: SalaryPageData[] = [];
    await generateSalaryPages({
      fetch: fakeFetch(),
      baseUrl: apiBaseUrl,
      provinces,
      outDir: dir,
      template,
      render: (data) => {
        seen.push(data);
        return render(data);
      },
    });
    const rendered = seen.find((d) => d.salary === '70000');
    expect(rendered?.links).toBeDefined();
    expect(rendered?.links).toEqual(
      dataOf(dir, 'ca-on/70000/index.html').links,
    );
  });

  it('links only to pages in the written list', async () => {
    const dir = outDir();
    const { written } = await run(dir);
    for (const file of written) {
      const { links } = dataOf(dir, file);
      const targets = [
        links?.previous,
        links?.next,
        ...(links?.others ?? []),
      ].flatMap((l) => (l ? [l.href] : []));
      for (const href of targets) {
        expect(written).toContain(`${href.slice(1)}index.html`);
      }
    }
  });

  it('gives a province the API does not return no pages and no links from or to it', async () => {
    const dir = outDir();
    const { written, skipped } = await run(dir, { all: true });
    expect(skipped).toContain('CA-XX');
    expect(written.some((f) => f.startsWith('ca-xx/'))).toBe(false);
    for (const file of written) {
      expect(readFileSync(join(dir, file), 'utf8')).not.toContain('ca-xx');
    }
  });
});

describe('generateSalaryPages canonical address', () => {
  it('writes no canonical or og:url when the site address is not set', async () => {
    const dir = outDir();
    const { written } = await run(dir);
    for (const file of written) {
      const page = html(dir, file);
      expect(page.querySelector('link[rel="canonical"]')).toBeNull();
      expect(page.querySelector('meta[property="og:url"]')).toBeNull();
    }
  });

  it('gives the page its own address when the site address is set', async () => {
    const dir = outDir();
    await run(dir, { siteUrl });
    const page = html(dir, 'ca-on/70000/index.html');
    expect(
      page.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(`${siteUrl}/ca-on/70000/`);
  });
});
