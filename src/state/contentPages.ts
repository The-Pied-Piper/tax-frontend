import { METHODOLOGY_SLUG } from './siteLinks';

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
  sections: { heading: string; paragraphs: string[] }[];
};

/** The id of the slot in a pre-built content page where the Light/Dark switch is mounted. */
export const THEME_TOGGLE_SLOT_ID = 'content-theme-toggle';

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
        paragraphs: [
          'The calculation is done by an open-source engine that follows the published federal and provincial forms line by line. Each line on a form, from the pension and EI amounts to the credits and the tax on each bracket, is one step in the engine, in the same order as the form. The advanced view under your answer lists those steps with the form and line each one comes from, so you can follow the figure on paper.',
          'Every rate, threshold and maximum comes from the published forms and tables for that place and year.',
        ],
      },
      {
        heading: 'Exact arithmetic',
        paragraphs: [
          "Money is never held as an ordinary floating-point number, which can be off by a fraction of a cent. The engine works in exact decimals. It rounds only where a form's own instructions say to round, and each such step rounds the way the form says. Nothing is rounded along the way for convenience, so the cents you see are the cents the forms give.",
        ],
      },
      {
        heading: 'How we check it',
        paragraphs: [
          "We check the engine's results for each province and tax year over more than a hundred salaries, chosen to cover every tax bracket edge and the ceilings for the Canada Pension Plan and EI, because that is where mistakes hide.",
        ],
      },
      {
        heading: 'What it does not do',
        paragraphs: [
          'It estimates take-home pay from employment income for Ontario, Alberta and British Columbia. Other places are listed as coming soon.',
          'The 2026 figures are provisional. They use the rates published so far and are replaced as the final rates are published. The page says so whenever you ask for a provisional year.',
          'It is an estimate, not tax advice. Your own situation and what your employer withholds decide what you actually take home.',
        ],
      },
      {
        heading: 'Look for yourself',
        paragraphs: [
          'The engine is open source, so anyone can read how each line is worked out and run it. Nothing you enter on this site is saved.',
        ],
      },
    ],
  },
];
