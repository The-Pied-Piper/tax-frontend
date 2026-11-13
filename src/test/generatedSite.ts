// Test data only: nothing in the build imports this file. Shared stand-ins for
// the tests that generate salary pages into a temporary folder.
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ComputeTakeHomeCalculationResponse } from '../api';
import fixture70000 from '../api/fixtures/compute-on-2026-70000.json';
import jurisdictions from '../api/fixtures/jurisdictions.json';
import type { Province } from '../../build/salaryPages/provinces';

export const apiBaseUrl = 'https://api.test/api/v1';
export const siteUrl = 'https://aftertaxlens.com';
/** The calculator's index.html, the template of every page. */
export const template = readFileSync('index.html', 'utf8');

/** A made-up second province, to show that adding one is one list entry. */
export const xland: Province = {
  code: 'CA-XX',
  slug: 'ca-xx',
  year: 2026,
  from: 10000,
  to: 20000,
  step: 5000,
};
/** The API's list with the made-up province added. */
export const withXland = {
  jurisdictions: [
    ...jurisdictions.jurisdictions,
    {
      code: 'CA-XX',
      name: 'Xland',
      years: [{ year: 2026, provisional: false }],
    },
  ],
};

/** The API's list with Alberta added, as it lists it: 2026 provisional. */
export const withAlberta = {
  jurisdictions: [
    ...jurisdictions.jurisdictions,
    {
      code: 'CA-AB',
      name: 'Alberta',
      years: [{ year: 2026, provisional: true }],
    },
  ],
};

function urlOf(input: Parameters<typeof fetch>[0]): string {
  return typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
}

/** A stand-in tax-service: the saved list of places, and the $70,000 answer for every request. */
export function fakeFetch(list: unknown = jurisdictions): typeof fetch {
  return (input) => {
    const url = urlOf(input);
    if (url === `${apiBaseUrl}/jurisdictions`) {
      return Promise.resolve(Response.json(list));
    }
    if (url === `${apiBaseUrl}/take-home-calculations:compute`) {
      return Promise.resolve(
        Response.json(fixture70000 as ComputeTakeHomeCalculationResponse),
      );
    }
    return Promise.reject(new Error(`unexpected request ${url}`));
  };
}

/**
 * Call once at the top of a test file. Returns a function that makes a new
 * temporary folder; every folder is removed after each test.
 */
export function tmpDirs(prefix: string): () => string {
  const made: string[] = [];
  afterEach(() => {
    for (const dir of made.splice(0))
      rmSync(dir, { recursive: true, force: true });
  });
  return () => {
    const dir = mkdtempSync(join(tmpdir(), `${prefix}-`));
    made.push(dir);
    return dir;
  };
}
