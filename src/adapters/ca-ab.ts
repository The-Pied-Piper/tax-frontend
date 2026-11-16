import { strings } from '../strings';
import { adaptCanadian, type ProvincialLine } from './ca-federal';
import type { JurisdictionAdapter } from './types';

/** Alberta's own lines; the federal rows come from `ca-federal.ts`. */
const ALBERTA: ProvincialLine = {
  wanted: { form: 'ca-ab/ab428', label: 'ab428_alberta_tax_line_75' },
  id: 'alberta-tax',
  text: {
    tax: strings.adapters.caAb.albertaTax,
    totalTax: strings.adapters.caAb.totalTax,
  },
};

export const caAbAdapter: JurisdictionAdapter = {
  jurisdictionCode: 'CA-AB',
  adapt: (response) => adaptCanadian(response, ALBERTA),
};
