/** Tries made in all (the first and the retries) when none is given. */
export const DEFAULT_ATTEMPTS = 6;

const DEFAULT_BASE_DELAY_MS = 1000;
const MAX_RETRY_AFTER_SECONDS = 60;

export type RetryOptions = {
  /** Tries in all, the first included. */
  attempts?: number;
  /** Waits for the given milliseconds; a real timer unless a test passes its own. */
  sleep?: (ms: number) => Promise<void>;
  /** The first wait when the answer names none; each later wait doubles it. */
  baseDelayMs?: number;
};

function timer(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** The whole seconds 0 to the cap, as text; a number's place in it is its value. */
const CAPPED_SECONDS = Array.from(
  { length: MAX_RETRY_AFTER_SECONDS + 1 },
  (_, n) => n.toString(),
);

/** The wait the answer asks for in whole seconds (capped), or null when it asks for none. */
function retryAfterMs(response: Response): number | null {
  const header = response.headers.get('Retry-After')?.trim() ?? '';
  if (!/^\d+$/.test(header)) return null;
  const at = CAPPED_SECONDS.indexOf(header.replace(/^0+(?=\d)/, ''));
  return (at === -1 ? MAX_RETRY_AFTER_SECONDS : at) * 1000;
}

/**
 * A fetch that tries again when the answer is 429 (too many requests), waiting the
 * Retry-After seconds or else doubling from the base delay. Any other status and any
 * thrown error pass straight through; after the last try the final 429 is returned.
 */
export function retryingFetch(
  inner: typeof fetch,
  options: RetryOptions = {},
): typeof fetch {
  const {
    attempts = DEFAULT_ATTEMPTS,
    sleep = timer,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
  } = options;
  return async (input, init) => {
    let response = await inner(input, init);
    for (let n = 1; n < attempts && response.status === 429; n++) {
      await sleep(retryAfterMs(response) ?? baseDelayMs * 2 ** (n - 1));
      response = await inner(input, init);
    }
    return response;
  };
}
