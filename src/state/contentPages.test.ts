import { DESCRIPTION_LIMIT, TITLE_LIMIT } from '../../build/salaryPages/limits';
import { contentPages } from './contentPages';
import { isContentSlug } from './siteLinks';

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
        expect(section.paragraphs.length).toBeGreaterThan(0);
      }
    }
  });
});
