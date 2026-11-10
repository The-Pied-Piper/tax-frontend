import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** For tests: `server.listen()` in beforeAll, `server.resetHandlers()` after each. */
export const server = setupServer(...handlers);
