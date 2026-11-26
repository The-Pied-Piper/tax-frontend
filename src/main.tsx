import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { watchEngagement } from './beacon/engagementBeacon';
import { sendVisitBeacon, type VisitKind } from './beacon/visitBeacon';
import {
  parseSalaryPageData,
  SALARY_PAGE_DATA_ID,
} from './state/salaryPageData';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

async function start(root: HTMLElement): Promise<VisitKind> {
  // `npm run dev:mock` serves the saved responses in src/api/fixtures instead
  // of calling a real tax-service. The dynamic import keeps it out of builds.
  if (import.meta.env.MODE === 'mock') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledFrame: 'bypass' });
  }
  const initial = parseSalaryPageData(
    document.getElementById(SALARY_PAGE_DATA_ID)?.textContent ?? null,
  );
  createRoot(root).render(
    <StrictMode>
      <App initial={initial ?? undefined} />
    </StrictMode>,
  );
  return initial ? 'salary' : 'home';
}

// The calculator and the pre-built salary pages. The visit beacon and the
// engagement beacon are their own modules, started once the page is up; content
// pages (src/contentMain.tsx) start the same two without the calculator.
void start(root).then((kind) => {
  sendVisitBeacon(kind);
  watchEngagement(kind);
});
