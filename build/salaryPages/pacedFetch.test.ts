import { pacedFetch } from './pacedFetch';

const url = 'https://api.test/x';

/** The number at a place in a list; throws rather than hide a missing one. */
function at(list: number[], index: number): number {
  const value = list[index];
  if (value === undefined) throw new Error(`no entry at ${index.toString()}`);
  return value;
}

/** A fake clock whose sleep records the wait and moves the clock on by it. */
function clock() {
  let t = 1000;
  const waits: number[] = [];
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
    waits,
    sleep: (ms: number) => {
      waits.push(ms);
      t += ms;
      return Promise.resolve();
    },
  };
}

/** An inner fetch that notes when each call started and takes `took` ms to answer. */
function timed(c: ReturnType<typeof clock>, took = 0) {
  const starts: number[] = [];
  const inner: typeof fetch = () => {
    starts.push(c.now());
    c.advance(took);
    return Promise.resolve(new Response('ok'));
  };
  return { inner, starts };
}

describe('pacedFetch', () => {
  it('starts the first call at once, without sleeping', async () => {
    const c = clock();
    const { inner, starts } = timed(c);
    const paced = pacedFetch(inner, { sleep: c.sleep, now: c.now });
    const res = await paced(url);
    expect(await res.text()).toBe('ok');
    expect(c.waits).toEqual([]);
    expect(starts).toEqual([1000]);
  });

  it('makes a second call straight after the first wait the whole 200 ms', async () => {
    const c = clock();
    const { inner, starts } = timed(c);
    const paced = pacedFetch(inner, { sleep: c.sleep, now: c.now });
    await paced(url);
    await paced(url);
    expect(c.waits).toEqual([200]);
    expect(starts).toEqual([1000, 1200]);
  });

  it('waits only the rest of the gap after a slow answer (took 150, waits 50)', async () => {
    const c = clock();
    const { inner, starts } = timed(c, 150);
    const paced = pacedFetch(inner, { sleep: c.sleep, now: c.now });
    await paced(url);
    await paced(url);
    expect(c.waits).toEqual([50]);
    expect(at(starts, 1) - at(starts, 0)).toBe(200);
  });

  it('does not sleep when the answer took longer than the gap', async () => {
    const c = clock();
    const { inner, starts } = timed(c, 350);
    const paced = pacedFetch(inner, { sleep: c.sleep, now: c.now });
    await paced(url);
    await paced(url);
    expect(c.waits.filter((ms) => ms > 0)).toEqual([]);
    expect(starts).toEqual([1000, 1350]);
  });

  it('never sleeps with a gap of 0', async () => {
    const c = clock();
    const { inner, starts } = timed(c);
    const paced = pacedFetch(inner, {
      minGapMs: 0,
      sleep: c.sleep,
      now: c.now,
    });
    for (let n = 0; n < 4; n++) await paced(url);
    expect(c.waits).toEqual([]);
    expect(starts).toHaveLength(4);
  });

  it('honours another gap', async () => {
    const c = clock();
    const { inner } = timed(c);
    const paced = pacedFetch(inner, {
      minGapMs: 500,
      sleep: c.sleep,
      now: c.now,
    });
    await paced(url);
    await paced(url);
    expect(c.waits).toEqual([500]);
  });

  it('starts 5 calls at least 200 ms apart', async () => {
    const c = clock();
    const { inner, starts } = timed(c, 30);
    const paced = pacedFetch(inner, { sleep: c.sleep, now: c.now });
    for (let n = 0; n < 5; n++) await paced(url);
    expect(starts).toHaveLength(5);
    for (let n = 1; n < starts.length; n++) {
      expect(at(starts, n) - at(starts, n - 1)).toBeGreaterThanOrEqual(200);
    }
  });

  it('passes an error from the inner fetch through and still paces the next call', async () => {
    const c = clock();
    const starts: number[] = [];
    let n = 0;
    const inner: typeof fetch = () => {
      starts.push(c.now());
      return n++ === 0
        ? Promise.reject(new Error('boom'))
        : Promise.resolve(new Response('ok'));
    };
    const paced = pacedFetch(inner, { sleep: c.sleep, now: c.now });
    await expect(paced(url)).rejects.toThrow('boom');
    const res = await paced(url);
    expect(res.status).toBe(200);
    expect(at(starts, 1) - at(starts, 0)).toBeGreaterThanOrEqual(200);
    expect(c.waits).toEqual([200]);
  });

  it('passes the input and init to the inner fetch and returns its response', async () => {
    const c = clock();
    const seen: unknown[] = [];
    const inner: typeof fetch = (input, init) => {
      seen.push(input, init?.method);
      return Promise.resolve(new Response('hi', { status: 201 }));
    };
    const paced = pacedFetch(inner, { sleep: c.sleep, now: c.now });
    const res = await paced(url, { method: 'POST' });
    expect(res.status).toBe(201);
    expect(seen).toEqual([url, 'POST']);
  });

  it('spaces the starts of calls made at the same moment', async () => {
    const c = clock();
    const { inner, starts } = timed(c);
    const paced = pacedFetch(inner, { sleep: c.sleep, now: c.now });
    await Promise.all([paced(url), paced(url), paced(url), paced(url)]);
    expect(starts).toHaveLength(4);
    for (let n = 1; n < starts.length; n++) {
      expect(at(starts, n) - at(starts, n - 1)).toBeGreaterThanOrEqual(200);
    }
  });
});
