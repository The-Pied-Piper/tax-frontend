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
});
