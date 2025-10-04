import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup mock service worker server
export const server = setupServer(...handlers);
