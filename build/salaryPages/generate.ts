import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type {
  ComputeTakeHomeCalculationResponse,
  ListJurisdictionsResponse,
} from '../../src/api';
import { dollarSign, responseUnit } from '../../src/adapters/fallback';
import { displayWholeMoney } from '../../src/money/format';
import { salaryBreadcrumb } from '../../src/state/breadcrumbs';
import { breadcrumbJsonLd } from '../breadcrumbJsonLd';
import { strings } from '../../src/strings';
import type { Unit } from '../../src/adapters';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { parseSalaryPageData } from '../../src/state/salaryPageData';
import { pagePath, pageUrl } from './address';
import { buildPageHtml } from './pageHtml';
import { pageMeta } from './pageMeta';
import { DESCRIPTION_LIMIT, TITLE_LIMIT } from './limits';
import { salaryLinks } from './links';
import { provinceLinks } from '../../src/state/salaryPageLinks';
import { salaries, type Province } from './provinces';

/**
 * The engine's answer for one salary: the API's response without `provisional`, which is the
 * service's policy and not the engine's, so the build adds it from the list of jurisdictions.
 */
export type EngineAnswer = Omit<
  ComputeTakeHomeCalculationResponse,
  'provisional'
>;

/** The engine's answers by jurisdiction code, then by the salary as written in the page address. */
export type EngineAnswers = Record<string, Record<string, EngineAnswer>>;

/** What was built for one province: its salary steps, lowest first, and the unit of its answers. */
export type BuiltProvince = {
  province: Province;
  unit: Unit;
  salaries: string[];
};

export type GenerateOptions = {
  /** What the local engine answered for every page salary (build/localEngine). */
  answers: EngineAnswers;
  /** The API's list of jurisdictions: who is served, their display names and which years are provisional. */
  list: ListJurisdictionsResponse;
  /** The API address, named in the message when a listed province is not served. */
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
   * build before anything is written; without it such a province is skipped.
   */
  siteUrl?: string | null;
};

export type GenerateResult = {
  /** Paths written, relative to outDir. */
  written: string[];
  /** Listed provinces the API did not return, so got no pages (only without a site URL; with one, generating throws instead). */
  skipped: string[];
  /** What was written, by province: the one list the hub pages' salary links come from. */
  built: BuiltProvince[];
};

/** Writes one finished page per listed province and salary step, from the engine's answers. Fails on the first answer that is missing. */
export async function generateSalaryPages(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const { baseUrl, provinces, outDir, template, render, list, answers } =
    options;

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
    const provisional = list.jurisdictions
      .find((j) => j.code === province.code)
      ?.years.find((y) => y.year === province.year)?.provisional;
    if (provisional === undefined) {
      throw new Error(
        `Salary pages: ${province.code} ${province.year.toString()} is not listed by the API at ${baseUrl}`,
      );
    }
    const responses: ComputeTakeHomeCalculationResponse[] = [];
    for (const salary of steps) {
      const page = `${province.slug}/${salary}`;
      const answer = answers[province.code]?.[salary];
      if (!answer) {
        throw new Error(`Salary pages: ${page} has no engine answer`);
      }
      // The page and its data block carry "$", never the engine's "CA$".
      responses.push(
        JSON.parse(
          dollarSign(JSON.stringify({ ...answer, provisional })),
        ) as ComputeTakeHomeCalculationResponse,
      );
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
      // The same guard the page applies to its data block when it loads.
      if (parseSalaryPageData(JSON.stringify(data)) === null) {
        throw new Error(
          `Salary pages: ${page} data does not fit the page's guard`,
        );
      }
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
