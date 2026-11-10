import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, 'tokens.css'), 'utf8');

function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    const [, name, value] = m;
    if (name !== undefined && value !== undefined) {
      out[name] = value.trim();
    }
  }
  return out;
}

// Blocks, in file order: light :root, dark under the media query, dark explicit.
const light = tokens(css.slice(css.indexOf(':root {'), css.indexOf('@media')));
const mediaStart = css.indexOf('@media');
const explicitStart = css.indexOf(":root[data-theme='dark']");
const darkMedia = tokens(css.slice(mediaStart, explicitStart));
const dark = tokens(css.slice(explicitStart));

function colour(palette: Record<string, string>, name: string): string {
  const value = palette[name];
  if (value === undefined) {
    throw new Error(`Missing token ${name}`);
  }
  return value;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Text colour on the background it is drawn on. Body text needs 4.5:1.
const PAIRS: [string, string][] = [
  ['--fg', '--bg'],
  ['--fg', '--surface'],
  ['--muted', '--bg'],
  ['--muted', '--surface'],
  ['--faint', '--bg'],
  ['--faint', '--surface'],
  ['--faint', '--rule'],
  ['--accent', '--surface'],
  ['--accent', '--bg'],
  ['--btn-fg', '--btn'],
  ['--btn-fg', '--accent'],
  ['--warn-fg', '--warn-bg'],
  ['--err-fg', '--err-bg'],
  ['--err-fg', '--surface'],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('%s palette', (_name, palette) => {
  it.each(PAIRS)('%s on %s has contrast of at least 4.5', (fg, bg) => {
    expect(
      contrast(colour(palette, fg), colour(palette, bg)),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

it('has the same dark values under the device setting and the explicit choice', () => {
  const a = { ...darkMedia };
  const b = { ...dark };
  delete a['color-scheme'];
  delete b['color-scheme'];
  expect(a).toEqual(b);
  expect(Object.keys(dark).sort()).toEqual(
    Object.keys(light)
      .filter((k) => !k.startsWith('--font') && !k.startsWith('--radius'))
      .sort(),
  );
});
