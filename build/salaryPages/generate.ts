import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  ApiError,
  createApiClient,
  type ComputeTakeHomeCalculationResponse,
  type ListJurisdictionsResponse,
} from '../../src/api';
import { dollarSign, responseUnit } from '../../src/adapters/fallback';
import { displayWholeMoney } from '../../src/money/format';
import { salaryBreadcrumb } from '../../src/state/breadcrumbs';
import { breadcrumbJsonLd } from '../breadcrumbJsonLd';
import { languageCode, strings } from '../../src/strings';
import type { Unit } from '../../src/adapters';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { pagePath, pageUrl } from './address';
import { buildPageHtml } from './pageHtml';
import { pageMeta } from './pageMeta';
import { DESCRIPTION_LIMIT, TITLE_LIMIT } from './limits';
import { salaryLinks } from './links';
import { provinceLinks } from '../../src/state/salaryPageLinks';
import { salaries, type Province } from './provinces';
import { DEFAULT_ATTEMPTS, retryingFetch } from './retryFetch';

/** What was built for one province: its salary steps, lowest first, and the unit of its answers. */
export type BuiltProvince = {
  province: Province;
  unit: Unit;
  salaries: string[];
};

export type GenerateOptions = {
  fetch: typeof fetch;
  baseUrl: string;
  provinces: Province[];
  outDir: string;
  /** The slugs of the content pages in the build, such as `methodology` and `forms/on428`. */
  published: ReadonlySet<string>;
  /** The built index.html. */
  template: string;
  /** The real App as a string for one page's data. */
  render: (data: SalaryPageData) => string;
  /**
   * The normalized site origin; null leaves canonical and og:url as the template has them.
   * When set (a prod-shaped build), a listed province the API does not return fails the
   * build before anything is fetched or written; without it such a province is skipped.
   */
  siteUrl?: string | null;
  /**
   * How a 429 from the API is retried: `attempts` tries in all per call (default 6) and
   * the `sleep` between them (a real timer by default; tests pass an instant one).
   */
  retry?: { attempts?: number; sleep?: (ms: number) => Promise<void> };
};

export type GenerateResult = {
  /** Paths written, relative to outDir. */
  written: string[];
  /** Listed provinces the API did not return, so got no pages (only without a site URL; with one, generating throws instead). */
  skipped: string[];
  /** What was written, by province: the one list the hub pages' salary links come from. */
  built: BuiltProvince[];
};

function reason(error: unknown, attempts: number): string {
  if (error instanceof ApiError) {
    const status = `status ${error.status.toString()}`;
    return error.status === 429
      ? `${status} after ${attempts.toString()} tries`
      : status;
  }
  return error instanceof Error ? error.message : 'unknown error';
}

/** Writes one finished page per listed province and salary step. Retries a 429 from the API, then fails on the first API problem. */
export async function generateSalaryPages(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const { baseUrl, provinces, outDir, template, render } = options;
  const attempts = options.retry?.attempts ?? DEFAULT_ATTEMPTS;
  const client = createApiClient({
    baseUrl,
    fetch: retryingFetch(options.fetch, {
      attempts,
      sleep: options.retry?.sleep,
    }),
  });

  let list: ListJurisdictionsResponse;
  try {
    list = await client.listJurisdictions();
  } catch (error) {
    throw new Error(
      `Salary pages: GET ${baseUrl}/jurisdictions failed: ${reason(error, attempts)}`,
      { cause: error },
    );
  }

  const placeNames = strings.siteNav.provinceNames as Record<
    string,
    string | undefined
  >;
  const missing = provinces.filter(
    (p) => !list.jurisdictions.some((j) => j.code === p.code),
  );
  if (options.siteUrl && missing.length > 0) {
    throw new Error(
      missing
        .map(
          (p) =>
            `${placeNames[p.slug] ?? p.code} (${p.code}) is listed in build/salaryPages/provinces.ts but the API at ${baseUrl} does not return it. Release the service with it first, or take it out of the list.`,
        )
        .join('\n'),
    );
  }

  const fetched: {
    province: Province;
    steps: string[];
    responses: ComputeTakeHomeCalculationResponse[];
  }[] = [];
  const skipped: string[] = [];
  for (const province of provinces) {
    if (missing.includes(province)) {
      skipped.push(province.code);
      continue;
    }
    const steps = salaries(province).map((salary) => salary.toString());
    const responses: ComputeTakeHomeCalculationResponse[] = [];
    for (const salary of steps) {
      const page = `${province.slug}/${salary}`;
      try {
        const answer = await client.computeTakeHomeCalculation({
          jurisdiction_code: province.code,
          year: province.year,
          salary,
          language_code: languageCode,
          include_trace: true,
        });
        // The page and its data block carry "$", never the API's "CA$".
        responses.push(
          JSON.parse(
            dollarSign(JSON.stringify(answer)),
          ) as ComputeTakeHomeCalculationResponse,
        );
      } catch (error) {
        throw new Error(
          `Salary pages: ${page} failed: ${reason(error, attempts)}`,
          {
            cause: error,
          },
        );
      }
    }
    fetched.push({ province, steps, responses });
  }
  const built: BuiltProvince[] = fetched.map(
    ({ province, steps, responses }) => {
      const [first] = responses;
      if (!first)
        throw new Error(`Salary pages: no answer for ${province.code}`);
      return { province, unit: first.unit, salaries: steps };
    },
  );
  const pages: { path: string; html: string }[] = [];
  for (const { province, steps, responses } of fetched) {
    // The name the hubs use, so the breadcrumb and the hub's own title agree.
    const placeName =
      placeNames[province.slug] ??
      list.jurisdictions.find((j) => j.code === province.code)?.name ??
      province.code;
    // Each link shows the take_home of the page it points to: this province's own responses.
    const takeHomes: Record<string, string> = {};
    steps.forEach((step, at) => {
      const answer = responses[at];
      if (!answer) throw new Error(`Salary pages: no answer for ${step}`);
      takeHomes[step] = answer.take_home;
    });
    // Links go only to the pages of this province that are about to be written.
    steps.forEach((salary, at) => {
      const response = responses[at];
      if (!response) throw new Error(`Salary pages: no answer for ${salary}`);
      const page = `${province.slug}/${salary}`;
      const links = {
        ...salaryLinks(province.slug, steps, salary, takeHomes),
        ...provinceLinks(province.slug, placeName, options.published),
      };
      const data: SalaryPageData = {
        jurisdictions: list.jurisdictions,
        response,
        jurisdictionCode: province.code,
        year: province.year,
        salary,
        links,
      };
      const meta = pageMeta(data);
      if (meta.title.length >= TITLE_LIMIT) {
        throw new Error(
          `Salary pages: ${page} title is ${meta.title.length.toString()} characters, limit ${(TITLE_LIMIT - 1).toString()}`,
        );
      }
      if (meta.description.length >= DESCRIPTION_LIMIT) {
        throw new Error(
          `Salary pages: ${page} description is ${meta.description.length.toString()} characters, limit ${(DESCRIPTION_LIMIT - 1).toString()}`,
        );
      }
      pages.push({
        path: `${page}/index.html`,
        html: buildPageHtml(
          template,
          render(data),
          data,
          options.siteUrl
            ? pageUrl(options.siteUrl, province.slug, salary)
            : null,
          options.siteUrl
            ? breadcrumbJsonLd(
                salaryBreadcrumb(
                  links.hub,
                  displayWholeMoney(
                    response.salary,
                    'annually',
                    responseUnit(response),
                  ),
                ),
                options.siteUrl,
                pagePath(province.slug, salary),
              )
            : null,
        ),
      });
    });
  }
  // Everything was fetched and rendered; only now is anything written.
  for (const { path, html } of pages) {
    const file = join(outDir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  return { written: pages.map((p) => p.path), skipped, built };
}
