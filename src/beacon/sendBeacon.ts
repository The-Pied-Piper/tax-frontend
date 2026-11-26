// The one request both beacons make: a GET for a one-byte file on our own site
// with no cookie, no Referer and no caching, kept alive past a page unload. A
// blocked or failed request is ignored so a beacon never affects the page.
export function sendBeacon(url: string): void {
  try {
    fetch(url, {
      keepalive: true,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
    }).catch(() => undefined);
  } catch {
    // A blocked beacon must never affect the page.
  }
}
