import { render } from '@testing-library/react';
import { App } from '../App';

/**
 * Renders the whole page the way main.tsx does, talking to the shared mock
 * service worker started in setupTests.ts. Test-only: nothing in the build
 * imports this file.
 */
export function renderApp() {
  return render(<App />);
}
