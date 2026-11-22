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
import {
  apiBaseUrl as baseUrl,
  engineOf,
  engineOptions,
  withAlberta,
  withXland,
  xland,
} from '../../src/test/generatedSite';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { generateSalaryPages, type EngineAnswer } from './generate';
import { salaryLinks } from './links';
import { provinces, salaries } from './provinces';

const compute30000 = fixture30000 as ComputeTakeHomeCalculationResponse;
const compute70000 = fixture70000 as ComputeTakeHomeCalculationResponse;
const compute150000 = fixture150000 as ComputeTakeHomeCalculationResponse;
/** Alberta's 2026 answer for $70,000 (provisional). */
const alberta70000 = computeAlberta as ComputeTakeHomeCalculationResponse;
const alberta30000 = computeAlberta30000 as ComputeTakeHomeCalculationResponse;
const alberta150000 =
  computeAlberta150000 as ComputeTakeHomeCalculationResponse;
const template = readFileSync('index.html', 'utf8');

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

// The API's answer as the built page carries it: its "CA$" shown as "$".
function shown<T>(answer: T): T {
  return JSON.parse(dollarSign(JSON.stringify(answer))) as T;
}

const ontarioOnly = provinces.filter((p) => p.code === 'CA-ON');
const albertaOnly = provinces.filter((p) => p.code === 'CA-AB');
const steps = Array.from({ length: 25 }, (_, i) => String(30000 + i * 5000));
const on = engineOf(compute70000);

/** Every page salary of the provinces answered with `answer`; a few salaries with their own. */
function build(
  options: Partial<Parameters<typeof generateSalaryPages>[0]> & {
    provinces: typeof provinces;
  },
  list: unknown = jurisdictions,
  answerFor: (
    province: (typeof provinces)[number],
    salary: string,
  ) => EngineAnswer = () => on,
) {
  return generateSalaryPages({
    published: publishedSlugs,
    ...engineOptions(options.provinces, list, answerFor),
    outDir: outDir(),
    template,
    render,
    ...options,
  });
}

describe('generateSalaryPages for Ontario', () => {
  it('writes 25 pages, one per $5,000 step, at <slug>/<salary>/index.html', async () => {
    const dir = outDir();
    const result = await build({ provinces: ontarioOnly, outDir: dir });
    expect(files(dir, 'ca-on')).toEqual([...steps].sort());
    expect(result.written).toHaveLength(25);
    expect(result.written).toContain('ca-on/30000/index.html');
    expect(result.written).toContain('ca-on/150000/index.html');
    for (const salary of steps) {
      expect(readdirSync(join(dir, 'ca-on', salary))).toEqual(['index.html']);
    }
  });

  it('writes each salary its own answer, edge pages included', async () => {
    const own: Record<string, EngineAnswer> = {
      '30000': engineOf(compute30000),
      '150000': engineOf(compute150000),
    };
    const dir = outDir();
    await build(
      { provinces: ontarioOnly, outDir: dir },
      undefined,
      (_p, n) => own[n] ?? on,
    );
    const page = (salary: string) =>
      readFileSync(join(dir, 'ca-on', salary, 'index.html'), 'utf8');
    expect(page('30000')).toContain('take-home 27550.43 for 30000');
    expect(page('70000')).toContain('take-home 53786.25 for 70000');
    expect(page('150000')).toContain('take-home 104319.88 for 150000');
  });

  it('writes the rendered page into the template and the data block for React', async () => {
    const dir = outDir();
    await build({ provinces: ontarioOnly, outDir: dir });
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
          steps,
          '70000',
          Object.fromEntries(steps.map((s) => [s, compute70000.take_home])),
        ),
        ...ontarioTargets,
      },
    });
  });

  it('takes `provisional` from the API list, not from the engine', async () => {
    const list = {
      jurisdictions: jurisdictions.jurisdictions.map((j) => ({
        ...j,
        years: j.years.map((y) => ({
          ...y,
          provisional: !compute70000.provisional,
        })),
      })),
    };
    const dir = outDir();
    await build({ provinces: ontarioOnly, outDir: dir }, list);
    const page = new DOMParser().parseFromString(
      readFileSync(join(dir, 'ca-on', '70000', 'index.html'), 'utf8'),
      'text/html',
    );
    const data = JSON.parse(
      page.getElementById('salary-page-data')?.textContent ?? '',
    ) as SalaryPageData;
    expect(data.response.provisional).toBe(!compute70000.provisional);
  });
});

describe('generateSalaryPages for Alberta', () => {
  const alberta = engineOf(alberta70000);

  it('writes 25 pages at ca-ab/<salary>/index.html', async () => {
    const dir = outDir();
    const result = await build(
      { provinces: albertaOnly, outDir: dir },
      withAlberta,
      () => alberta,
    );
    expect(files(dir, 'ca-ab')).toEqual([...steps].sort());
    expect(result.written).toHaveLength(25);
    expect(result.skipped).toEqual([]);
  });

  it('writes the $70,000 answer into the page and the data block, naming Alberta', async () => {
    const dir = outDir();
    await build(
      { provinces: albertaOnly, outDir: dir },
      withAlberta,
      () => alberta,
    );
    const page = new DOMParser().parseFromString(
      readFileSync(join(dir, 'ca-ab', '70000', 'index.html'), 'utf8'),
      'text/html',
    );
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
    const own: Record<string, EngineAnswer> = {
      '30000': engineOf(alberta30000),
      '150000': engineOf(alberta150000),
    };
    const dir = outDir();
    await build(
      { provinces: albertaOnly, outDir: dir },
      withAlberta,
      (_p, n) => own[n] ?? alberta,
    );
    const page = (salary: string) =>
      readFileSync(join(dir, 'ca-ab', salary, 'index.html'), 'utf8');
    expect(page('30000')).toContain('take-home 27450.71 for 30000 in CA-AB');
    expect(page('70000')).toContain('take-home 54107.20 for 70000 in CA-AB');
    expect(page('150000')).toContain('take-home 107457.96 for 150000 in CA-AB');
  });
});

describe('adding a province is one list entry', () => {
  it('writes its pages with the same code', async () => {
    const dir = outDir();
    const result = await build(
      { provinces: [...provinces, xland], outDir: dir },
      withXland,
    );
    expect(files(dir, 'ca-xx')).toEqual(['10000', '15000', '20000']);
    expect(files(dir, 'ca-on')).toHaveLength(25);
    expect(result.written).toContain('ca-xx/15000/index.html');
    expect(
      readFileSync(join(dir, 'ca-xx', '15000', 'index.html'), 'utf8'),
    ).toContain('in CA-XX 2026');
  });
});

describe('a listed province the API does not return', () => {
  const alberta = {
    ...xland,
    code: 'CA-AB',
    slug: 'ca-ab',
    from: 30000,
    to: 150000,
  };

  it('gets no pages, is reported, and does not fail the build', async () => {
    const dir = outDir();
    const result = await build({
      provinces: [...ontarioOnly, alberta],
      outDir: dir,
    });
    expect(readdirSync(dir)).toEqual(['ca-on']);
    expect(result.skipped).toEqual(['CA-AB']);
  });

  describe('with a site URL', () => {
    const siteUrl = 'https://aftertaxlens.com';

    it('fails the build before writing anything, naming the province and the API', async () => {
      const dir = outDir();
      const run = build({
        provinces: [...ontarioOnly, alberta],
        outDir: dir,
        siteUrl,
      });
      await expect(run).rejects.toThrow(
        `Alberta (CA-AB) is listed in build/salaryPages/provinces.ts but the API at ${baseUrl} does not return it. Release the service with it first, or take it out of the list.`,
      );
      expect(readdirSync(dir)).toEqual([]);
    });

    it('names every missing province in one error', async () => {
      const run = build({
        provinces: [...ontarioOnly, alberta, { ...xland, from: 10000 }],
        siteUrl,
      });
      await expect(run).rejects.toThrow(/Alberta/);
      await expect(run).rejects.toThrow(/CA-XX/);
    });

    it('still skips and reports when the site URL is null', async () => {
      const result = await build({
        provinces: [...ontarioOnly, alberta],
        siteUrl: null,
      });
      expect(result.skipped).toEqual(['CA-AB']);
    });

    it('builds as before when the API returns every listed province', async () => {
      const result = await build(
        { provinces: [...ontarioOnly, alberta], siteUrl },
        withAlberta,
      );
      expect(result.skipped).toEqual([]);
      expect(result.written).toHaveLength(50);
    });
  });
});

describe('the build fails clearly', () => {
  it('names the page when the engine has no answer for it', async () => {
    const answers = engineOptions(ontarioOnly).answers;
    delete answers['CA-ON']?.['45000'];
    const run = build({ provinces: ontarioOnly, answers });
    await expect(run).rejects.toThrow('ca-on/45000 has no engine answer');
  });

  it('names the page when an answer does not fit the page guard', async () => {
    const run = build({ provinces: ontarioOnly }, undefined, (_p, n) =>
      n === '45000' ? { ...on, take_home: 45000 as unknown as string } : on,
    );
    await expect(run).rejects.toThrow(/ca-on\/45000 data does not fit/);
  });

  it('says so when the API does not list the province for its year', async () => {
    const run = build({
      provinces: ontarioOnly.map((p) => ({ ...p, year: 2019 })),
    });
    await expect(run).rejects.toThrow(/CA-ON 2019 is not listed/);
  });

  it('leaves nothing written under outDir when any page fails', async () => {
    const dir = outDir();
    await build({ provinces: ontarioOnly, outDir: dir }, undefined, (_p, n) =>
      n === '150000' ? { ...on, take_home: 1 as unknown as string } : on,
    ).catch(() => undefined);
    expect(readdirSync(dir)).toEqual([]);
  });
});

describe('a page whose text is too long fails the build', () => {
  /** The API lists Ontario's code under a very long name. */
  function namedAs(name: string) {
    return () => ({
      ...jurisdictions,
      jurisdictions: jurisdictions.jurisdictions.map((j) => ({ ...j, name })),
    });
  }
  const long = 'The Very Long Named Province of Somewhere Far Away';

  function buildNamed(name: string, dir: string) {
    return build({ provinces, outDir: dir }, namedAs(name)());
  }

  it('throws, naming the page and the title, when a title is 60 or more', async () => {
    await expect(buildNamed(long, outDir())).rejects.toThrow(
      /ca-on\/30000.*title/is,
    );
  });

  it('writes nothing when it throws', async () => {
    const dir = outDir();
    await buildNamed(long, dir).catch(() => undefined);
    expect(readdirSync(dir)).toEqual([]);
  });

  it('builds as before when the limits hold', async () => {
    const result = await buildNamed('Ontario', outDir());
    expect(result.written).toHaveLength(25);
  });
});

describe('generateSalaryPages is deterministic', () => {
  async function buildTwice() {
    const dir = outDir();
    const result = await build({
      provinces: ontarioOnly,
      outDir: dir,
      siteUrl: 'https://aftertaxlens.com',
    });
    return { dir, written: result.written };
  }

  it('writes byte-identical pages on two runs', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-11-15T10:00:00Z'));
      const first = await buildTwice();
      vi.setSystemTime(new Date('2026-12-20T22:00:00Z'));
      const second = await buildTwice();
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
    const { dir, written } = await buildTwice();
    for (const file of written) {
      expect(readFileSync(join(dir, file), 'utf8')).not.toMatch(
        /\d{4}-\d{2}-\d{2}T\d{2}:/,
      );
    }
  });
});

describe('a full run over the real province list', () => {
  it('writes one page per salary step of every province, ', async () => {
    const listed = {
      jurisdictions: provinces.map((p) => ({
        code: p.code,
        name: p.slug,
        years: [{ year: p.year, provisional: false }],
      })),
    };
    const dir = outDir();
    const result = await build({ provinces, outDir: dir }, listed);
    const expected = provinces.reduce((sum, p) => sum + salaries(p).length, 0);
    expect(result.written).toHaveLength(expected);
    expect(new Set(result.written).size).toBe(expected);
  });
});
