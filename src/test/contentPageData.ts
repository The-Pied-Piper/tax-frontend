// Test data only: nothing in the build imports this file. Made-up content
// pages for the tests of the shared page shell and its build step.
import type { ContentPageSpec } from '../state/contentPages';

/** A parent page: no trail, one section. */
export const parentSpec: ContentPageSpec = {
  slug: 'sample-hub',
  title: 'Sample hub page',
  description: 'A made-up hub page that the tests use as a parent.',
  heading: 'Sample hub',
  trail: [],
  sections: [{ heading: 'First part', paragraphs: ['Hub text.'] }],
};

/** A page with a lede, a one-step trail and two sections. */
export const sampleSpec: ContentPageSpec = {
  slug: 'sample-page',
  title: 'Sample page title',
  description: 'A made-up page that the tests use to check the shared shell.',
  heading: 'Sample page heading',
  lede: 'A short line under the heading.',
  trail: [{ label: 'Sample hub', slug: 'sample-hub' }],
  sections: [
    {
      heading: 'How it works',
      paragraphs: ['First paragraph of the first part.', 'Second paragraph.'],
    },
    { heading: 'Another part', paragraphs: ['Only paragraph.'] },
  ],
};

/** A page with no lede and no trail. */
export const plainSpec: ContentPageSpec = {
  slug: 'plain-page',
  title: 'Plain page',
  description: 'A made-up page with no lede and no trail.',
  heading: 'Plain heading',
  trail: [],
  sections: [{ heading: 'Only part', paragraphs: ['Some words.'] }],
};
