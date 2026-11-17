import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ThemeToggle } from './components/ThemeToggle';
import { THEME_TOGGLE_SLOT_ID } from './state/themeSlot';
import { sendVisitBeacon } from './beacon/visitBeacon';
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
  createRoot(root).render(
    <StrictMode>
      <App initial={initial ?? undefined} />
    </StrictMode>,
  );
  sendVisitBeacon(initial ? 'salary' : 'home');
}

// A pre-built content page has a slot for the Light/Dark switch and nothing
// else to run: mount the switch there, with no calculator and no beacon.
const toggleSlot = document.getElementById(THEME_TOGGLE_SLOT_ID);
if (toggleSlot) {
  createRoot(toggleSlot).render(
    <StrictMode>
      <ThemeToggle />
    </StrictMode>,
  );
} else {
  void start(root);
}
