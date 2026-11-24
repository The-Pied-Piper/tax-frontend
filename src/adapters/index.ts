import { caAbAdapter } from './ca-ab';
import { caBcAdapter } from './ca-bc';
import { caMbAdapter } from './ca-mb';
import { caOnAdapter } from './ca-on';
import { caQcAdapter } from './ca-qc';
import { caSkAdapter } from './ca-sk';
import { AdapterRegistry } from './registry';

export * from './types';
export { advancedGroups, fallbackResult } from './fallback';
export { COMING_SOON } from './coming-soon';
export { AdapterRegistry } from './registry';

/** The registry the page uses. Adding a jurisdiction means registering one adapter here. */
export const adapters = new AdapterRegistry();
adapters.register(caAbAdapter);
adapters.register(caBcAdapter);
adapters.register(caMbAdapter);
adapters.register(caOnAdapter);
adapters.register(caQcAdapter);
adapters.register(caSkAdapter);
