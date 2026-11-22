// Test data only: nothing in the build imports this file. Made-up content
// pages for the tests of the shared page shell and its build step.
import { paragraph, type ContentPageSpec } from '../state/contentPages';
import type { FormPageSpec } from '../state/formPage';

/** A parent page: no trail, one section. */
export const parentSpec: ContentPageSpec = {
  slug: 'sample-hub',
  title: 'Sample hub page',
  description: 'A made-up hub page that the tests use as a parent.',
  heading: 'Sample hub',
  trail: [],
  sections: [{ heading: 'First part', blocks: [paragraph('Hub text.')] }],
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
      blocks: [
        paragraph('First paragraph of the first part.'),
        paragraph('Second paragraph.'),
      ],
    },
    { heading: 'Another part', blocks: [paragraph('Only paragraph.')] },
  ],
};

/** A page with no lede and no trail. */
export const plainSpec: ContentPageSpec = {
  slug: 'plain-page',
  title: 'Plain page',
  description: 'A made-up page with no lede and no trail.',
  heading: 'Plain heading',
  trail: [],
  sections: [{ heading: 'Only part', blocks: [paragraph('Some words.')] }],
};

/** A page with one block of every kind. */
export const blocksSpec: ContentPageSpec = {
  slug: 'blocks-page',
  title: 'Blocks page',
  description: 'A made-up page with one block of every kind.',
  heading: 'Blocks heading',
  trail: [],
  sections: [
    {
      heading: 'Words and a link',
      blocks: [
        paragraph(
          'Before ',
          { label: 'the link', href: '/sample-hub/' },
          ' after.',
        ),
      ],
    },
    {
      heading: 'A list',
      blocks: [
        {
          kind: 'list',
          title: 'Listed forms',
          items: [
            {
              label: 'Linked form',
              href: '/forms/linked/',
              description: 'The one with a page.',
            },
            { label: 'Plain form', description: 'The one without a page.' },
          ],
        },
        {
          kind: 'list',
          items: [{ label: 'Untitled item', description: 'No title above.' }],
        },
      ],
    },
    {
      heading: 'Links',
      blocks: [
        {
          kind: 'links',
          label: 'Grid of links',
          layout: 'grid',
          links: [
            { label: 'One', href: '/one/' },
            { label: 'Two', href: '/two/' },
          ],
        },
        {
          kind: 'links',
          label: 'Row of links',
          layout: 'row',
          links: [{ label: 'Three', href: '/three/' }],
        },
      ],
    },
    {
      heading: 'A table',
      blocks: [
        {
          kind: 'table',
          caption: 'Sample rates',
          head: ['Band', 'Rate'],
          rows: [
            ['First', '5%'],
            ['Second', '10%'],
          ],
        },
      ],
    },
    {
      heading: 'A comparison',
      blocks: [{ kind: 'provinceComparison', province: 'ca-on' }],
    },
  ],
};

/** A made-up form page, for the tests of the form template. */
export const sampleFormSpec: FormPageSpec = {
  id: 'sample-form',
  name: 'Form SAMPLE: A made-up form',
  province: 'ca-on',
  year: 2025,
  exampleSalary: '70000',
  title: 'Form SAMPLE in plain words',
  description: 'A made-up form page that the tests use.',
  intro: 'What the made-up form is for.',
  sections: [
    {
      id: 'first',
      heading: 'First part',
      lines: 'Line 1',
      paragraph: 'You get {credit} off.',
      example: 'That is {credit} less tax.',
      figures: {
        credit: { shown: '$100', trace: { form: 'x/y', label: 'z' } },
      },
    },
    {
      id: 'second',
      heading: 'Second part',
      lines: 'Lines 2–4',
      paragraph: 'Only words here.',
      example: 'No figure.',
      figures: {},
    },
  ],
};
