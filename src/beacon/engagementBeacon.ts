import type { VisitKind } from './visitBeacon';

// One tiny request the first time a person does something on the page, so we
// can count people who engaged (as opposed to a client that merely loaded the
// page). It is sent at most once per page view, whichever action comes first,
// so a scroll followed by a click on Calculate is still one. It goes to a
// one-byte file on our own site (public/e.txt) and carries only the kind of page
// and which action it was: `calculate` (a press of a submit button), `click`
// (any other click or tap), `key` (a key press) or `scroll` (a scroll of about
// one screen). No salary, place, cookie, id or fingerprint. Only events the
// browser itself made count (`isTrusted`), so a script that dispatches fake events does
// not. Failures are ignored.

export type EngagementTrigger = 'calculate' | 'click' | 'key' | 'scroll';

function clickTrigger(event: MouseEvent): EngagementTrigger {
  const target = event.target;
  return target instanceof Element &&
    target.closest('button[type="submit"]') !== null
    ? 'calculate'
    : 'click';
}

/** Starts watching; returns a function that stops it (used by tests). */
export function watchEngagement(kind: VisitKind): () => void {
  let done = false;
  const options = { capture: true, passive: true } as const;

  const stop = () => {
    document.removeEventListener('click', onClick, options);
    document.removeEventListener('keydown', onKey, options);
    window.removeEventListener('scroll', onScroll, options);
  };
  const send = (trigger: EngagementTrigger) => {
    if (done) return;
    done = true;
    stop();
    try {
      fetch(`/e.txt?p=${kind}&t=${trigger}`, {
        keepalive: true,
        credentials: 'omit',
        cache: 'no-store',
      }).catch(() => undefined);
    } catch {
      // A blocked beacon must never affect the page.
    }
  };
  function onClick(event: MouseEvent) {
    if (event.isTrusted) send(clickTrigger(event));
  }
  function onKey(event: KeyboardEvent) {
    if (event.isTrusted) send('key');
  }
  function onScroll(event: Event) {
    if (event.isTrusted && window.scrollY >= window.innerHeight) {
      send('scroll');
    }
  }

  document.addEventListener('click', onClick, options);
  document.addEventListener('keydown', onKey, options);
  window.addEventListener('scroll', onScroll, options);
  return stop;
}
