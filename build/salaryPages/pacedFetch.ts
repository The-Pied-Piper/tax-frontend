import { timer } from './retryFetch';

/** The shortest time between the starts of two calls, in milliseconds, when none is given: 5 a second. */
export const DEFAULT_MIN_GAP_MS = 200;

export type PaceOptions = {
  /** The least time between the start of one call and the start of the next. */
  minGapMs?: number;
  /** Waits for the given milliseconds; a real timer unless a test passes its own. */
  sleep?: (ms: number) => Promise<void>;
  /** The clock, in milliseconds; the real one unless a test passes its own. */
  now?: () => number;
};

/**
 * A fetch that starts its calls at least `minGapMs` apart. Each call waits only what is
 * left of the gap since the previous call started, so a slow answer adds no extra wait;
 * the first call starts at once and calls made together start one at a time, in order.
 * What the inner fetch answers or throws passes straight through and the next call is
 * paced all the same.
 */
export function pacedFetch(
  inner: typeof fetch,
  options: PaceOptions = {},
): typeof fetch {
  const {
    minGapMs = DEFAULT_MIN_GAP_MS,
    sleep = timer,
    now = Date.now,
  } = options;
  let lastStart: number | null = null;
  // The turn of the latest caller; each caller waits for the one before it to start.
  let queue: Promise<void> = Promise.resolve();
  return (input, init) => {
    const turn = queue.then(async () => {
      if (lastStart !== null) {
        const wait = lastStart + minGapMs - now();
        if (wait > 0) await sleep(wait);
      }
      lastStart = now();
    });
    queue = turn.catch(() => undefined);
    return turn.then(() => inner(input, init));
  };
}
