import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** For tests: setupTests.ts starts it, resets handlers after each test and closes it; use `server.use(...)` to override. */
export const server = setupServer(...handlers);
