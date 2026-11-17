import { formContentPage, type FormBody } from './formPage';
import { formPages } from './formPages';
import { METHODOLOGY_SLUG } from './siteLinks';

/** A link in a page: its words and where it goes. */
export type ContentLink = { label: string; href: string };

/** Text in a paragraph: plain words, or a link in the middle of them. */
export type Inline = string | ContentLink;

/** One entry of a list of forms. With no `href` it is listed without a link. */
export type ListItem = { label: string; href?: string; description: string };

/** One piece of a section, shown in order. */
export type ContentBlock =
  | { kind: 'paragraph'; content: Inline[] }
  /** A list of entries; a title above it is shown as a small heading. */
  | { kind: 'list'; title?: string; items: ListItem[] }
  /** A labelled group of links, as a grid of buttons or a single row. */
  | {
      kind: 'links';
      label: string;
      layout: 'grid' | 'row';
      links: ContentLink[];
    }
  /** A table with a caption and column headings; every row has one cell per heading. */
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] };

/** A heading and the blocks under it. */
export type ContentSection = { heading: string; blocks: ContentBlock[] };

/** A paragraph block from words and links. */
export function paragraph(...content: Inline[]): ContentBlock {
  return { kind: 'paragraph', content };
}

/** One reading page of the site. Adding a page is one entry in `contentPages`. */
export type ContentPageSpec = {
  /** Where the page lives: `ca-on`, `methodology`, `forms/bc428`. */
  slug: string;
  /** The browser tab title and share title; under 60 characters. */
  title: string;
  /** The search and share description; under 160 characters. */
  description: string;
  /** The h1 of the page, and its last breadcrumb. */
  heading: string;
  /** A short line under the heading. */
  lede?: string;
  /** The pages between Home and this one, nearest to Home first. Each is itself a listed page. */
  trail: { label: string; slug: string }[];
  sections: ContentSection[];
  /** Set on a form's page: its parts, drawn after the lede in place of `sections`. */
  form?: FormBody;
};

export const contentPages: ContentPageSpec[] = [
  {
    slug: METHODOLOGY_SLUG,
    title: 'How the take-home estimates are worked out',
    description:
      'How the take-home estimate is produced: the published forms followed line by line, exact arithmetic, and how the results are checked.',
    heading: 'How the estimates are worked out',
    lede: 'What the calculator does with your salary, how we check it, and where it stops being reliable.',
    trail: [],
    sections: [
      {
        heading: 'It follows the published forms',
        blocks: [
          paragraph(
            'The calculation is done by an open-source engine that follows the published federal and provincial forms line by line. Each line on a form, from the pension and EI amounts to the credits and the tax on each bracket, is one step in the engine, in the same order as the form. The advanced view under your answer lists those steps with the form and line each one comes from, so you can follow the figure on paper.',
          ),
          paragraph(
            'Every rate, threshold and maximum comes from the published forms and tables for that place and year.',
          ),
        ],
      },
      {
        heading: 'Exact arithmetic',
        blocks: [
          paragraph(
            "Money is never held as an ordinary floating-point number, which can be off by a fraction of a cent. The engine works in exact decimals. It rounds only where a form's own instructions say to round, and each such step rounds the way the form says. Nothing is rounded along the way for convenience, so the cents you see are the cents the forms give.",
          ),
        ],
      },
      {
        heading: 'How we check it',
        blocks: [
          paragraph(
            "We check the engine's results for each province and tax year over more than a hundred salaries, chosen to cover every tax bracket edge and the ceilings for the Canada Pension Plan and EI, because that is where mistakes hide.",
          ),
        ],
      },
      {
        heading: 'What it does not do',
        blocks: [
          paragraph(
            'It estimates take-home pay from employment income for Ontario, Alberta and British Columbia. Other places are listed as coming soon.',
          ),
          paragraph(
            'The 2026 figures are provisional. They use the rates published so far and are replaced as the final rates are published. The page says so whenever you ask for a provisional year.',
          ),
          paragraph(
            'It is an estimate, not tax advice. Your own situation and what your employer withholds decide what you actually take home.',
          ),
        ],
      },
      {
        heading: 'Look for yourself',
        blocks: [
          paragraph(
            'The engine is open source, so anyone can read how each line is worked out and run it. Nothing you enter on this site is saved.',
          ),
        ],
      },
    ],
  },
  ...formPages.map(formContentPage),
];
