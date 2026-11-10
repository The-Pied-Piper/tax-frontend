import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { App } from '../App';

/**
 * Renders the whole page the way main.tsx does. With no argument the page
 * uses the real client, which the shared mock service worker started in
 * setupTests.ts answers with the saved engine fixtures. Pass the props `App`
 * takes (a fake `ApiClient`) to replace the real ones. Test-only: nothing in
 * the build imports this file.
 */
export function renderApp(props: ComponentProps<typeof App> = {}) {
  return render(<App {...props} />);
}
