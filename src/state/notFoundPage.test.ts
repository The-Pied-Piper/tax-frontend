import { DESCRIPTION_LIMIT, TITLE_LIMIT } from '../../build/salaryPages/limits';
import { strings } from '../strings';
import { contentPages } from './contentPages';
import type { ContentBlock } from './contentPages';
import { notFoundPage } from './notFoundPage';
import {
  FOOTER_PROVINCE_SLUGS,
  HOME_PATH,
  METHODOLOGY_SLUG,
  NOT_FOUND_FILE,
  contentPath,
} from './siteLinks';
import { everyString } from '../test/copyRules';

type LinksBlock = Extract<ContentBlock, { kind: 'links' }>;

function grid(): LinksBlock | undefined {
  return notFoundPage.sections
    .flatMap((s) => s.blocks)
    .find((b): b is LinksBlock => b.kind === 'links');
}

describe('the not-found file name', () => {
  it('is 404.html', () => {
    expect(NOT_FOUND_FILE).toBe('404.html');
  });
});

describe('notFoundPage', () => {
  it('has its own slug and no trail', () => {
    expect(notFoundPage.slug).toBe('not-found');
    expect(notFoundPage.trail).toEqual([]);
  });

  it('keeps the title and description within the limits', () => {
    expect(notFoundPage.title.length).toBeGreaterThan(0);
    expect(notFoundPage.title.length).toBeLessThan(TITLE_LIMIT);
    expect(notFoundPage.description.length).toBeGreaterThan(0);
    expect(notFoundPage.description.length).toBeLessThan(DESCRIPTION_LIMIT);
  });

  it('says in the heading that the page was not found', () => {
    expect(notFoundPage.heading).toMatch(/could not find/i);
  });

  it('links home, the three province hubs and the methodology page, from the site helpers', () => {
    expect(grid()?.layout).toBe('grid');
    expect(grid()?.links).toEqual([
      { label: strings.siteNav.home, href: HOME_PATH },
      ...FOOTER_PROVINCE_SLUGS.map((slug) => ({
        label: strings.siteNav.provinceNames[slug],
        href: contentPath(slug),
      })),
      {
        label: strings.siteNav.methodology,
        href: contentPath(METHODOLOGY_SLUG),
      },
    ]);
  });

  it('links only to site paths', () => {
    for (const link of grid()?.links ?? []) {
      expect(link.href, link.label).toMatch(/^\/([a-z0-9-]+\/)*$/);
    }
  });

  it('has no digits or dollar figures in any copy', () => {
    const copy = everyString(notFoundPage).join(' ');
    expect(copy.length).toBeGreaterThan(0);
    expect(copy).not.toMatch(/\d|\$/);
  });

  it('is not listed among the content pages', () => {
    expect(contentPages.map((p) => p.slug)).not.toContain(notFoundPage.slug);
    expect(contentPages).not.toContain(notFoundPage);
  });
});
