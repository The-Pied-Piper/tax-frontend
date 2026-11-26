import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { watchEngagement } from './engagementBeacon';

// jsdom marks every event it dispatches as untrusted and the flag cannot be
// changed, so the test takes the listeners the module registers and calls them
// with plain stand-in events, as a browser would.
type Listener = (event: unknown) => void;
const listeners = new Map<string, Listener>();

function fire(type: string, event: Record<string, unknown>, isTrusted = true) {
  listeners.get(type)?.({ isTrusted, ...event });
}
function click(id: string, isTrusted = true) {
  fire('click', { target: document.getElementById(id) }, isTrusted);
}
function key(isTrusted = true) {
  fire('keydown', { key: 'a' }, isTrusted);
}
function scroll(y: number) {
  vi.stubGlobal('scrollY', y);
  fire('scroll', {});
}

describe('watchEngagement', () => {
  const fetchMock = vi.fn();
  let stop: () => void = () => undefined;

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(''));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('innerHeight', 800);
    listeners.clear();
    const capture = (type: string, listener: unknown) => {
      listeners.set(type, listener as Listener);
    };
    vi.spyOn(document, 'addEventListener').mockImplementation(capture);
    vi.spyOn(window, 'addEventListener').mockImplementation(capture);
    vi.spyOn(document, 'removeEventListener').mockImplementation((type) => {
      listeners.delete(type);
    });
    vi.spyOn(window, 'removeEventListener').mockImplementation((type) => {
      listeners.delete(type);
    });
    document.body.innerHTML =
      '<form><button type="submit" id="go"><span id="label">Calculate</span></button></form><button id="other">Other</button>';
  });

  afterEach(() => {
    stop();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function start(kind: Parameters<typeof watchEngagement>[0]) {
    stop = watchEngagement(kind);
  }
  function lastUrl(): string {
    return fetchMock.mock.calls[0]?.[0] as string;
  }

  it('sends nothing until the person does something', () => {
    start('salary');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the page kind and a click, with no cookie', () => {
    start('hub');
    click('other');
    expect(lastUrl()).toBe('/e.txt?p=hub&t=click');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      credentials: 'omit',
      cache: 'no-store',
      keepalive: true,
    });
  });

  it('tags a press of a submit button, even on its inner text, as calculate', () => {
    start('home');
    click('label');
    expect(lastUrl()).toBe('/e.txt?p=home&t=calculate');
  });

  it('tags a key press', () => {
    start('form');
    key();
    expect(lastUrl()).toBe('/e.txt?p=form&t=key');
  });

  it('counts a scroll only after about one screen', () => {
    start('rates');
    scroll(300);
    expect(fetchMock).not.toHaveBeenCalled();
    scroll(800);
    expect(lastUrl()).toBe('/e.txt?p=rates&t=scroll');
  });

  it('is one request per page view: a scroll then a Calculate press sends only the scroll', () => {
    start('salary');
    scroll(900);
    click('go');
    key();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastUrl()).toBe('/e.txt?p=salary&t=scroll');
    expect(listeners.size).toBe(0);
  });

  it('ignores events a script made up', () => {
    start('compare');
    key(false);
    click('other', false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores a failed or throwing request', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    start('home');
    key();
    await Promise.resolve();
    fetchMock.mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    start('home');
    expect(() => {
      key();
    }).not.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
