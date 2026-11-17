import { strings } from '../strings';
import { paragraph, type ContentPageSpec } from './contentPages';
import {
  FOOTER_PROVINCE_SLUGS,
  HOME_PATH,
  METHODOLOGY_SLUG,
  contentPath,
} from './siteLinks';

/** The page shown for an address that has no page. It is written as the not-found file, not listed in `contentPages`. */
export const notFoundPage: ContentPageSpec = {
  slug: 'not-found',
  title: 'Page not found',
  description:
    'There is no page at this address on this site. Go to the calculator or pick one of the pages listed here.',
  heading: 'We could not find that page',
  lede: 'The address may be mistyped, or the page may have moved.',
  trail: [],
  sections: [
    {
      heading: 'Where to go',
      blocks: [
        paragraph(
          'Nothing was found at this address. Pick one of the pages below instead.',
        ),
        {
          kind: 'links',
          label: 'Pages you can reach',
          layout: 'grid',
          links: [
            { label: strings.siteNav.home, href: HOME_PATH },
            ...FOOTER_PROVINCE_SLUGS.map((slug) => ({
              label: strings.siteNav.provinceNames[slug],
              href: contentPath(slug),
            })),
            {
              label: strings.siteNav.methodology,
              href: contentPath(METHODOLOGY_SLUG),
            },
          ],
        },
      ],
    },
  ],
};
