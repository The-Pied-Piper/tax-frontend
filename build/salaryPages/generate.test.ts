import {
  albertaTargets,
  ontarioTargets,
  publishedSlugs,
} from '../../src/test/pageLinks';
import { dollarSign } from '../../src/adapters/fallback';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fixture30000 from '../../src/api/fixtures/compute-on-2026-30000.json';
import type { ComputeTakeHomeCalculationResponse } from '../../src/api';
import fixture70000 from '../../src/api/fixtures/compute-on-2026-70000.json';
import fixture150000 from '../../src/api/fixtures/compute-on-2026-150000.json';
import computeAlberta from '../../src/api/fixtures/compute-ab-2026-70000.json';
import computeAlberta30000 from '../../src/api/fixtures/compute-ab-2026-30000.json';
import computeAlberta150000 from '../../src/api/fixtures/compute-ab-2026-150000.json';
import jurisdictions from '../../src/api/fixtures/jurisdictions.json';
import { withAlberta } from '../../src/test/generatedSite';
import { languageCode } from '../../src/strings';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { generateSalaryPages } from './generate';
import { salaryLinks } from './links';
import { provinces, salaries, type Province } from './provinces';

const compute30000 = fixture30000 as ComputeTakeHomeCalculationResponse;
const compute70000 = fixture70000 as ComputeTakeHomeCalculationResponse;
const compute150000 = fixture150000 as ComputeTakeHomeCalculationResponse;
/** Alberta's 2026 answer for $70,000 (provisional). */
const alberta70000 = computeAlberta as ComputeTakeHomeCalculationResponse;
const alberta30000 = computeAlberta30000 as ComputeTakeHomeCalculationResponse;
const alberta150000 =
  computeAlberta150000 as ComputeTakeHomeCalculationResponse;
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

const ontarioOnly = provinces.filter((p) => p.code === 'CA-ON');

const albertaOnly = provinces.filter((p) => p.code === 'CA-AB');

// The API's answer as the built page carries it: its "CA$" shown as "$".
function shown<T>(answer: T): T {
  return JSON.parse(dollarSign(JSON.stringify(answer))) as T;
}

describe('generateSalaryPages for Ontario', () => {
  it('writes 25 pages, one per $5,000 step, at <slug>/<salary>/index.html', async () => {
    const api = fakeApi(seventyThousand);
    const dir = outDir();
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
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
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
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
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
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
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
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
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
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
      response: shown(compute70000),
      jurisdictionCode: 'CA-ON',
      year: 2026,
      salary: '70000',
      links: {
        ...salaryLinks(
          'ca-on',
          Array.from({ length: 25 }, (_, i) => String(30000 + i * 5000)),
          '70000',
          // The fake API answers every request with the $70,000 response.
          Object.fromEntries(
            Array.from({ length: 25 }, (_, i) => [
              String(30000 + i * 5000),
              compute70000.take_home,
            ]),
          ),
        ),
        ...ontarioTargets,
      },
    });
  });

  it('uses the year of the list entry for every page', async () => {
    const api = fakeApi(seventyThousand);
    await generateSalaryPages({
      published: publishedSlugs,
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

describe('generateSalaryPages for Alberta', () => {
  const alberta = () => Response.json(alberta70000);
  const steps = Array.from({ length: 25 }, (_, i) => String(30000 + i * 5000));

  it('writes 25 pages, one per $5,000 step, at ca-ab/<salary>/index.html', async () => {
    const api = fakeApi(alberta, () => Response.json(withAlberta));
    const dir = outDir();
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: albertaOnly,
      outDir: dir,
      template,
      render,
    });
    expect(files(dir, 'ca-ab')).toEqual([...steps].sort());
    expect(result.written).toHaveLength(25);
    expect(result.written).toContain('ca-ab/30000/index.html');
    expect(result.written).toContain('ca-ab/150000/index.html');
    expect(result.skipped).toEqual([]);
  });

  it('asks the API for Alberta in the tax year of its entry, as the live page does', async () => {
    const api = fakeApi(alberta, () => Response.json(withAlberta));
    await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: albertaOnly,
      outDir: outDir(),
      template,
      render,
    });
    const posts = api.calls.filter((c) => c.method === 'POST');
    expect(posts).toHaveLength(25);
    expect(posts[0]?.body).toEqual({
      jurisdiction_code: 'CA-AB',
      year: 2026,
      salary: '30000',
      language_code: languageCode,
      include_trace: true,
    });
  });

  it('writes the $70,000 answer into the page and the data block, naming Alberta', async () => {
    const api = fakeApi(alberta, () => Response.json(withAlberta));
    const dir = outDir();
    await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: albertaOnly,
      outDir: dir,
      template,
      render,
    });
    const html = readFileSync(
      join(dir, 'ca-ab', '70000', 'index.html'),
      'utf8',
    );
    const page = new DOMParser().parseFromString(html, 'text/html');
    expect(page.getElementById('root')?.textContent).toContain(
      'take-home 54107.20 for 70000 in CA-AB 2026',
    );
    const data = JSON.parse(
      page.getElementById('salary-page-data')?.textContent ?? '',
    ) as SalaryPageData;
    expect(data).toEqual({
      jurisdictions: withAlberta.jurisdictions,
      response: shown(alberta70000),
      jurisdictionCode: 'CA-AB',
      year: 2026,
      salary: '70000',
      links: {
        ...salaryLinks(
          'ca-ab',
          steps,
          '70000',
          Object.fromEntries(steps.map((s) => [s, alberta70000.take_home])),
        ),
        ...albertaTargets,
      },
    });
  });

  it('writes each salary its own answer, edge pages included', async () => {
    const answers: Record<string, unknown> = {
      '30000': alberta30000,
      '70000': alberta70000,
      '150000': alberta150000,
    };
    const api = fakeApi(
      (body) => Response.json(answers[body.salary] ?? alberta70000),
      () => Response.json(withAlberta),
    );
    const dir = outDir();
    await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: albertaOnly,
      outDir: dir,
      template,
      render,
    });
    const page = (salary: string) =>
      readFileSync(join(dir, 'ca-ab', salary, 'index.html'), 'utf8');
    expect(page('30000')).toContain('take-home 27450.71 for 30000 in CA-AB');
    expect(page('70000')).toContain('take-home 54107.20 for 70000 in CA-AB');
    expect(page('150000')).toContain('take-home 107457.96 for 150000 in CA-AB');
  });
});

describe('adding a province is one list entry', () => {
  it('writes its pages with the same code', async () => {
    const api = fakeApi(seventyThousand, () => Response.json(withXland));
    const dir = outDir();
    const result = await generateSalaryPages({
      published: publishedSlugs,
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
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: [
        ...ontarioOnly,
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

describe('a listed province the API does not return, with a site URL', () => {
  const siteUrl = 'https://aftertaxlens.com';
  const alberta = { ...xland, code: 'CA-AB', slug: 'ca-ab', from: 30000 };
  const computes = (api: { calls: Call[] }) =>
    api.calls.filter((c) => c.method === 'POST');

  it('fails the build before fetching or writing anything', async () => {
    const api = fakeApi(seventyThousand);
    const dir = outDir();
    const run = generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      siteUrl,
      provinces: [...ontarioOnly, alberta],
      outDir: dir,
      template,
      render,
    });
    await expect(run).rejects.toThrow(/CA-AB/);
    await expect(run).rejects.toThrow(/Alberta/);
    await expect(run).rejects.toThrow(baseUrl);
    await expect(run).rejects.toThrow(
      `Alberta (CA-AB) is listed in build/salaryPages/provinces.ts but the API at ${baseUrl} does not return it. Release the service with it first, or take it out of the list.`,
    );
    expect(readdirSync(dir)).toEqual([]);
    expect(computes(api)).toHaveLength(0);
  });

  it('names every missing province in one error', async () => {
    const api = fakeApi(seventyThousand);
    const dir = outDir();
    const error = await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      siteUrl,
      provinces: [
        ...ontarioOnly,
        alberta,
        { ...xland, code: 'CA-BC', slug: 'ca-bc' },
      ],
      outDir: dir,
      template,
      render,
    }).then(
      () => null,
      (e: unknown) => e as Error,
    );
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toContain('Alberta (CA-AB)');
    expect(error?.message).toContain('British Columbia (CA-BC)');
    expect(readdirSync(dir)).toEqual([]);
    expect(computes(api)).toHaveLength(0);
  });

  it('still skips and reports when the site URL is null', async () => {
    const api = fakeApi(seventyThousand);
    const dir = outDir();
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      siteUrl: null,
      provinces: [...ontarioOnly, alberta],
      outDir: dir,
      template,
      render,
    });
    expect(result.skipped).toEqual(['CA-AB']);
    expect(readdirSync(dir)).toEqual(['ca-on']);
  });

  it('builds as before when the API returns every listed province', async () => {
    const api = fakeApi(seventyThousand, () => Response.json(withXland));
    const dir = outDir();
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      siteUrl,
      provinces: [...ontarioOnly, xland],
      outDir: dir,
      template,
      render,
    });
    expect(result.skipped).toEqual([]);
    expect(files(dir, 'ca-xx')).toEqual(['10000', '15000', '20000']);
    expect(files(dir, 'ca-on')).toHaveLength(25);
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
        published: publishedSlugs,
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
        published: publishedSlugs,
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
        published: publishedSlugs,
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
        published: publishedSlugs,
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

describe('a page whose text is too long fails the build', () => {
  /** The API lists Ontario's code under a very long name. */
  function namedAs(name: string) {
    return () =>
      Response.json({
        ...jurisdictions,
        jurisdictions: jurisdictions.jurisdictions.map((j) => ({ ...j, name })),
      });
  }
  const long = 'The Very Long Named Province of Somewhere Far Away';

  async function build(name: string, dir: string) {
    const api = fakeApi(seventyThousand, namedAs(name));
    return generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces,
      outDir: dir,
      template,
      render,
    });
  }

  it('throws, naming the page and the title, when a title is 60 or more', async () => {
    await expect(build(long, outDir())).rejects.toThrow(
      /ca-on\/30000.*title/is,
    );
  });

  it('writes nothing when it throws', async () => {
    const dir = outDir();
    await build(long, dir).catch(() => undefined);
    expect(readdirSync(dir)).toEqual([]);
  });

  it('builds as before when the limits hold', async () => {
    const result = await build('Ontario', outDir());
    expect(result.written).toHaveLength(25);
  });
});

describe('generateSalaryPages is deterministic', () => {
  async function build() {
    const dir = outDir();
    const api = fakeApi(seventyThousand);
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
      outDir: dir,
      template,
      render,
      siteUrl: 'https://aftertaxlens.com',
    });
    return { dir, written: result.written };
  }

  it('writes byte-identical pages on two runs', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-11-15T10:00:00Z'));
      const first = await build();
      vi.setSystemTime(new Date('2026-12-20T22:00:00Z'));
      const second = await build();
      expect(second.written).toEqual(first.written);
      for (const file of first.written) {
        expect(readFileSync(join(second.dir, file))).toEqual(
          readFileSync(join(first.dir, file)),
        );
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('puts no ISO timestamp in any page', async () => {
    const { dir, written } = await build();
    for (const file of written) {
      expect(readFileSync(join(dir, file), 'utf8')).not.toMatch(
        /\d{4}-\d{2}-\d{2}T\d{2}:/,
      );
    }
  });
});

describe('a full run over the real province list', () => {
  it('writes one page per salary step of every province, with no 429s', async () => {
    const listed = {
      jurisdictions: provinces.map((p) => ({
        code: p.code,
        name: p.slug,
        years: [{ year: p.year, provisional: false }],
      })),
    };
    const api = fakeApi(seventyThousand, () => Response.json(listed));
    const dir = outDir();
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces,
      outDir: dir,
      template,
      render,
    });
    const expected = provinces.reduce((sum, p) => sum + salaries(p).length, 0);
    expect(result.written).toHaveLength(expected);
    expect(new Set(result.written).size).toBe(expected);
  });
});

describe('a 429 from the API is retried', () => {
  const sleep = () => Promise.resolve();

  /** Answers 429 `times` times for the chosen request, then the good answer. */
  function throttled(
    isTarget: (body: { salary: string } | null, url: string) => boolean,
    times: number,
  ) {
    let seen = 0;
    const api = fakeApi(
      (body) => {
        if (isTarget(body, '') && seen++ < times) {
          return new Response('slow down', { status: 429 });
        }
        return seventyThousand();
      },
      () => {
        if (isTarget(null, 'list') && seen++ < times) {
          return new Response('slow down', { status: 429 });
        }
        return Response.json(jurisdictions);
      },
    );
    return api;
  }

  function run(
    fetchFake: typeof fetch,
    dir: string,
    attempts: number,
  ): Promise<{ written: string[] }> {
    return generateSalaryPages({
      published: publishedSlugs,
      fetch: fetchFake,
      baseUrl,
      provinces: ontarioOnly,
      outDir: dir,
      template,
      render,
      retry: { attempts, sleep },
    });
  }

  it('still builds every page after a 429 on the list of places', async () => {
    const plain = await run(fakeApi(seventyThousand).fetch, outDir(), 3);
    const api = throttled((_body, url) => url === 'list', 2);
    const result = await run(api.fetch, outDir(), 3);
    expect(result.written).toEqual(plain.written);
    expect(api.calls.filter((c) => c.method === 'GET')).toHaveLength(3);
  });

  it('still builds every page after a 429 on one salary answer', async () => {
    const plain = await run(fakeApi(seventyThousand).fetch, outDir(), 3);
    const api = throttled((body) => body?.salary === '70000', 2);
    const result = await run(api.fetch, outDir(), 3);
    expect(result.written).toEqual(plain.written);
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(27);
  });

  it('throws naming the page and the tries when a salary stays 429', async () => {
    const api = fakeApi((body) =>
      body.salary === '35000'
        ? new Response('slow down', { status: 429 })
        : seventyThousand(),
    );
    const dir = outDir();
    const attempt = run(api.fetch, dir, 4);
    await expect(attempt).rejects.toThrow(
      /Salary pages: ca-on\/35000 failed: status 429/,
    );
    await expect(attempt).rejects.toThrow(/after 4 tries/);
    expect(
      api.calls.filter(
        (c) => (c.body as { salary?: string } | null)?.salary === '35000',
      ),
    ).toHaveLength(4);
    expect(readdirSync(dir)).toEqual([]);
  });

  it('throws naming the list and the tries when the list stays 429', async () => {
    const api = fakeApi(
      seventyThousand,
      () => new Response('slow down', { status: 429 }),
    );
    const dir = outDir();
    const attempt = run(api.fetch, dir, 6);
    await expect(attempt).rejects.toThrow(
      `GET ${baseUrl}/jurisdictions failed: status 429`,
    );
    await expect(attempt).rejects.toThrow(/after 6 tries/);
    expect(api.calls).toHaveLength(6);
    expect(readdirSync(dir)).toEqual([]);
  });
});

describe('retry waits are not cut short by the client timeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Waits by moving the fake clock, so any timer the build holds sees the time pass. */
  const clockSleep = async (ms: number) => {
    await vi.advanceTimersByTimeAsync(ms);
  };

  function throttledSalary(times: number, headers?: Record<string, string>) {
    let seen = 0;
    return fakeApi((body) =>
      body.salary === '70000' && seen++ < times
        ? new Response('slow down', { status: 429, headers })
        : seventyThousand(),
    );
  }

  it('builds every page after two 429s that each say Retry-After 20', async () => {
    vi.useFakeTimers();
    const api = throttledSalary(2, { 'Retry-After': '20' });
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
      outDir: outDir(),
      template,
      render,
      retry: { sleep: clockSleep },
    });
    expect(result.written).toHaveLength(25);
  });

  it('succeeds on the sixth and last try with the default attempts', async () => {
    vi.useFakeTimers();
    const api = throttledSalary(5);
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
      outDir: outDir(),
      template,
      render,
      retry: { sleep: clockSleep },
    });
    expect(result.written).toHaveLength(25);
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(30);
  });
});

describe('the number of tries in a 429 failure', () => {
  const sleep = () => Promise.resolve();
  const always429 = () => new Response('slow down', { status: 429 });

  function attempt(attempts: number) {
    const api = fakeApi(always429);
    return generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
      outDir: outDir(),
      template,
      render,
      retry: { attempts, sleep },
    });
  }

  it('says "after 1 try" for a single try', async () => {
    await expect(attempt(1)).rejects.toThrow(/after 1 try(?!\w)/);
  });

  it('treats 0 attempts as one try', async () => {
    await expect(attempt(0)).rejects.toThrow(/after 1 try(?!\w)/);
  });

  it('says "after 2 tries" for two', async () => {
    await expect(attempt(2)).rejects.toThrow(/after 2 tries/);
  });
});

describe('the total wait for 429s is budgeted', () => {
  it('fails the build, naming the page, rather than wait past maxTotalWaitMs', async () => {
    const api = fakeApi(
      () =>
        new Response('slow down', {
          status: 429,
          headers: { 'Retry-After': '60' },
        }),
    );
    const waits: number[] = [];
    const dir = outDir();
    const attempt = generateSalaryPages({
      published: publishedSlugs,
      fetch: api.fetch,
      baseUrl,
      provinces: ontarioOnly,
      outDir: dir,
      template,
      render,
      retry: {
        maxTotalWaitMs: 100000,
        sleep: (ms) => {
          waits.push(ms);
          return Promise.resolve();
        },
      },
    });
    await expect(attempt).rejects.toThrow(/ca-on\/30000/);
    await expect(attempt).rejects.toThrow(/429/);
    // One full wait fits in the budget; the second would pass it, so it is never made.
    expect(waits).toEqual([60000]);
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(2);
    expect(readdirSync(dir)).toEqual([]);
  });
});

describe('the calls are paced when asked', () => {
  /** The number at a place in a list; throws rather than hide a missing one. */
  function at(list: number[], index: number): number {
    const value = list[index];
    if (value === undefined) throw new Error(`no entry at ${index.toString()}`);
    return value;
  }

  /** A fake clock: sleep records the wait and moves the clock on by it. */
  function clock() {
    let t = 5000;
    const waits: number[] = [];
    return {
      now: () => t,
      waits,
      sleep: (ms: number) => {
        waits.push(ms);
        t += ms;
        return Promise.resolve();
      },
    };
  }

  /** Wraps a fake API so each call's start time on the fake clock is noted. */
  function startsOf(c: ReturnType<typeof clock>, inner: typeof fetch) {
    const starts: number[] = [];
    const fetchFake: typeof fetch = (input, init) => {
      starts.push(c.now());
      return inner(input, init);
    };
    return { fetch: fetchFake, starts };
  }

  function expectSpaced(starts: number[], gap: number) {
    for (let n = 1; n < starts.length; n++) {
      expect(at(starts, n) - at(starts, n - 1)).toBeGreaterThanOrEqual(gap);
    }
  }

  it('starts each call at least the gap after the previous one, the list call included', async () => {
    const c = clock();
    const api = fakeApi(seventyThousand);
    const timed = startsOf(c, api.fetch);
    await generateSalaryPages({
      published: publishedSlugs,
      fetch: timed.fetch,
      baseUrl,
      provinces: ontarioOnly,
      outDir: outDir(),
      template,
      render,
      pace: { minGapMs: 200, sleep: c.sleep, now: c.now },
    });
    expect(timed.starts).toHaveLength(26);
    expectSpaced(timed.starts, 200);
    expect(c.waits).toHaveLength(25);
  });

  it('does not pace when no pace is given', async () => {
    const c = clock();
    const timed = startsOf(c, fakeApi(seventyThousand).fetch);
    await generateSalaryPages({
      published: publishedSlugs,
      fetch: timed.fetch,
      baseUrl,
      provinces: ontarioOnly,
      outDir: outDir(),
      template,
      render,
    });
    expect(c.waits).toEqual([]);
  });

  it('paces a retried 429 too: its second try starts a gap after the first', async () => {
    const c = clock();
    let seen = 0;
    const api = fakeApi((body) =>
      body.salary === '35000' && seen++ < 1
        ? new Response('slow down', { status: 429 })
        : seventyThousand(),
    );
    const timed = startsOf(c, api.fetch);
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: timed.fetch,
      baseUrl,
      provinces: ontarioOnly,
      outDir: outDir(),
      template,
      render,
      retry: { attempts: 3, sleep: () => Promise.resolve() },
      pace: { minGapMs: 200, sleep: c.sleep, now: c.now },
    });
    expect(result.written).toHaveLength(25);
    // The list, 25 pages and the one extra try.
    expect(timed.starts).toHaveLength(27);
    expectSpaced(timed.starts, 200);
    const tries = api.calls.filter((call) => {
      const b = call.body as { salary?: string } | null;
      return b?.salary === '35000';
    });
    expect(tries).toHaveLength(2);
  });

  it('writes all 150 pages of the real build, the list call first, every start 200 ms after the last', async () => {
    const c = clock();
    const listed = {
      jurisdictions: provinces.map((p) => ({
        code: p.code,
        name: p.slug,
        years: [{ year: p.year, provisional: false }],
      })),
    };
    const api = fakeApi(seventyThousand, () => Response.json(listed));
    const timed = startsOf(c, api.fetch);
    const result = await generateSalaryPages({
      published: publishedSlugs,
      fetch: timed.fetch,
      baseUrl,
      provinces,
      outDir: outDir(),
      template,
      render,
      pace: { minGapMs: 200, sleep: c.sleep, now: c.now },
    });
    expect(result.written).toHaveLength(150);
    expect(api.calls).toHaveLength(151);
    expect(api.calls[0]?.url).toBe(`${baseUrl}/jurisdictions`);
    expectSpaced(timed.starts, 200);
    expect(
      at(timed.starts, timed.starts.length - 1) - at(timed.starts, 0),
    ).toBe(150 * 200);
  });
});
