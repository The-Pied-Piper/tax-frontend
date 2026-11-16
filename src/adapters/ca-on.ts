import { strings } from '../strings';
import { adaptCanadian, type ProvincialLine } from './ca-federal';
import type { JurisdictionAdapter } from './types';

/** Ontario's own lines; the federal rows come from `ca-federal.ts`. */
const ONTARIO: ProvincialLine = {
  wanted: { form: 'ca-on/on428', label: 'on428_ontario_tax_line_90' },
  id: 'ontario-tax',
  text: {
    cpp2Zero: strings.adapters.caOn.cpp2Zero,
    tax: strings.adapters.caOn.ontarioTax,
    totalTax: strings.adapters.caOn.totalTax,
  },
};

export const caOnAdapter: JurisdictionAdapter = {
  jurisdictionCode: 'CA-ON',
  adapt: (response) => adaptCanadian(response, ONTARIO),
};
