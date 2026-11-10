import indexHtml from '../../index.html?raw';
import initScript from '../../public/theme-init.js?raw';
import { THEME_STORAGE_KEY } from './theme';

// The Content-Security-Policy allows scripts from this site only, so the
// pre-paint theme script must be a file and index.html must have no inline one.
// Runs the file's source the way the browser does, as a plain script.
function runInitScript(): void {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
  new Function(initScript)();
}

describe('theme-init.js', () => {
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('is loaded from index.html and no inline script is left', () => {
    expect(indexHtml).toContain('<script src="/theme-init.js"></script>');
    expect(indexHtml).not.toMatch(/<script(?![^>]*\ssrc=)[^>]*>/);
  });

  it('reads the same storage key as the app', () => {
    expect(initScript).toContain(`getItem('${THEME_STORAGE_KEY}')`);
  });

  it.each(['light', 'dark'])('applies a saved %s theme', (saved) => {
    localStorage.setItem(THEME_STORAGE_KEY, saved);
    runInitScript();
    expect(document.documentElement.dataset.theme).toBe(saved);
  });

  it('leaves the theme alone for a missing or unknown value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    runInitScript();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
