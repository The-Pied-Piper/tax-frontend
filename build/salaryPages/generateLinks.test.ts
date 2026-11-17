import {
  albertaTargets,
  ontarioTargets,
  publishedSlugs,
} from '../../src/test/pageLinks';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSalaryPageData } from '../../src/state/salaryPageData';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import {
  apiBaseUrl,
  fakeFetch,
  listedIn,
  siteUrl,
  template,
  tmpDirs,
  withAlberta,
  xland,
} from '../../src/test/generatedSite';
import { syntheticOntarioPages } from '../../src/test/syntheticPages';
import { generateSalaryPages } from './generate';
import { provinces } from './provinces';

// What the generator alone adds to a page: the links in its data block, and
// the canonical it is given. The crawl test covers the written folder as a whole.
const outDir = tmpDirs('salary-links');
const render = (data: SalaryPageData) => `<main>${data.salary}</main>`;

function run(
  dir: string,
  options: {
    all?: boolean;
    siteUrl?: string;
    published?: ReadonlySet<string>;
    list?: unknown;
  } = {},
) {
  const all = options.all ? [...provinces, xland] : provinces;
  const listOf = options.list as
    { jurisdictions: { code: string }[] } | undefined;
  return generateSalaryPages({
    published: options.published ?? publishedSlugs,
    fetch: fakeFetch(options.list),
    baseUrl: apiBaseUrl,
    // With a site URL the build fails on a listed province the fake API does not
    // return, so such a build passes only the provinces the fake API lists.
    provinces: options.siteUrl ? listedIn(all, listOf) : all,
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

// fakeFetch answers every salary with the $70,000 response.
const takeHome = '53786.25';

describe('generateSalaryPages links', () => {
  it('puts $65,000 and $75,000, the calculator and the nearest others in the $70,000 data block', async () => {
    const dir = outDir();
    await run(dir);
    expect(dataOf(dir, 'ca-on/70000/index.html').links).toEqual({
      calculator: '/',
      previous: { salary: '65000', href: '/ca-on/65000/', takeHome },
      next: { salary: '75000', href: '/ca-on/75000/', takeHome },
      others: [60000, 80000, 55000, 85000, 50000, 90000].map((n) => ({
        salary: n.toString(),
        href: `/ca-on/${n.toString()}/`,
        takeHome,
      })),
      ...ontarioTargets,
    });
  });

  it('hands the same links to the render function as it writes in the block', async () => {
    const dir = outDir();
    const seen: SalaryPageData[] = [];
    await generateSalaryPages({
      published: publishedSlugs,
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
    expect(skipped).toEqual(['CA-AB', 'CA-BC', 'CA-XX']);
    expect(written.some((f) => f.startsWith('ca-xx/'))).toBe(false);
    for (const file of written) {
      expect(readFileSync(join(dir, file), 'utf8')).not.toContain('ca-xx');
    }
  });
});

describe('generateSalaryPages hub and learn-more links (#150)', () => {
  const methodologyOnly = new Set(['methodology']);

  it('puts the Ontario hub, labelled Ontario, and a learnMore list in every page data block', async () => {
    const dir = outDir();
    const { written } = await run(dir);
    expect(written).toHaveLength(25);
    for (const file of written) {
      const { links } = dataOf(dir, file);
      expect(links?.hub, file).toEqual({ label: 'Ontario', href: '/ca-on/' });
      expect(links?.learnMore, file).toEqual(ontarioTargets.learnMore);
    }
  });

  it('lists the hub, the methodology page and the form page, in that order, with absolute hrefs', async () => {
    const dir = outDir();
    await run(dir);
    const links = dataOf(dir, 'ca-on/70000/index.html').links;
    expect(links?.learnMore.map((l) => l.href)).toEqual([
      '/ca-on/',
      '/methodology/',
      '/forms/on428/',
    ]);
  });

  it('has no form link while forms/on428 is not published', async () => {
    const dir = outDir();
    const { written } = await run(dir, { published: methodologyOnly });
    for (const file of written) {
      const learnMore = dataOf(dir, file).links?.learnMore ?? [];
      expect(
        learnMore.map((l) => l.href),
        file,
      ).toEqual(['/ca-on/', '/methodology/']);
    }
  });

  it('keeps the hub and methodology links even when no content page is published', async () => {
    const dir = outDir();
    await run(dir, { published: new Set() });
    const links = dataOf(dir, 'ca-on/70000/index.html').links;
    expect(links?.hub.href).toBe('/ca-on/');
    expect(links?.learnMore.map((l) => l.href)).toEqual([
      '/ca-on/',
      '/methodology/',
    ]);
  });

  it('gives a province with no published forms only the hub and methodology', async () => {
    const dir = outDir();
    const { written } = await run(dir, { list: withAlberta });
    const alberta = written.filter((f) => f.startsWith('ca-ab/'));
    expect(alberta).toHaveLength(25);
    for (const file of alberta) {
      const { links } = dataOf(dir, file);
      expect(links?.hub, file).toEqual(albertaTargets.hub);
      expect(links?.learnMore, file).toEqual(albertaTargets.learnMore);
    }
  });

  it('hands the render function the same hub and learnMore as the block', async () => {
    const dir = outDir();
    const seen: SalaryPageData[] = [];
    await generateSalaryPages({
      published: publishedSlugs,
      fetch: fakeFetch(),
      baseUrl: apiBaseUrl,
      provinces,
      outDir: dir,
      template,
      render: (data) => {
        seen.push(data);
        return '<main></main>';
      },
    });
    const rendered = seen.find((d) => d.salary === '70000');
    expect(rendered?.links?.hub).toEqual({ label: 'Ontario', href: '/ca-on/' });
    expect(rendered?.links?.learnMore).toEqual(ontarioTargets.learnMore);
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

/** Like fakeFetch, but each request gets a take_home of its own, from the salary asked for. */
const synthetic: Record<string, unknown> = Object.fromEntries(
  syntheticOntarioPages().map((page) => [page.salary, page.response]),
);

function perSalaryFetch(): typeof fetch {
  const base = fakeFetch();
  return (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.endsWith(':compute') && typeof init?.body === 'string') {
      const { salary } = JSON.parse(init.body) as { salary: string };
      return Promise.resolve(Response.json(synthetic[salary]));
    }
    return base(input, init);
  };
}

async function buildPerSalary() {
  const dir = outDir();
  const result = await generateSalaryPages({
    published: publishedSlugs,
    fetch: perSalaryFetch(),
    baseUrl: apiBaseUrl,
    provinces,
    outDir: dir,
    template,
    render,
  });
  return { dir, ...result };
}

const ownTakeHome = (dir: string, salary: string) =>
  dataOf(dir, `ca-on/${salary}/index.html`).response.take_home;

describe('generateSalaryPages link take-home figures (#184)', () => {
  it('gives the previous, next and other links of a middle page the take_home of the page each points to', async () => {
    const { dir } = await buildPerSalary();
    const links = dataOf(dir, 'ca-on/70000/index.html').links;
    expect(links?.previous?.takeHome).toBe(ownTakeHome(dir, '65000'));
    expect(links?.next?.takeHome).toBe(ownTakeHome(dir, '75000'));
    expect(links?.others).toHaveLength(6);
    for (const other of links?.others ?? []) {
      expect(other.takeHome, other.salary).toBe(ownTakeHome(dir, other.salary));
    }
    // Synthetic take_home is salary minus 16,214: not the page's own figure.
    expect(links?.previous?.takeHome).toBe('48786.25');
    expect(links?.next?.takeHome).toBe('58786.25');
  });

  it('gives every link on every written page the linked page take_home, and never the page own', async () => {
    const { dir, written } = await buildPerSalary();
    for (const file of written) {
      const { links, salary } = dataOf(dir, file);
      const all = [
        links?.previous,
        links?.next,
        ...(links?.others ?? []),
      ].flatMap((l) => (l ? [l] : []));
      for (const link of all) {
        expect(link.takeHome, `${file} -> ${link.salary}`).toBe(
          ownTakeHome(dir, link.salary),
        );
        expect(link.takeHome).not.toBe(ownTakeHome(dir, salary));
      }
    }
  });

  it('keeps hrefs exactly as before: /ca-on/<salary>/ for a page that is written', async () => {
    const { dir, written } = await buildPerSalary();
    for (const file of written) {
      const { links } = dataOf(dir, file);
      const all = [links?.previous, links?.next, ...(links?.others ?? [])];
      for (const l of all) {
        if (!l) continue;
        expect(l.href).toBe(`/ca-on/${l.salary}/`);
        expect(written).toContain(`${l.href.slice(1)}index.html`);
      }
    }
  });

  it('writes the first page with no previous and the last page with no next, each with figures on the rest', async () => {
    const { dir } = await buildPerSalary();
    const first = dataOf(dir, 'ca-on/30000/index.html').links;
    expect(first?.previous).toBeNull();
    expect(first?.next).toEqual({
      salary: '35000',
      href: '/ca-on/35000/',
      takeHome: ownTakeHome(dir, '35000'),
    });
    const last = dataOf(dir, 'ca-on/150000/index.html').links;
    expect(last?.next).toBeNull();
    expect(last?.previous?.takeHome).toBe(ownTakeHome(dir, '145000'));
    for (const l of [...(first?.others ?? []), ...(last?.others ?? [])]) {
      expect(l.takeHome).toMatch(/^\d+\.\d\d$/);
    }
  });

  it('gives two pages of one province different figures, each equal to the linked page take_home', async () => {
    const { dir } = await buildPerSalary();
    const a = dataOf(dir, 'ca-on/75000/index.html').links;
    const b = dataOf(dir, 'ca-on/80000/index.html').links;
    expect(a?.previous?.takeHome).toBe(ownTakeHome(dir, '70000'));
    expect(a?.next?.takeHome).toBe(ownTakeHome(dir, '80000'));
    expect(b?.previous?.takeHome).toBe(ownTakeHome(dir, '75000'));
    expect(b?.next?.takeHome).toBe(ownTakeHome(dir, '85000'));
    expect(a?.previous?.takeHome).not.toBe(b?.previous?.takeHome);
    expect(a?.next?.takeHome).not.toBe(b?.next?.takeHome);
  });

  it('hands the render function the links with their figures, the same as the block', async () => {
    const dir = outDir();
    const seen: SalaryPageData[] = [];
    await generateSalaryPages({
      published: publishedSlugs,
      fetch: perSalaryFetch(),
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
    expect(rendered?.links?.previous?.takeHome).toBe('48786.25');
    expect(rendered?.links).toEqual(
      dataOf(dir, 'ca-on/70000/index.html').links,
    );
  });

  it('takes the figures of a province from its own responses, not another province', async () => {
    const dir = outDir();
    await run(dir, { list: withAlberta });
    // fakeFetch answers every province with the same take_home; each province
    // still has its own links, with its own hrefs.
    const ab = dataOf(dir, 'ca-ab/70000/index.html').links;
    expect(ab?.previous).toEqual({
      salary: '65000',
      href: '/ca-ab/65000/',
      takeHome,
    });
  });
});
