import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import {
  parseSalaryPageData,
  SALARY_PAGE_DATA_ID,
} from './state/salaryPageData';
import { parseSalaryIndex, SALARY_INDEX_ID } from './state/salaryIndex';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

async function start(root: HTMLElement) {
  // `npm run dev:mock` serves the saved responses in src/api/fixtures instead
  // of calling a real tax-service. The dynamic import keeps it out of builds.
  if (import.meta.env.MODE === 'mock') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledFrame: 'bypass' });
  }
  const initial = parseSalaryPageData(
    document.getElementById(SALARY_PAGE_DATA_ID)?.textContent ?? null,
  );
  const salaryIndex = parseSalaryIndex(
    document.getElementById(SALARY_INDEX_ID)?.textContent ?? null,
  );
  createRoot(root).render(
    <StrictMode>
      <App
        initial={initial ?? undefined}
        salaryIndex={salaryIndex ?? undefined}
      />
    </StrictMode>,
  );
}

void start(root);
