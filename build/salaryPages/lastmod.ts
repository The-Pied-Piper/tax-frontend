import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { addressOf } from './address';

export type Clock = () => Date;
export type PageHashes = Record<string, { hash: string; lastmod: string }>;

/** How long to wait for the live site before building without it. */
const liveTimeoutMs = 10_000;

/** The SHA-256 of a page's final HTML, as lowercase hex. */
export function hashHtml(html: string): string {
  return createHash('sha256').update(html).digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A real `YYYY-MM-DD` date: month 13 or day 45 is refused. */
function isCalendarDate(text: string): boolean {
  const date = new Date(text);
  return (
    date.toString() !== 'Invalid Date' && date.toISOString().startsWith(text)
  );
}

function isPageHashes(value: unknown): value is PageHashes {
  if (!isRecord(value)) return false;
  return Object.values(value).every(
    (entry) =>
      isRecord(entry) &&
      typeof entry.hash === 'string' &&
      /^[0-9a-f]{64}$/.test(entry.hash) &&
      typeof entry.lastmod === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(entry.lastmod) &&
      isCalendarDate(entry.lastmod),
  );
}

/**
 * The page-hashes.json the live site serves, or null (after one warning) when
 * it cannot be fetched or is not a valid file. Never throws.
 */
export async function fetchLiveHashes(
  siteUrl: string,
  fetcher: typeof fetch,
  warn: (message: string) => void,
): Promise<PageHashes | null> {
  const url = `${siteUrl}/page-hashes.json`;
  try {
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(liveTimeoutMs),
    });
    if (!response.ok) {
      warn(
        `Sitemap: ${url} answered ${response.status.toString()} (first build?); every page gets today's date`,
      );
      return null;
    }
    const body: unknown = await response.json();
    if (isPageHashes(body)) return body;
    warn(
      `Sitemap: ${url} is not a valid page list; every page gets today's date`,
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    warn(
      `Sitemap: could not read ${url} (${reason}); every page gets today's date`,
    );
  }
  return null;
}

/**
 * Each page's hash and last-modified date: a page whose hash matches the live
 * file keeps its date, any other page gets today's UTC date.
 */
export function nextHashes(
  current: Record<string, string>,
  live: PageHashes | null,
  now: Clock,
): PageHashes {
  const today = now().toISOString().slice(0, 10);
  const next: PageHashes = {};
  for (const [path, hash] of Object.entries(current)) {
    const before = live?.[path];
    next[path] = {
      hash,
      lastmod: before?.hash === hash ? before.lastmod : today,
    };
  }
  return next;
}

/**
 * Hashes every written page, dates them against the live site's file, and
 * writes dist/page-hashes.json (keys sorted). Files are paths below outDir:
 * `index.html` and `<slug>/<salary>/index.html`.
 */
export async function writePageHashes(
  outDir: string,
  siteUrl: string,
  files: string[],
  deps: { fetch: typeof fetch; now: Clock; warn: (message: string) => void },
): Promise<PageHashes> {
  const current: Record<string, string> = {};
  for (const file of files) {
    const html = await readFile(join(outDir, file), 'utf8');
    current[file === 'index.html' ? '/' : addressOf(file)] = hashHtml(html);
  }
  const live = await fetchLiveHashes(siteUrl, deps.fetch, deps.warn);
  const next = nextHashes(current, live, deps.now);
  const sorted: PageHashes = {};
  for (const path of Object.keys(next).sort()) {
    const entry = next[path];
    if (entry) sorted[path] = entry;
  }
  await writeFile(
    join(outDir, 'page-hashes.json'),
    `${JSON.stringify(sorted, null, 2)}\n`,
  );
  return sorted;
}

/**
 * The last-modified date of every written page by address, with
 * dist/page-hashes.json written beside them. With no site address there are no
 * dates and nothing is written.
 */
export async function pageDates(
  outDir: string,
  siteUrl: string | null,
  files: string[],
  deps: { fetch: typeof fetch; now: Clock; warn: (message: string) => void },
): Promise<Record<string, string>> {
  if (siteUrl === null) return {};
  const hashes = await writePageHashes(outDir, siteUrl, files, deps);
  return Object.fromEntries(
    Object.entries(hashes).map(([path, { lastmod }]) => [path, lastmod]),
  );
}
