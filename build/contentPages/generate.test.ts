import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  siteUrl as site,
  contentTemplate as template,
  tmpDirs,
} from '../../src/test/generatedSite';
import { ENGINE_REPO_URL } from '../../src/state/siteLinks';
import {
  blocksSpec,
  parentSpec,
  plainSpec,
  sampleSpec,
} from '../../src/test/contentPageData';
import type {
  ContentBlock,
  ContentPageSpec,
} from '../../src/state/contentPages';
import { DESCRIPTION_LIMIT, TITLE_LIMIT } from '../salaryPages/limits';
import { generateContentPages } from './generate';

const outDir = tmpDirs('content-pages');

/** Stands in for the real render; echoes what it was given. */
function render(spec: ContentPageSpec): string {
  return `<main><h1>${spec.heading}</h1><p>rendered ${spec.slug}</p></main>`;
}

function run(
  dir: string,
  pages: ContentPageSpec[],
  options: {
    siteUrl?: string | null;
    render?: typeof render;
    dataBlocks?: ReadonlyMap<string, string>;
  } = {},
) {
  // Wrapped so a throw at once and a rejection look the same to the tests.
  return Promise.resolve().then(() =>
    generateContentPages({
      outDir: dir,
      template,
      pages,
      render: options.render ?? render,
      siteUrl: options.siteUrl === undefined ? site : options.siteUrl,
      dataBlocks: options.dataBlocks,
    }),
  );
}

function files(dir: string): string[] {
  return readdirSync(dir, { recursive: true }).map(String);
}

function parse(dir: string, file: string) {
  return new DOMParser().parseFromString(
    readFileSync(join(dir, file), 'utf8'),
    'text/html',
  );
}

describe('generateContentPages with one entry', () => {
  it('writes <slug>/index.html and reports it, relative to the output folder', async () => {
    const dir = outDir();
    const { written } = await run(dir, [plainSpec]);
    expect(written).toEqual(['plain-page/index.html']);
    expect(existsSync(join(dir, 'plain-page', 'index.html'))).toBe(true);
    expect(files(dir).filter((f) => f.endsWith('.html'))).toEqual([
      join('plain-page', 'index.html'),
    ]);
  });

  it('puts the rendered page in #root', async () => {
    const dir = outDir();
    await run(dir, [plainSpec]);
    const page = parse(dir, 'plain-page/index.html');
    expect(page.querySelector('#root h1')?.textContent).toBe(plainSpec.heading);
    expect(page.getElementById('root')?.textContent).toContain(
      'rendered plain-page',
    );
  });

  it('gives the page its own title, description, canonical and og:url', async () => {
    const dir = outDir();
    await run(dir, [plainSpec]);
    const page = parse(dir, 'plain-page/index.html');
    expect(page.title).toBe(plainSpec.title);
    expect(
      page.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe(plainSpec.description);
    expect(
      page.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe(`${site}/plain-page/`);
    expect(
      page.querySelector('meta[property="og:url"]')?.getAttribute('content'),
    ).toBe(`${site}/plain-page/`);
  });

  it('writes a nested slug into nested folders', async () => {
    const dir = outDir();
    const nested = { ...plainSpec, slug: 'forms/bc428' };
    const { written } = await run(dir, [nested]);
    expect(written).toEqual(['forms/bc428/index.html']);
    expect(existsSync(join(dir, 'forms', 'bc428', 'index.html'))).toBe(true);
  });

  it('leaves canonical and og:url alone when there is no site address', async () => {
    const dir = outDir();
    await run(dir, [plainSpec], { siteUrl: null });
    const page = parse(dir, 'plain-page/index.html');
    expect(page.querySelector('link[rel="canonical"]')).toBeNull();
    expect(page.querySelector('meta[property="og:url"]')).toBeNull();
  });

  it('writes nothing for an empty list', async () => {
    const dir = outDir();
    const { written } = await run(dir, []);
    expect(written).toEqual([]);
    expect(files(dir)).toEqual([]);
  });

  it('writes every page of a longer list, in list order', async () => {
    const dir = outDir();
    const { written } = await run(dir, [parentSpec, sampleSpec]);
    expect(written).toEqual([
      'sample-hub/index.html',
      'sample-page/index.html',
    ]);
  });
});

describe('generateContentPages validation', () => {
  // The call may throw at once or reject; both count as an error.
  async function fails(pages: ContentPageSpec[], dir = outDir()) {
    const attempt = async () => run(dir, pages);
    await expect(attempt()).rejects.toThrow();
    return dir;
  }

  it('rejects an invalid slug and names it', async () => {
    const bad = { ...plainSpec, slug: 'Not Valid' };
    await expect(run(outDir(), [bad])).rejects.toThrow(/Not Valid/);
  });

  it('rejects a slug that is the address of a salary page', async () => {
    await expect(
      run(outDir(), [{ ...plainSpec, slug: 'ca-on/70000' }]),
    ).rejects.toThrow(/ca-on\/70000/);
  });

  it('rejects a repeated slug and names it', async () => {
    await expect(
      run(outDir(), [plainSpec, { ...plainSpec, title: 'Other' }]),
    ).rejects.toThrow(/plain-page/);
  });

  it('rejects a title of 60 characters or more', async () => {
    const dir = await fails([{ ...plainSpec, title: 'x'.repeat(TITLE_LIMIT) }]);
    expect(files(dir)).toEqual([]);
  });

  it('accepts a title one character under the limit', async () => {
    const { written } = await run(outDir(), [
      { ...plainSpec, title: 'x'.repeat(TITLE_LIMIT - 1) },
    ]);
    expect(written).toHaveLength(1);
  });

  it('rejects a description of 160 characters or more', async () => {
    const dir = await fails([
      { ...plainSpec, description: 'x'.repeat(DESCRIPTION_LIMIT) },
    ]);
    expect(files(dir)).toEqual([]);
  });

  it('accepts a description one character under the limit', async () => {
    const { written } = await run(outDir(), [
      { ...plainSpec, description: 'x'.repeat(DESCRIPTION_LIMIT - 1) },
    ]);
    expect(written).toHaveLength(1);
  });

  it('rejects a trail step that is not a listed page', async () => {
    const dir = await fails([sampleSpec]);
    expect(files(dir)).toEqual([]);
  });

  it('accepts a trail step that is a listed page', async () => {
    const { written } = await run(outDir(), [parentSpec, sampleSpec]);
    expect(written).toHaveLength(2);
  });

  it('writes no file at all when one entry of several is invalid', async () => {
    const dir = await fails([
      plainSpec,
      { ...parentSpec, title: 'x'.repeat(TITLE_LIMIT) },
    ]);
    expect(files(dir)).toEqual([]);
  });

  it('writes no file when rendering one page fails', async () => {
    const dir = outDir();
    const failing = (spec: ContentPageSpec) => {
      if (spec.slug === 'sample-page') throw new Error('render broke');
      return render(spec);
    };
    await expect(
      run(dir, [parentSpec, sampleSpec], { render: failing }),
    ).rejects.toThrow(/render broke/);
    expect(files(dir)).toEqual([]);
  });

  describe('blocks', () => {
    const withBlocks = (...blocks: ContentBlock[]): ContentPageSpec => ({
      ...plainSpec,
      sections: [{ heading: 'Part', blocks }],
    });

    it('accepts a page with one block of every kind', async () => {
      const { written } = await run(outDir(), [blocksSpec]);
      expect(written).toEqual(['blocks-page/index.html']);
    });

    it('rejects a sub-heading with no words and names the page', async () => {
      const dir = outDir();
      const empty = withBlocks({ kind: 'subheading', text: '' });
      await expect(run(dir, [empty])).rejects.toThrow(/plain-page/);
      expect(files(dir)).toEqual([]);
    });

    it('accepts a sub-heading with words', async () => {
      const { written } = await run(outDir(), [
        withBlocks({ kind: 'subheading', text: 'Take-home pay' }),
      ]);
      expect(written).toEqual(['plain-page/index.html']);
    });

    it('rejects a table row longer than the head and names the page', async () => {
      const dir = outDir();
      const ragged = withBlocks({
        kind: 'table',
        caption: 'Rates',
        head: ['Band', 'Rate'],
        rows: [['First', '5%', 'extra']],
      });
      await expect(run(dir, [ragged])).rejects.toThrow(/plain-page/);
      expect(files(dir)).toEqual([]);
    });

    it('rejects a table row shorter than the head', async () => {
      const ragged = withBlocks({
        kind: 'table',
        caption: 'Rates',
        head: ['Band', 'Rate'],
        rows: [['First', '5%'], ['Second']],
      });
      await expect(run(outDir(), [ragged])).rejects.toThrow(/plain-page/);
    });

    it.each([
      ['a list with no items', { kind: 'list', items: [] }],
      [
        'a links block with no links',
        { kind: 'links', label: 'More', layout: 'row', links: [] },
      ],
      [
        'a table with no rows',
        { kind: 'table', caption: 'Rates', head: ['Band'], rows: [] },
      ],
    ] as [string, ContentBlock][])('rejects %s', async (_name, block) => {
      const dir = outDir();
      await expect(run(dir, [withBlocks(block)])).rejects.toThrow(/plain-page/);
      expect(files(dir)).toEqual([]);
    });

    it('accepts a province comparison, a data reference only', async () => {
      const { written } = await run(outDir(), [
        withBlocks({ kind: 'provinceComparison', province: 'ca-on' }),
      ]);
      expect(written).toEqual(['plain-page/index.html']);
    });

    it('accepts a link to the engine repository, the one address off the site', async () => {
      const dir = outDir();
      await run(dir, [
        withBlocks({
          kind: 'paragraph',
          content: ['See ', { label: 'x', href: ENGINE_REPO_URL }],
        }),
      ]);
      expect(files(dir).length).toBeGreaterThan(0);
    });

    it.each([
      ['https://example.com/x/'],
      ['//example.com/x/'],
      ['x/relative/'],
      ['/has space/'],
      ['https://github.com/The-Pied-Piper/tax-service'],
      [`${ENGINE_REPO_URL}-evil`],
      [`${ENGINE_REPO_URL}/`],
    ])('rejects a link to %s, which is not a site path', async (href) => {
      const dir = outDir();
      const links: ContentBlock[] = [
        {
          kind: 'links',
          label: 'More',
          layout: 'row',
          links: [{ label: 'x', href }],
        },
        { kind: 'list', items: [{ label: 'x', href, description: 'y' }] },
        { kind: 'paragraph', content: ['See ', { label: 'x', href }] },
      ];
      for (const block of links) {
        await expect(run(dir, [withBlocks(block)])).rejects.toThrow(
          /plain-page.*not a site path/,
        );
      }
      expect(files(dir)).toEqual([]);
    });
  });
});

describe('generateContentPages data blocks', () => {
  it("puts a page's data block at the end of its body and no other page's", async () => {
    const dir = outDir();
    const block = '<script type="application/json" id="x">{"a":1}</script>';
    await run(dir, [plainSpec, parentSpec], {
      dataBlocks: new Map([[plainSpec.slug, block]]),
    });
    const withBlock = readFileSync(
      join(dir, `${plainSpec.slug}/index.html`),
      'utf8',
    );
    expect(withBlock).toContain(`${block}\n  </body>`);
    const without = readFileSync(
      join(dir, `${parentSpec.slug}/index.html`),
      'utf8',
    );
    expect(without).not.toContain('id="x"');
  });
});
