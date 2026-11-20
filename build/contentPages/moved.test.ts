import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateMovedPages, movedPageHtml } from './moved';
import { MOVED_PAGES } from '../../src/state/siteLinks';
import { formPages } from '../../src/state/formPages';

const dirs: string[] = [];
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'moved-'));
  dirs.push(d);
  return d;
};

describe('a moved page', () => {
  it('sends the reader and search engines to the new address', () => {
    const html = movedPageHtml('forms/t1');
    expect(html).toContain(
      '<meta http-equiv="refresh" content="0; url=/forms/t1/" />',
    );
    expect(html).toContain('<link rel="canonical" href="/forms/t1/" />');
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toContain('<a href="/forms/t1/">');
  });

  it('is written at each old address', async () => {
    const outDir = tmp();
    const files = await generateMovedPages({
      outDir,
      moved: { 'forms/old': 'forms/new' },
      written: new Set(['forms/new']),
    });
    expect(files).toEqual(['forms/old/index.html']);
    expect(readFileSync(join(outDir, files[0] ?? ''), 'utf8')).toContain(
      'url=/forms/new/',
    );
  });

  it('refuses a target that was not written, or an old address that is a page', async () => {
    await expect(
      generateMovedPages({
        outDir: tmp(),
        moved: { 'forms/old': 'forms/new' },
        written: new Set(),
      }),
    ).rejects.toThrow(/not written/);
    await expect(
      generateMovedPages({
        outDir: tmp(),
        moved: { 'forms/old': 'forms/new' },
        written: new Set(['forms/old', 'forms/new']),
      }),
    ).rejects.toThrow(/also a listed page/);
  });

  it('covers the two old T1 addresses and none is a listed form page', () => {
    expect(MOVED_PAGES).toEqual({
      'forms/t1-income': 'forms/t1',
      'forms/t1-tax': 'forms/t1',
    });
    const ids = formPages.map((f) => `forms/${f.id}`);
    for (const from of Object.keys(MOVED_PAGES))
      expect(ids).not.toContain(from);
    for (const to of Object.values(MOVED_PAGES)) expect(ids).toContain(to);
  });
});
