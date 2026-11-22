import { ApiError, createApiClient } from '../../src/api';
import { pacedFetch, type PaceOptions } from './pacedFetch';
import {
  DEFAULT_ATTEMPTS,
  DEFAULT_TRY_TIMEOUT_MS,
  MAX_WAIT_MS,
  retryingFetch,
  timer,
} from './retryFetch';

/** The most time, in milliseconds, all the waits for 429s in one build may add up to. */
const DEFAULT_MAX_TOTAL_WAIT_MS = 600000;

/** The waits for 429s have used up the build's budget. */
class WaitBudgetError extends Error {
  constructor() {
    super('the API kept answering 429 and the wait budget was spent');
    this.name = 'WaitBudgetError';
  }
}

/**
 * How a 429 from the API is retried: `attempts` tries in all per call (default 6, at
 * least 1), the `sleep` between them (a real timer by default; tests pass an instant
 * one) and `maxTotalWaitMs`, the most all the waits of the whole build may add up to
 * (default 10 minutes); a wait that would pass it fails the build instead.
 */
export type RetryOptions = {
  attempts?: number;
  sleep?: (ms: number) => Promise<void>;
  maxTotalWaitMs?: number;
};

export type BuildApiOptions = {
  fetch: typeof fetch;
  baseUrl: string;
  retry?: RetryOptions;
  /**
   * Spaces the API calls: each starts at least `minGapMs` (default 200, so 5 a second)
   * after the previous one, with `sleep` and `now` as the clock (real ones by default;
   * tests pass fakes). The retries of a 429 are spaced too. Absent, calls are not paced.
   */
  pace?: PaceOptions;
};

/** The API client of one build, with the tries per call it was made with. */
export type BuildApi = {
  client: ReturnType<typeof createApiClient>;
  baseUrl: string;
  attempts: number;
};

/**
 * The one client a build's API calls go through: paced, with 429 retries, and with one
 * running wait total for the whole build, so a long throttle fails it rather than stalls
 * it. The salary pages and the sweep share it, so the API sees one queue.
 */
export function createBuildApi(options: BuildApiOptions): BuildApi {
  const attempts = Math.max(1, options.retry?.attempts ?? DEFAULT_ATTEMPTS);
  const sleepFor = options.retry?.sleep ?? timer;
  const maxTotalWaitMs =
    options.retry?.maxTotalWaitMs ?? DEFAULT_MAX_TOTAL_WAIT_MS;
  let waited = 0;
  const budgetedSleep = (ms: number) => {
    if (waited + ms > maxTotalWaitMs)
      return Promise.reject(new WaitBudgetError());
    waited += ms;
    return sleepFor(ms);
  };
  const client = createApiClient({
    baseUrl: options.baseUrl,
    // Pacing sits under the retries, so a retried call is spaced like any other.
    fetch: retryingFetch(
      options.pace ? pacedFetch(options.fetch, options.pace) : options.fetch,
      { attempts, sleep: budgetedSleep },
    ),
    // The client's one timer spans every try and wait of a call, so it must outlast them
    // all (each try has its own timer inside retryingFetch); the 1 s is slack.
    timeoutMs:
      attempts * DEFAULT_TRY_TIMEOUT_MS + (attempts - 1) * MAX_WAIT_MS + 1000,
  });
  return { client, baseUrl: options.baseUrl, attempts };
}

/** Why an API call failed, in words for a build error. */
export function reason(error: unknown, attempts: number): string {
  if (error instanceof ApiError) {
    const status = `status ${error.status.toString()}`;
    if (error.status !== 429) return status;
    return `${status} after ${attempts.toString()} ${attempts === 1 ? 'try' : 'tries'}`;
  }
  // The client wraps what the fetch throws, so the budget error is its cause.
  if (error instanceof Error && error.cause instanceof WaitBudgetError) {
    return error.cause.message;
  }
  return error instanceof Error ? error.message : 'unknown error';
}
