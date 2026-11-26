// One tiny request so a visitor whose browser runs JavaScript leaves a mark in
// the site's access logs; a crawler that only reads the HTML never does. The
// request goes to a one-byte file on our own site (public/b.txt). It carries
// only the kind of page, never the salary or the place, and no cookie, id or
// fingerprint, so nothing the page adds identifies the visitor (the access log
// still records the address and user agent of every request, but not the
// page the visitor is on: the request sends no Referer). `home` means the
// app shell, `salary` a pre-built salary page; the other kinds are the pre-built
// content pages (see state/pageKind.ts). Failures are ignored.

export type VisitKind =
  'home' | 'salary' | 'form' | 'hub' | 'rates' | 'compare' | 'other';

export function sendVisitBeacon(kind: VisitKind): void {
  const send = () => {
    try {
      fetch(`/b.txt?p=${kind}`, {
        keepalive: true,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
      }).catch(() => undefined);
    } catch {
      // A blocked beacon must never affect the page.
    }
  };
  // After the page has loaded, off the rendering path.
  const later = () => {
    setTimeout(send, 0);
  };
  if (document.readyState === 'complete') {
    later();
  } else {
    window.addEventListener('load', later, { once: true });
  }
}
