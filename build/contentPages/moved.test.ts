import { readdirSync } from 'node:fs';
import { renderContentPage } from '../salaryPages/prerender';
import {
  siteUrl as site,
  contentTemplate as template,
  tmpDirs,
} from '../../src/test/generatedSite';
import { parse } from '../../src/test/crawlSite';
import { formPages } from '../../src/state/formPages';
import { MOVED_PAGES } from '../../src/state/siteLinks';
import { generateMovedPages } from './moved';

const outDir = tmpDirs('moved');

async function run(
  dir: string,
  moved: Record<string, string>,
  written: string[],
  siteUrl: string | null = site,
) {
  return generateMovedPages({
    outDir: dir,
    template,
    render: renderContentPage,
    moved,
    written: new Set(written),
    siteUrl,
  });
}

describe('generateMovedPages', () => {
  it('writes one file at each old address and returns them', async () => {
    const dir = outDir();
    const files = await run(dir, { 'forms/old': 'forms/new' }, ['forms/new']);
    expect(files).toEqual(['forms/old/index.html']);
    expect(readdirSync(dir, { recursive: true }).map(String)).toContain(
      'forms/old/index.html',
    );
  });

  it('sends the reader to the new address and asks search engines to index that one', async () => {
    const dir = outDir();
    await run(dir, { 'forms/old': 'forms/new' }, ['forms/new']);
    const page = parse(dir, 'forms/old/index.html');
    expect(
      page.querySelector('meta[http-equiv="refresh"]')?.getAttribute('content'),
    ).toBe('0; url=/forms/new/');
    expect(
      page.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('noindex');
    const canonicals = page.querySelectorAll('link[rel="canonical"]');
    expect(canonicals).toHaveLength(1);
    expect(canonicals[0]?.getAttribute('href')).toBe(`${site}/forms/new/`);
    expect(page.querySelector('a[href="/forms/new/"]')).not.toBeNull();
  });

  it('has no canonical link without a site address', async () => {
    const dir = outDir();
    await run(dir, { 'forms/old': 'forms/new' }, ['forms/new'], null);
    const page = parse(dir, 'forms/old/index.html');
    expect(page.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('refuses a target that was not written, or an old address that is a page', async () => {
    await expect(
      run(outDir(), { 'forms/old': 'forms/new' }, []),
    ).rejects.toThrow(/not written/);
    await expect(
      run(outDir(), { 'forms/old': 'forms/new' }, ['forms/old', 'forms/new']),
    ).rejects.toThrow(/also a listed page/);
  });

  it('covers the two old T1 addresses, and none is a listed form page', () => {
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
