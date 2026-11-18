import { strings } from '../strings';
import { adaptCanadian, type ProvincialLine } from './ca-federal';
import type { JurisdictionAdapter } from './types';

/** Saskatchewan's own lines; the federal rows come from `ca-federal.ts`. */
const SASKATCHEWAN: ProvincialLine = {
  wanted: { form: 'ca-sk/sk428', label: 'sk428_saskatchewan_tax_line_82' },
  id: 'saskatchewan-tax',
  text: {
    cpp2Zero: strings.adapters.caSk.cpp2Zero,
    tax: strings.adapters.caSk.saskatchewanTax,
    totalTax: strings.adapters.caSk.totalTax,
  },
};

export const caSkAdapter: JurisdictionAdapter = {
  jurisdictionCode: 'CA-SK',
  adapt: (response) => adaptCanadian(response, SASKATCHEWAN),
};
