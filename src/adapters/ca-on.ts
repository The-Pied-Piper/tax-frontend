import type { ComputeTakeHomeCalculationResponse } from '../api';
import { sumAmounts } from '../money/sum';
import { strings } from '../strings';
import { advancedGroups, fallbackResult } from './fallback';
import type { AdaptedResult, DisplayRow, JurisdictionAdapter } from './types';

/** Exact trace labels read from the real $70,000 responses for 2025 and 2026. */
const LABELS = {
  cppBase: {
    form: 'ca/schedule_8',
    label: 'schedule_8_cpp_base_contributions_on_return',
  },
  cppEnhanced: {
    form: 'ca/schedule_8',
    label: 'schedule_8_cpp_enhanced_contributions_on_return',
  },
  ei: { form: 'ca/t1_tax_and_credits', label: 'ei_premiums_line_88' },
  federalTax: { form: 'ca/t1_tax_and_credits', label: 'net_federal_tax' },
  ontarioTax: { form: 'ca-on/on428', label: 'on428_ontario_tax_line_90' },
  totalTax: { form: 'ca/t1_tax_and_credits', label: 'total_payable' },
} as const;

type Wanted = { form: string; label: string };

function find(
  response: ComputeTakeHomeCalculationResponse,
  wanted: Wanted,
): string | undefined {
  const form = response.trace?.find((f) => f.form === wanted.form);
  return form?.lines.find((l) => l.label === wanted.label)?.amount;
}

function row(
  id: string,
  text: { name: string; help: string },
  amount: string,
): DisplayRow {
  return { id, name: text.name, help: text.help, amount };
}

function adapt(response: ComputeTakeHomeCalculationResponse): AdaptedResult {
  const cppBase = find(response, LABELS.cppBase);
  const cppEnhanced = find(response, LABELS.cppEnhanced);
  const ei = find(response, LABELS.ei);
  const federalTax = find(response, LABELS.federalTax);
  const ontarioTax = find(response, LABELS.ontarioTax);
  const totalTax = find(response, LABELS.totalTax);
  if (
    cppBase === undefined ||
    cppEnhanced === undefined ||
    ei === undefined ||
    federalTax === undefined ||
    ontarioTax === undefined ||
    totalTax === undefined
  ) {
    // A label we rely on is missing: show nothing half-right, keep the advanced view.
    return fallbackResult(response);
  }
  const text = strings.adapters.caOn;
  return {
    rows: [
      row('cpp', text.cpp, sumAmounts([cppBase, cppEnhanced])),
      row('ei', text.ei, ei),
      row('federal-tax', text.federalTax, federalTax),
      row('ontario-tax', text.ontarioTax, ontarioTax),
    ],
    totals: [
      row('total-tax', text.totalTax, totalTax),
      row('total-taken-off', text.totalTakenOff, response.total_deductions),
    ],
    advanced: advancedGroups(response),
  };
}

export const caOnAdapter: JurisdictionAdapter = {
  jurisdictionCode: 'CA-ON',
  adapt,
};
