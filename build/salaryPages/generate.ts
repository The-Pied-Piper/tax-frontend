import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  ApiError,
  createApiClient,
  type ComputeTakeHomeCalculationResponse,
  type ListJurisdictionsResponse,
} from '../../src/api';
import { languageCode } from '../../src/strings';
import type { SalaryPageData } from '../../src/state/useTakeHome';
import { buildPageHtml } from './pageHtml';
import { pageMeta } from './pageMeta';
import { DESCRIPTION_LIMIT, TITLE_LIMIT } from './limits';
import { salaries, type Province } from './provinces';

export type GenerateOptions = {
  fetch: typeof fetch;
  baseUrl: string;
  provinces: Province[];
  outDir: string;
  /** The built index.html. */
  template: string;
  /** The real App as a string for one page's data. */
  render: (data: SalaryPageData) => string;
};

export type GenerateResult = {
  /** Paths written, relative to outDir. */
  written: string[];
  /** Listed provinces the API did not return, so got no pages. */
  skipped: string[];
};

function reason(error: unknown): string {
  if (error instanceof ApiError) return `status ${error.status.toString()}`;
  return error instanceof Error ? error.message : 'unknown error';
}

/** Writes one finished page per listed province and salary step. Fails on the first API problem. */
export async function generateSalaryPages(
  options: GenerateOptions,
): Promise<GenerateResult> {
  const { baseUrl, provinces, outDir, template, render } = options;
  const client = createApiClient({ baseUrl, fetch: options.fetch });

  let list: ListJurisdictionsResponse;
  try {
    list = await client.listJurisdictions();
  } catch (error) {
    throw new Error(
      `Salary pages: GET ${baseUrl}/jurisdictions failed: ${reason(error)}`,
      { cause: error },
    );
  }

  const pages: { path: string; html: string }[] = [];
  const skipped: string[] = [];
  for (const province of provinces) {
    if (!list.jurisdictions.some((j) => j.code === province.code)) {
      skipped.push(province.code);
      continue;
    }
    for (const salary of salaries(province)) {
      const page = `${province.slug}/${salary.toString()}`;
      let response: ComputeTakeHomeCalculationResponse;
      try {
        response = await client.computeTakeHomeCalculation({
          jurisdiction_code: province.code,
          year: province.year,
          salary: salary.toString(),
          language_code: languageCode,
          include_trace: true,
        });
      } catch (error) {
        throw new Error(`Salary pages: ${page} failed: ${reason(error)}`, {
          cause: error,
        });
      }
      const data: SalaryPageData = {
        jurisdictions: list.jurisdictions,
        response,
        jurisdictionCode: province.code,
        year: province.year,
        salary: salary.toString(),
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
        html: buildPageHtml(template, render(data), data),
      });
    }
  }
  // Everything was fetched and rendered; only now is anything written.
  for (const { path, html } of pages) {
    const file = join(outDir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  return { written: pages.map((p) => p.path), skipped };
}
