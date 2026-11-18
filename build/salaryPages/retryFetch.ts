/** Tries made in all (the first and the retries) when none is given. */
export const DEFAULT_ATTEMPTS = 6;

/** How long one try may take to answer, in milliseconds, when none is given. */
export const DEFAULT_TRY_TIMEOUT_MS = 15000;
/** The longest single wait between tries, in milliseconds. */
export const MAX_WAIT_MS = 60000;

const DEFAULT_BASE_DELAY_MS = 1000;
const MAX_RETRY_AFTER_SECONDS = MAX_WAIT_MS / 1000;

export type RetryOptions = {
  /** Tries in all, the first included. */
  attempts?: number;
  /** Waits for the given milliseconds; a real timer unless a test passes its own. */
  sleep?: (ms: number) => Promise<void>;
  /** The first wait when the answer names none; each later wait doubles it. */
  baseDelayMs?: number;
  /** How long each try may take to answer; the waits between tries are not counted. */
  tryTimeoutMs?: number;
};

/** Waits for the given milliseconds with a real timer. */
export function timer(ms: number): Promise<void> {
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

/** One try with its own timer, ended early by either the timer or the caller's signal. */
async function timedTry(
  inner: typeof fetch,
  input: Parameters<typeof fetch>[0],
  init: RequestInit | undefined,
  tryTimeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const caller = init?.signal;
  const stop = (reason: unknown) => {
    controller.abort(
      reason instanceof Error
        ? reason
        : new DOMException('The request was aborted', 'AbortError'),
    );
  };
  const onCallerAbort = () => {
    stop(caller?.reason);
  };
  if (caller?.aborted) onCallerAbort();
  else caller?.addEventListener('abort', onCallerAbort);
  const timer = setTimeout(() => {
    stop(new DOMException('The request took too long', 'TimeoutError'));
  }, tryTimeoutMs);
  try {
    return await inner(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    caller?.removeEventListener('abort', onCallerAbort);
  }
}

/**
 * A fetch that tries again when the answer is 429 (too many requests), waiting the
 * Retry-After seconds or else doubling from the base delay. Each try has its own
 * timeout (the waits are outside it); a try that hangs fails and is not retried. Any
 * other status and any thrown error pass straight through; after the last try the
 * final 429 is returned. Fewer than one attempt counts as one.
 */
export function retryingFetch(
  inner: typeof fetch,
  options: RetryOptions = {},
): typeof fetch {
  const {
    sleep = timer,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    tryTimeoutMs = DEFAULT_TRY_TIMEOUT_MS,
  } = options;
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
  return async (input, init) => {
    let response = await timedTry(inner, input, init, tryTimeoutMs);
    for (let n = 1; n < attempts && response.status === 429; n++) {
      // Not awaited: a cancel can wait on another reader of the same body, and nothing here needs it done.
      void response.body?.cancel().catch(() => undefined);
      await sleep(retryAfterMs(response) ?? baseDelayMs * 2 ** (n - 1));
      response = await timedTry(inner, input, init, tryTimeoutMs);
    }
    return response;
  };
}
