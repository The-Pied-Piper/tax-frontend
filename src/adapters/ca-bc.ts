import { strings } from '../strings';
import { adaptCanadian, type ProvincialLine } from './ca-federal';
import type { JurisdictionAdapter } from './types';

/** British Columbia's own lines; the federal rows come from `ca-federal.ts`. */
const BRITISH_COLUMBIA: ProvincialLine = {
  wanted: { form: 'ca-bc/bc428', label: 'bc428_british_columbia_tax_line_91' },
  id: 'british-columbia-tax',
  text: {
    cpp2Zero: strings.adapters.caBc.cpp2Zero,
    tax: strings.adapters.caBc.britishColumbiaTax,
    totalTax: strings.adapters.caBc.totalTax,
  },
};

export const caBcAdapter: JurisdictionAdapter = {
  jurisdictionCode: 'CA-BC',
  adapt: (response) => adaptCanadian(response, BRITISH_COLUMBIA),
};
