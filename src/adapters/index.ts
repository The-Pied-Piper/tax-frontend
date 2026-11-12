import { caOnAdapter } from './ca-on';
import { AdapterRegistry } from './registry';

export * from './types';
export { advancedGroups, fallbackResult } from './fallback';
export { COMING_SOON } from './coming-soon';
export { AdapterRegistry } from './registry';

/** The registry the page uses. Adding a jurisdiction means registering one adapter here. */
export const adapters = new AdapterRegistry();
adapters.register(caOnAdapter);
