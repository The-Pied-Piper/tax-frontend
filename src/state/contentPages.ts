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

export const contentPages: ContentPageSpec[] = [];
