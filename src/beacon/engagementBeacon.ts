import { sendBeacon } from './sendBeacon';
import type { VisitKind } from './visitBeacon';

// One tiny request the first time a person does something on the page, so we
// can count people who engaged (as opposed to a client that merely loaded the
// page). It is sent at most once per page view, whichever action comes first,
// so a scroll followed by a click on Calculate is still one. It goes to a
// one-byte file on our own site (public/e.txt) and carries only the kind of page
// and which action it was: `calculate` (a mouse or tap press on the submit
// button; pressing Enter to submit counts as `key`), `click` (any other click or
// tap), `key` (a key press, not a lone modifier or a browser shortcut) or `scroll` (a scroll of about one screen). No salary,
// place, cookie, id or fingerprint, and no Referer, so the address of the page is
// not sent either. Only events the browser itself made count (`isTrusted`), so a
// script that dispatches fake events does not; a real browser driven by
// automation still can, so this is not bot protection. A scroll only counts after
// the person's own wheel, touch or pointer input, so a page the browser reopened
// already scrolled (reload, back, a #fragment) is not counted. Failures are ignored.

export type EngagementTrigger = 'calculate' | 'click' | 'key' | 'scroll';

const MODIFIER_KEYS: ReadonlySet<string> = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'AltGraph',
  'CapsLock',
]);

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
  let handsOn = false;
  const options = { capture: true, passive: true } as const;

  const stop = () => {
    document.removeEventListener('click', onClick, options);
    document.removeEventListener('keydown', onKey, options);
    window.removeEventListener('scroll', onScroll, options);
    document.removeEventListener('wheel', onInput, options);
    document.removeEventListener('touchstart', onInput, options);
    document.removeEventListener('pointerdown', onInput, options);
  };
  const send = (trigger: EngagementTrigger) => {
    if (done) return;
    done = true;
    stop();
    sendBeacon(`/e.txt?p=${kind}&t=${trigger}`);
  };
  function onClick(event: MouseEvent) {
    if (event.isTrusted) send(clickTrigger(event));
  }
  function onKey(event: KeyboardEvent) {
    // Not a lone modifier, and not a browser shortcut (reload, back, find):
    // those say nothing about the page.
    if (!event.isTrusted || MODIFIER_KEYS.has(event.key)) return;
    if (event.ctrlKey || event.metaKey || event.altKey || event.key === 'F5') {
      return;
    }
    send('key');
  }
  function onInput(event: Event) {
    if (event.isTrusted) handsOn = true;
  }
  function onScroll(event: Event) {
    if (event.isTrusted && handsOn && window.scrollY >= window.innerHeight) {
      send('scroll');
    }
  }

  document.addEventListener('click', onClick, options);
  document.addEventListener('keydown', onKey, options);
  window.addEventListener('scroll', onScroll, options);
  document.addEventListener('wheel', onInput, options);
  document.addEventListener('touchstart', onInput, options);
  document.addEventListener('pointerdown', onInput, options);
  return stop;
}
