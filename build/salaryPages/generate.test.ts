import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fixture30000 from '../../src/api/fixtures/compute-on-2026-30000.json';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixture70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import fixture150000 from '../../src/api/fixtures/compute-on-2026-150000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { languageCode } from '../../src/strings';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { generateSalaryPages } from './generate';
import { provinces, type Province } from './provinces';

const compute30000 = fixture30000 as ComputeTakeHomeCalculationResponse;
const compute70000 = fixture70000 as ComputeTakeHomeCalculationResponse;
const compute150000 = fixture150000 as ComputeTakeHomeCalculationResponse;
const baseUrl = 'https://api.test/api/v1';
const template = readFileSync('index.html', 'utf8');

type Call = { method: string; url: string; body: unknown };

function urlOf(input: Parameters<typeof fetch>[0]): string {
  return typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
}

/** A stand-in tax-service. `compute` decides the answer for each request body. */
function fakeApi(
  compute: (body: {
    salary: string;
    year: number;
    jurisdiction_code: string;
  }) => Response,
  list: () => Response = () => Response.json(jurisdictions),
) {
  const calls: Call[] = [];
  const fetchFake: typeof fetch = (input, init) => {
    const url = urlOf(input);
    const method = init?.method ?? 'GET';
    const body: unknown =
      typeof init?.body === 'string' ? JSON.parse(init.body) : null;
    calls.push({ method, url, body });
    if (url === `${baseUrl}/jurisdictions`) return Promise.resolve(list());
    if (url === `${baseUrl}/take-home-calculations:compute`) {
      return Promise.resolve(compute(body as Parameters<typeof compute>[0]));
    }
    return Promise.reject(new Error(`unexpected request ${url}`));
  };
  return { fetch: fetchFake, calls };
}

const seventyThousand = () => Response.json(compute70000);

const made: string[] = [];
function outDir() {
  const dir = mkdtempSync(join(tmpdir(), 'salary-pages-'));
  made.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of made.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

/** Stands in for the real App render; echoes what it was given. */
function render(data: SalaryPageData): string {
  return `<main><p>take-home ${data.response.take_home} for ${data.salary} in ${data.jurisdictionCode} ${String(data.year)}</p></main>`;
}

function files(dir: string, slug: string) {
  return readdirSync(join(dir, slug)).sort();
}

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

describe('generateSalaryPages for Ontario', () => {
  it('writes 25 pages, one per $5,000 step, at <slug>/<salary>/index.html', async () => {
    const api = fakeApi(seventyThousand);
    const dir = outDir();
    const result = await generateSalaryPages({
      fetch: api.fetch,
      baseUrl,
      provinces,
      outDir: dir,
      template,
      render,
    });
    const expected = Array.from({ length: 25 }, (_, i) =>
      String(30000 + i * 5000),
    ).sort();
    expect(files(dir, 'ca-on')).toEqual(expected);
    expect(result.written).toHaveLength(25);
    expect(result.written).toContain('ca-on/30000/index.html');
    expect(result.written).toContain('ca-on/150000/index.html');
    for (const salary of expected) {
      expect(readdirSync(join(dir, 'ca-on', salary))).toEqual(['index.html']);
    }
  });

  it('asks the API once for the places and once per page, never twice', async () => {
    const api = fakeApi(seventyThousand);
    await generateSalaryPages({
      fetch: api.fetch,
      baseUrl,
      provinces,
      outDir: outDir(),
      template,
      render,
    });
    expect(api.calls.filter((c) => c.method === 'GET')).toHaveLength(1);
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(25);
  });

  it('asks for the same thing the live page asks for', async () => {
    const api = fakeApi(seventyThousand);
    await generateSalaryPages({
      fetch: api.fetch,
      baseUrl,
      provinces,
      outDir: outDir(),
      template,
      render,
    });
    const posts = api.calls.filter((c) => c.method === 'POST');
    expect(posts[0]?.body).toEqual({
      jurisdiction_code: 'CA-ON',
      year: 2026,
      salary: '30000',
      language_code: languageCode,
      include_trace: true,
    });
    expect(posts.map((c) => (c.body as { salary: string }).salary)).toEqual(
      Array.from({ length: 25 }, (_, i) => String(30000 + i * 5000)),
    );
  });

  it('writes each salary its own answer, edge pages included', async () => {
    const answers: Record<string, unknown> = {
      '30000': compute30000,
      '70000': compute70000,
      '150000': compute150000,
    };
    const api = fakeApi((body) =>
      Response.json(answers[body.salary] ?? compute70000),
    );
    const dir = outDir();
    await generateSalaryPages({
      fetch: api.fetch,
      baseUrl,
      provinces,
      outDir: dir,
      template,
      render,
    });
    const page = (salary: string) =>
      readFileSync(join(dir, 'ca-on', salary, 'index.html'), 'utf8');
    expect(page('30000')).toContain('take-home 27550.43 for 30000');
    expect(page('70000')).toContain('take-home 53786.25 for 70000');
    expect(page('150000')).toContain('take-home 104319.88 for 150000');
  });

  it('writes the rendered page into the template and the data block for React', async () => {
    const api = fakeApi(seventyThousand);
    const dir = outDir();
    await generateSalaryPages({
      fetch: api.fetch,
      baseUrl,
      provinces,
      outDir: dir,
      template,
      render,
    });
    const html = readFileSync(
      join(dir, 'ca-on', '70000', 'index.html'),
      'utf8',
    );
    const page = new DOMParser().parseFromString(html, 'text/html');
    expect(page.getElementById('root')?.textContent).toContain(
      'take-home 53786.25 for 70000 in CA-ON 2026',
    );
    const data = JSON.parse(
      page.getElementById('salary-page-data')?.textContent ?? '',
    ) as SalaryPageData;
    expect(data).toEqual({
      jurisdictions: jurisdictions.jurisdictions,
      response: compute70000,
      jurisdictionCode: 'CA-ON',
      year: 2026,
      salary: '70000',
    });
  });

  it('uses the year of the list entry for every page', async () => {
    const api = fakeApi(seventyThousand);
    await generateSalaryPages({
      fetch: api.fetch,
      baseUrl,
      provinces: provinces.map((p) => ({ ...p, year: 2025 })),
      outDir: outDir(),
      template,
      render,
    });
    const years = api.calls
      .filter((c) => c.method === 'POST')
      .map((c) => (c.body as { year: number }).year);
    expect(new Set(years)).toEqual(new Set([2025]));
  });
});

describe('adding a province is one list entry', () => {
  it('writes its pages with the same code', async () => {
    const api = fakeApi(seventyThousand, () => Response.json(withXland));
    const dir = outDir();
    const result = await generateSalaryPages({
      fetch: api.fetch,
      baseUrl,
      provinces: [...provinces, xland],
      outDir: dir,
      template,
      render,
    });
    expect(files(dir, 'ca-xx')).toEqual(['10000', '15000', '20000']);
    expect(files(dir, 'ca-on')).toHaveLength(25);
    expect(result.written).toContain('ca-xx/15000/index.html');
    const html = readFileSync(
      join(dir, 'ca-xx', '15000', 'index.html'),
      'utf8',
    );
    expect(html).toContain('in CA-XX 2026');
  });
});

describe('a listed province the API does not return', () => {
  it('gets no pages, is reported, and does not fail the build', async () => {
    const api = fakeApi(seventyThousand);
    const dir = outDir();
    const result = await generateSalaryPages({
      fetch: api.fetch,
      baseUrl,
      provinces: [
        ...provinces,
        { ...xland, code: 'CA-AB', slug: 'ca-ab', from: 30000 },
      ],
      outDir: dir,
      template,
      render,
    });
    expect(readdirSync(dir)).toEqual(['ca-on']);
    expect(result.skipped).toEqual(['CA-AB']);
    expect(
      api.calls.filter(
        (c) =>
          c.method === 'POST' &&
          (c.body as { jurisdiction_code: string }).jurisdiction_code ===
            'CA-AB',
      ),
    ).toHaveLength(0);
  });
});

describe('the build fails clearly', () => {
  it('names the page when the API answers an error for it', async () => {
    const api = fakeApi((body) =>
      body.salary === '35000'
        ? new Response('boom', { status: 500 })
        : Response.json(compute70000),
    );
    await expect(
      generateSalaryPages({
        fetch: api.fetch,
        baseUrl,
        provinces,
        outDir: outDir(),
        template,
        render,
      }),
    ).rejects.toThrow(/ca-on\/35000.*500/s);
  });

  it('leaves nothing written under outDir when any page fails', async () => {
    let computes = 0;
    const api = fakeApi(() => {
      computes += 1;
      return computes === 5
        ? new Response('boom', { status: 500 })
        : Response.json(compute70000);
    });
    const dir = outDir();
    await expect(
      generateSalaryPages({
        fetch: api.fetch,
        baseUrl,
        provinces,
        outDir: dir,
        template,
        render,
      }),
    ).rejects.toThrow(/500/);
    expect(computes).toBe(5);
    expect(readdirSync(dir)).toEqual([]);
  });

  it('names the page when the API cannot be reached', async () => {
    const dir = outDir();
    const down: typeof fetch = (input) =>
      urlOf(input).endsWith('/jurisdictions')
        ? Promise.resolve(Response.json(jurisdictions))
        : Promise.reject(new TypeError('connection refused'));
    await expect(
      generateSalaryPages({
        fetch: down,
        baseUrl,
        provinces,
        outDir: dir,
        template,
        render,
      }),
    ).rejects.toThrow(/ca-on\/30000/);
  });

  it('says so when the list of places cannot be fetched', async () => {
    const api = fakeApi(
      seventyThousand,
      () => new Response('', { status: 503 }),
    );
    await expect(
      generateSalaryPages({
        fetch: api.fetch,
        baseUrl,
        provinces,
        outDir: outDir(),
        template,
        render,
      }),
    ).rejects.toThrow(/jurisdictions.*503/s);
  });
});
