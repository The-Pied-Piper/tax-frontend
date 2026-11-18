import { retryingFetch } from './retryFetch';

const url = 'https://api.test/x';

/** An inner fetch that answers from a script, one entry per call. */
function scripted(...answers: (Response | Error)[]) {
  let at = 0;
  const calls: string[] = [];
  const inner: typeof fetch = (input) => {
    calls.push(typeof input === 'string' ? input : 'other');
    const answer = answers[Math.min(at++, answers.length - 1)];
    if (!answer) return Promise.reject(new Error('empty script'));
    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve(answer.clone());
  };
  return { inner, calls };
}

function recorder() {
  const delays: number[] = [];
  const sleep = (ms: number) => {
    delays.push(ms);
    return Promise.resolve();
  };
  return { delays, sleep };
}

const tooMany = (headers?: Record<string, string>) =>
  new Response('slow', { status: 429, headers });

describe('retryingFetch', () => {
  it('returns a good answer at once without sleeping', async () => {
    const { inner, calls } = scripted(new Response('ok', { status: 200 }));
    const { delays, sleep } = recorder();
    const res = await retryingFetch(inner, { sleep })(url);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
    expect(calls).toHaveLength(1);
    expect(delays).toEqual([]);
  });

  it('retries a 429 and returns the good answer that follows', async () => {
    const { inner, calls } = scripted(
      tooMany(),
      tooMany(),
      new Response('ok', { status: 200 }),
    );
    const { delays, sleep } = recorder();
    const res = await retryingFetch(inner, { sleep })(url);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(3);
    expect(delays).toHaveLength(2);
  });

  it('backs off 1s, 2s, 4s by default', async () => {
    const { inner } = scripted(
      tooMany(),
      tooMany(),
      tooMany(),
      new Response('ok'),
    );
    const { delays, sleep } = recorder();
    await retryingFetch(inner, { sleep })(url);
    expect(delays).toEqual([1000, 2000, 4000]);
  });

  it('backs off from the given base delay', async () => {
    const { inner } = scripted(tooMany(), tooMany(), new Response('ok'));
    const { delays, sleep } = recorder();
    await retryingFetch(inner, { sleep, baseDelayMs: 250 })(url);
    expect(delays).toEqual([250, 500]);
  });

  it('waits the Retry-After seconds when the header is present', async () => {
    const { inner } = scripted(
      tooMany({ 'Retry-After': '3' }),
      tooMany({ 'Retry-After': '0' }),
      new Response('ok'),
    );
    const { delays, sleep } = recorder();
    await retryingFetch(inner, { sleep })(url);
    expect(delays).toEqual([3000, 0]);
  });

  it('caps Retry-After at 60 seconds', async () => {
    const { inner } = scripted(
      tooMany({ 'Retry-After': '3600' }),
      new Response('ok'),
    );
    const { delays, sleep } = recorder();
    await retryingFetch(inner, { sleep })(url);
    expect(delays).toEqual([60000]);
  });

  it('falls back to backoff when Retry-After is not whole seconds', async () => {
    const { inner } = scripted(
      tooMany({ 'Retry-After': 'soon' }),
      new Response('ok'),
    );
    const { delays, sleep } = recorder();
    await retryingFetch(inner, { sleep })(url);
    expect(delays).toEqual([1000]);
  });

  it('makes 6 tries by default, then returns the last 429', async () => {
    const { inner, calls } = scripted(tooMany());
    const { delays, sleep } = recorder();
    const res = await retryingFetch(inner, { sleep })(url);
    expect(res.status).toBe(429);
    expect(calls).toHaveLength(6);
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000]);
  });

  it('makes the configured number of tries in all', async () => {
    const { inner, calls } = scripted(tooMany());
    const { delays, sleep } = recorder();
    const res = await retryingFetch(inner, { sleep, attempts: 3 })(url);
    expect(res.status).toBe(429);
    expect(calls).toHaveLength(3);
    expect(delays).toHaveLength(2);
  });

  it.each([400, 404, 500, 503])(
    'returns a %i at once, untouched',
    async (status) => {
      const { inner, calls } = scripted(new Response('no', { status }));
      const { delays, sleep } = recorder();
      const res = await retryingFetch(inner, { sleep })(url);
      expect(res.status).toBe(status);
      expect(calls).toHaveLength(1);
      expect(delays).toEqual([]);
    },
  );

  it('lets a network error through at once, without retrying', async () => {
    const boom = new TypeError('network down');
    const { inner, calls } = scripted(boom, new Response('ok'));
    const { delays, sleep } = recorder();
    await expect(retryingFetch(inner, { sleep })(url)).rejects.toBe(boom);
    expect(calls).toHaveLength(1);
    expect(delays).toEqual([]);
  });

  it('passes the request on to the inner fetch each try', async () => {
    const seen: unknown[] = [];
    let n = 0;
    const inner: typeof fetch = (input, init) => {
      seen.push([input, init?.method]);
      return Promise.resolve(n++ === 0 ? tooMany() : new Response('ok'));
    };
    const { sleep } = recorder();
    await retryingFetch(inner, { sleep })(url, { method: 'POST' });
    expect(seen).toEqual([
      [url, 'POST'],
      [url, 'POST'],
    ]);
  });

  it.each([0, -3])('clamps attempts of %i to one try', async (attempts) => {
    const { inner, calls } = scripted(tooMany());
    const { delays, sleep } = recorder();
    const res = await retryingFetch(inner, { sleep, attempts })(url);
    expect(res.status).toBe(429);
    expect(calls).toHaveLength(1);
    expect(delays).toEqual([]);
  });

  it('cancels the body of a 429 it retries', async () => {
    const cancelled: number[] = [];
    let n = 0;
    const inner: typeof fetch = () => {
      const at = n++;
      if (at > 0) return Promise.resolve(new Response('ok'));
      const body = new ReadableStream<Uint8Array>({
        pull(controller) {
          controller.enqueue(new Uint8Array([1]));
        },
        cancel() {
          cancelled.push(at);
        },
      });
      return Promise.resolve(new Response(body, { status: 429 }));
    };
    const { sleep } = recorder();
    const res = await retryingFetch(inner, { sleep })(url);
    expect(res.status).toBe(200);
    expect(cancelled).toEqual([0]);
  });
});

describe('retryingFetch per-try timeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** An inner fetch that never answers and rejects when its signal aborts. */
  function hanging() {
    const signals: (AbortSignal | undefined)[] = [];
    const inner: typeof fetch = (_input, init) => {
      signals.push(init?.signal ?? undefined);
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(
            init.signal?.reason instanceof Error
              ? init.signal.reason
              : new DOMException('aborted', 'AbortError'),
          );
        });
      });
    };
    return { inner, signals };
  }

  it('aborts a hung try after tryTimeoutMs, without retrying it', async () => {
    vi.useFakeTimers();
    const { inner, signals } = hanging();
    const { delays, sleep } = recorder();
    let outcome: 'pending' | 'rejected' | 'resolved' = 'pending';
    const run = retryingFetch(inner, { sleep, tryTimeoutMs: 500 })(url).then(
      () => (outcome = 'resolved'),
      () => (outcome = 'rejected'),
    );
    await vi.advanceTimersByTimeAsync(499);
    expect(outcome).toBe('pending');
    await vi.advanceTimersByTimeAsync(1);
    void run;
    expect(outcome).toBe('rejected');
    expect(signals).toHaveLength(1);
    expect(signals[0]?.aborted).toBe(true);
    expect(delays).toEqual([]);
  });

  it('also aborts the try when the caller aborts', async () => {
    const { inner, signals } = hanging();
    const { sleep } = recorder();
    const caller = new AbortController();
    const run = retryingFetch(inner, { sleep })(url, {
      signal: caller.signal,
    });
    caller.abort();
    await expect(run).rejects.toBeInstanceOf(Error);
    expect(signals[0]?.aborted).toBe(true);
  });

  it('does not count the sleeps against the try timeout', async () => {
    vi.useFakeTimers();
    const { inner, calls } = scripted(
      tooMany({ 'Retry-After': '20' }),
      new Response('ok'),
    );
    const sleep = async (ms: number) => {
      await vi.advanceTimersByTimeAsync(ms);
    };
    const res = await retryingFetch(inner, { sleep, tryTimeoutMs: 1000 })(url);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(2);
  });
});
