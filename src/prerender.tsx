import { renderToString } from 'react-dom/server';
import { App } from './App';
import type { SalaryPageData } from './state/useTakeHome';

/** The page body of a pre-built salary page: the real App, no network. */
export function renderSalaryApp(data: SalaryPageData): string {
  return renderToString(<App initial={data} />);
}
