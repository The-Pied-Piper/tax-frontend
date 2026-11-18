import { strings } from '../strings';
import { adaptCanadian, type ProvincialLine } from './ca-federal';
import type { JurisdictionAdapter } from './types';

/** Manitoba's own lines; the federal rows come from `ca-federal.ts`. */
const MANITOBA: ProvincialLine = {
  wanted: { form: 'ca-mb/mb428', label: 'mb428_manitoba_tax_line_82' },
  id: 'manitoba-tax',
  text: {
    cpp2Zero: strings.adapters.caMb.cpp2Zero,
    tax: strings.adapters.caMb.manitobaTax,
    totalTax: strings.adapters.caMb.totalTax,
  },
};

export const caMbAdapter: JurisdictionAdapter = {
  jurisdictionCode: 'CA-MB',
  adapt: (response) => adaptCanadian(response, MANITOBA),
};
