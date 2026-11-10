// Applies a saved theme before first paint so there is no flash. This is a
// separate file (not inline in index.html) because the site's
// Content-Security-Policy allows scripts from its own origin only. The storage
// key and values must match src/theme/theme.ts (a test checks this).
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.dataset.theme = t;
    }
  } catch {
    // Storage blocked: the device setting decides.
  }
})();
