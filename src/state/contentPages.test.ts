import { DESCRIPTION_LIMIT, TITLE_LIMIT } from '../../build/salaryPages/limits';
import { copyRules, everyString } from '../test/copyRules';
import { contentPages, paragraph } from './contentPages';
import { isContentSlug, METHODOLOGY_SLUG } from './siteLinks';

// Adding a page is one entry in the list; these checks keep every entry sound.
describe('contentPages', () => {
  it('is a list (it may be empty)', () => {
    expect(Array.isArray(contentPages)).toBe(true);
  });

  it('has no repeated slug', () => {
    const slugs = contentPages.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has only valid entries', () => {
    const slugs = new Set(contentPages.map((page) => page.slug));
    for (const page of contentPages) {
      expect(isContentSlug(page.slug), page.slug).toBe(true);
      expect(page.title.length, `${page.slug} title`).toBeGreaterThan(0);
      expect(page.title.length, `${page.slug} title`).toBeLessThan(TITLE_LIMIT);
      expect(
        page.description.length,
        `${page.slug} description`,
      ).toBeGreaterThan(0);
      expect(page.description.length, `${page.slug} description`).toBeLessThan(
        DESCRIPTION_LIMIT,
      );
      expect(page.heading.length, `${page.slug} heading`).toBeGreaterThan(0);
      for (const step of page.trail) {
        expect(slugs.has(step.slug), `${page.slug} trail ${step.slug}`).toBe(
          true,
        );
        expect(step.label.length).toBeGreaterThan(0);
      }
      for (const section of page.sections) {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.blocks.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('the methodology page', () => {
  const page = contentPages.find((entry) => entry.slug === METHODOLOGY_SLUG);
  const words = JSON.stringify(page).replace(/\s+/g, ' ').toLowerCase();

  it('is listed under the slug the footer links to', () => {
    expect(page).toBeDefined();
    expect(page?.trail).toEqual([]);
  });

  it('states the method plainly', () => {
    expect(words).toContain('follows the published forms');
    expect(words).toContain('line by line');
    expect(words).toContain('exact decimals');
    expect(words).toContain('more than a hundred salaries');
    expect(words).toContain('provisional');
    expect(words).toContain('not tax advice');
  });

  it('keeps to the copy rules', () => {
    expect(words).not.toContain('checked against cra');
    expect(words).not.toContain('canada only');
    expect(words).not.toContain('canada-only');
    expect(JSON.stringify(page)).not.toMatch(/\bAI\b/);
    expect(words).not.toContain('docs/');
  });
});

describe('paragraph', () => {
  it('makes a paragraph block from words and links', () => {
    const link = { label: 'the link', href: '/x/' };
    expect(paragraph('a ', link, ' b')).toEqual({
      kind: 'paragraph',
      content: ['a ', link, ' b'],
    });
  });
});

describe('the copy of every listed page', () => {
  it.each(copyRules)('holds no %s', (_name, pattern) => {
    for (const page of contentPages) {
      for (const words of everyString(page)) {
        expect(words, `${page.slug}: ${words}`).not.toMatch(pattern);
      }
    }
  });
});
