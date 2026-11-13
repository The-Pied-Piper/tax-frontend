import { renderToString } from 'react-dom/server';
import { App } from '../../src/App';
import { SalaryIndexNav } from '../../src/components/SalaryIndexNav';
import type { SalaryIndex } from '../../src/state/salaryIndex';
import type { SalaryPageData } from '../../src/state/useTakeHome';

/** The page body of a pre-built salary page: the real App, no network. */
export function renderSalaryApp(data: SalaryPageData): string {
  return renderToString(<App initial={data} />);
}

/** The Popular salaries nav of the home page: the real component, no network. */
export function renderSalaryIndexNav(index: SalaryIndex): string {
  return renderToString(<SalaryIndexNav index={index} />);
}
