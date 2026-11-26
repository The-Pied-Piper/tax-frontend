import type { HubChartId } from './hubCharts';
import { formContentPage, type FormBody } from './formPage';
import { formPages } from './formPages';
import {
  ENGINE_REPO_URL,
  METHODOLOGY_SLUG,
  type FooterProvinceSlug,
} from './siteLinks';

/** A link in a page: its words and where it goes. */
export type ContentLink = { label: string; href: string };

/** Text in a paragraph: plain words, or a link in the middle of them. */
export type Inline = string | ContentLink;

/** One entry of a list of forms. With no `href` it is listed without a link. */
export type ListItem = { label: string; href?: string; description: string };

/** One piece of a section, shown in order. */
export type ContentBlock =
  | { kind: 'paragraph'; content: Inline[] }
  /** A small heading inside a section, for a part of it that has its own title. */
  | { kind: 'subheading'; text: string }
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
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] }
  /** One salary chart of a province hub: a data reference only; the build and the page fill it from the hub's data block. */
  | { kind: 'salaryChart'; province: FooterProvinceSlug; chart: HubChartId }
  /** What one of a hub's charts shows for its province: bullets the page writes from the hub's data block, so no figure is typed here. Draws nothing when the hub has no sweep or no text for the chart. */
  | { kind: 'chartNotes'; province: FooterProvinceSlug; chart: HubChartId }
  /** The province comparison of a hub: bars for every served province at one salary. It carries only the hub's slug; the page draws it from the hub's data block. */
  | { kind: 'provinceComparison'; province: FooterProvinceSlug }
  /** One part of a province's rates page, written from the hub data block's sweep so no figure is typed here: the opening finding and basis, how to read the salaries, the notes grouped by salary range, or the bracket tables. Draws nothing when the sweep is missing; a sweep that is not the full one never gets this far, the build refuses it. */
  | { kind: 'ratesPart'; province: FooterProvinceSlug; part: RatesPart }
  /** The rates page's chart with its slider and closed table; a slot the browser hydrates from the page's data block. */
  | { kind: 'ratesChart'; province: FooterProvinceSlug };

/** The parts of a rates page the text blocks draw. */
export type RatesPart =
  'lead' | 'jump' | 'basis' | 'howToRead' | 'groups' | 'tables';

/** A heading and the blocks under it. With an `id` the section has a permalink, such as `#average-rate`; with `card` it is drawn as a bordered card. */
export type ContentSection = {
  /** Left out, the section has no heading: the lead under the page's own heading. */
  heading?: string;
  id?: string;
  card?: true;
  blocks: ContentBlock[];
};

/** A paragraph block from words and links. */
export function paragraph(...content: Inline[]): ContentBlock {
  return { kind: 'paragraph', content };
}

/** One reading page of the site. Adding a page is one entry in `contentPages`. */
export type ContentPageSpec = {
  /** Where the page lives: `ca-on`, `methodology`, `forms/bc428`. */
  slug: string;
  /** The browser tab title and share title; under 64 characters. */
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
      'How we work out your take-home pay: we follow the published forms line by line, use exact math, and check the results.',
    heading: 'How the estimates are worked out',
    lede: 'What the calculator does with your salary, how we check it, and where it stops being reliable.',
    trail: [],
    sections: [
      {
        heading: 'It follows the published forms',
        blocks: [
          paragraph(
            'A program that anyone can read, called an open-source engine, does the math. It follows the published federal and provincial tax forms line by line. Each line on a form is one step in the engine, in the same order. That covers everything from your pension and EI amounts to your credits and the tax on each slice of income. Under your answer, the advanced view lists every step and the form line it comes from, so you can follow along on paper.',
          ),
          paragraph(
            'Every rate, limit and top amount comes from the published forms and tables for that province and year.',
          ),
        ],
      },
      {
        heading: 'Credits paid to you when you file',
        blocks: [
          paragraph(
            'Some credits are paid to you after you file your return, instead of lowering the tax you owe. Examples are the Canada workers benefit, the Employment Insurance refund, credits paid by your province, and in Québec the work premium and the solidarity tax credit.',
          ),
          paragraph(
            'This site does not count them in your take-home pay or your rates. They arrive as a payment after you file, they depend on your family, other income and what you claim, and they are not taken from your pay.',
          ),
          paragraph(
            'Credits that lower the tax itself are counted, for example tax cuts such as the Ontario LIFT Credit and the Québec abatement.',
          ),
        ],
      },
      {
        heading: 'Exact arithmetic',
        blocks: [
          paragraph(
            'Computers often store money in a way that can be off by a tiny fraction of a cent. Our engine does not. It does its math with exact numbers. It rounds only where a form says to round, and it rounds the way the form says. It never rounds early to make things easier, so the cents you see are the cents the forms give.',
          ),
        ],
      },
      {
        heading: 'How we check it',
        blocks: [
          paragraph(
            'For each province and tax year, we run more than a hundred salaries through the engine and check the results. We pick salaries at the edge of every tax slice and at the yearly limits for the pension plan and EI, because that is where mistakes hide.',
          ),
        ],
      },
      {
        heading: 'What it does not do',
        blocks: [
          paragraph(
            'It estimates take-home pay for a single person whose only income is a salary.',
          ),
          paragraph(
            'The 2026 figures are provisional. That means they use the rates published so far, and we replace them when the final rates come out. The calculator tells you whenever you pick a provisional year.',
          ),
          paragraph(
            'It is an estimate, not tax advice. What you actually take home depends on your own situation and on how much tax your employer takes off each paycheque.',
          ),
        ],
      },
      {
        heading: 'Look for yourself',
        blocks: [
          paragraph(
            'Because the engine is open source, anyone can read how each line is worked out and run it themselves. Nothing you enter on this site is saved. ',
            {
              label: "Read the engine's code on GitHub",
              href: ENGINE_REPO_URL,
            },
            '.',
          ),
        ],
      },
    ],
  },
  ...formPages.map(formContentPage),
];
