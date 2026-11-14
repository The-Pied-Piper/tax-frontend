import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendVisitBeacon } from './visitBeacon';

describe('sendVisitBeacon', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(''));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('asks for the tiny file once, with only the page kind in the query', () => {
    sendVisitBeacon('salary');
    vi.runAllTimers();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/b.txt?p=salary');
    expect(init).toMatchObject({
      credentials: 'omit',
      cache: 'no-store',
      keepalive: true,
    });
  });

  it('sends nothing until the page has finished loading', () => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    sendVisitBeacon('home');
    vi.runAllTimers();
    expect(fetchMock).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    vi.runAllTimers();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/b.txt?p=home');
  });

  it('does not wait on fetch, and ignores a failed or throwing request', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    sendVisitBeacon('home');
    vi.runAllTimers();
    await vi.runAllTimersAsync();
    fetchMock.mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(() => {
      sendVisitBeacon('home');
      vi.runAllTimers();
    }).not.toThrow();
  });
});
