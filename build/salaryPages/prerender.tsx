import { renderToString } from 'react-dom/server';
import { App } from '../../src/App';
import { ContentPage } from '../../src/components/ContentPage';
import { SiteFooter } from '../../src/components/SiteFooter';
import type { ContentPageSpec } from '../../src/state/contentPages';
import type { SalaryPageData } from '../../src/state/useTakeHome';

/** The page body of a pre-built salary page: the real App, no network. */
export function renderSalaryApp(data: SalaryPageData): string {
  return renderToString(<App initial={data} />);
}

/** The site footer, the real component: written into the home page's static HTML. */
export function renderSiteFooter(): string {
  return renderToString(<SiteFooter />);
}

/** The page body of a pre-built content page: the real ContentPage, no network. */
export function renderContentPage(spec: ContentPageSpec): string {
  return renderToString(<ContentPage {...spec} />);
}
