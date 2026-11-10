import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './mocks/server';

// Every test file gets the shared mock service worker: the saved engine
// fixtures answer the API. A request nothing handles fails the test. Tests
// that need another answer call `server.use(...)`; it is undone after each test.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
