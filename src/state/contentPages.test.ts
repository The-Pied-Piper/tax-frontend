import {
  CONTENT_TITLE_LIMIT,
  DESCRIPTION_LIMIT,
} from '../../build/salaryPages/limits';
import { copyRules, everyString } from '../test/copyRules';
import { longestSentence } from '../test/formText';
import { contentPages, paragraph } from './contentPages';
import { ENGINE_REPO_URL, isContentSlug, METHODOLOGY_SLUG } from './siteLinks';

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
      expect(page.title.length, `${page.slug} title`).toBeLessThan(
        CONTENT_TITLE_LIMIT,
      );
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
        expect((section.heading ?? 'the lead').length).toBeGreaterThan(0);
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

  it('has the plain-English description', () => {
    expect(page?.description).toBe(
      'How we work out your take-home pay: we follow the published forms line by line, use exact math, and check the results.',
    );
  });

  it('has every section, in order, with its paragraphs word for word', () => {
    const sections = (page?.sections ?? []).map((section) => [
      section.heading,
      section.blocks.map((block) =>
        block.kind === 'paragraph'
          ? everyString(block.content).join('')
          : block.kind,
      ),
    ]);
    expect(sections).toEqual([
      [
        'It follows the published forms',
        [
          'A program that anyone can read, called an open-source engine, does the math. It follows the published federal and provincial tax forms line by line. Each line on a form is one step in the engine, in the same order. That covers everything from your pension and EI amounts to your credits and the tax on each slice of income. Under your answer, the advanced view lists every step and the form line it comes from, so you can follow along on paper.',
          'Every rate, limit and top amount comes from the published forms and tables for that province and year.',
        ],
      ],
      [
        'Credits paid to you when you file',
        [
          'Some credits are paid to you after you file your return, instead of lowering the tax you owe. Examples are the Canada workers benefit, the Employment Insurance refund, credits paid by your province, and in Québec the work premium and the solidarity tax credit.',
          'This site does not count them in your take-home pay or your rates. They arrive as a payment after you file, they depend on your family, other income and what you claim, and they are not taken from your pay.',
          'Credits that lower the tax itself are counted, for example tax cuts such as the Ontario LIFT Credit and the Québec abatement.',
        ],
      ],
      [
        'Exact arithmetic',
        [
          'Computers often store money in a way that can be off by a tiny fraction of a cent. Our engine does not. It does its math with exact numbers. It rounds only where a form says to round, and it rounds the way the form says. It never rounds early to make things easier, so the cents you see are the cents the forms give.',
        ],
      ],
      [
        'How we check it',
        [
          'For each province and tax year, we run more than a hundred salaries through the engine and check the results. We pick salaries at the edge of every tax slice and at the yearly limits for the pension plan and EI, because that is where mistakes hide.',
        ],
      ],
      [
        'What it does not do',
        [
          'It estimates take-home pay for a single person whose only income is a salary.',
          'The 2026 figures are provisional. That means they use the rates published so far, and we replace them when the final rates come out. The calculator tells you whenever you pick a provisional year.',
          'It is an estimate, not tax advice. What you actually take home depends on your own situation and on how much tax your employer takes off each paycheque.',
        ],
      ],
      [
        'Look for yourself',
        [
          `Because the engine is open source, anyone can read how each line is worked out and run it themselves. Nothing you enter on this site is saved. Read the engine's code on GitHub${ENGINE_REPO_URL}.`,
        ],
      ],
    ]);
  });

  it('links the engine repository, and only that repository, from "Look for yourself"', () => {
    const section = page?.sections.find(
      (entry) => entry.heading === 'Look for yourself',
    );
    const links = section?.blocks.flatMap((block) =>
      block.kind === 'paragraph'
        ? block.content.filter((part) => typeof part !== 'string')
        : [],
    );
    expect(ENGINE_REPO_URL).toBe(
      'https://github.com/The-Pied-Piper/tax-engine',
    );
    expect(links).toEqual([
      { label: "Read the engine's code on GitHub", href: ENGINE_REPO_URL },
    ]);
  });

  it('keeps every sentence to 40 words or fewer', () => {
    for (const text of everyString(page?.sections)) {
      expect(longestSentence(text), text).toBeLessThanOrEqual(40);
    }
  });

  it('keeps to the copy rules', () => {
    expect(words).not.toContain('checked against cra');
    expect(words).not.toContain('canada only');
    expect(words).not.toContain('canada-only');
    expect(JSON.stringify(page)).not.toMatch(/\bAI\b/);
    expect(words).not.toContain('docs/');
    expect(words).not.toContain('tax-service');
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
