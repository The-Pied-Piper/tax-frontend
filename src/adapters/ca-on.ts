import type { ComputeTakeHomeCalculationResponse, Unit } from '../api';
import { sumAmounts } from '../money/sum';
import { strings } from '../strings';
import { advancedGroups, fallbackResult, responseUnit } from './fallback';
import type { AdaptedResult, DisplayRow, JurisdictionAdapter } from './types';

/** Exact trace labels read from the real $70,000 and $90,000 responses for 2025 and 2026. */
const LABELS = {
  cppBase: {
    form: 'ca/schedule_8',
    label: 'schedule_8_cpp_base_contributions_on_return',
  },
  // Enhanced contributions on the first earnings ceiling (line 12). The
  // "enhanced on return" total also holds CPP2, so it is not used here.
  cppEnhancedFirst: { form: 'ca/schedule_8', label: 'cpp_part_3_line_12' },
  // Second additional contribution on earnings above the first ceiling (line 22).
  cpp2: { form: 'ca/schedule_8', label: 'cpp_part_3_line_22' },
  ei: { form: 'ca/t1_tax_and_credits', label: 'ei_premiums_line_88' },
  federalTax: { form: 'ca/t1_tax_and_credits', label: 'net_federal_tax' },
  ontarioTax: { form: 'ca-on/on428', label: 'on428_ontario_tax_line_90' },
  totalTax: { form: 'ca/t1_tax_and_credits', label: 'total_payable' },
} as const;

type Wanted = { form: string; label: string };
type Found = { amount: string; unit: Unit | null };

function find(
  response: ComputeTakeHomeCalculationResponse,
  wanted: Wanted,
): Found | undefined {
  const line = response.trace
    ?.filter((f) => f.form === wanted.form)
    .flatMap((f) => f.lines)
    .find((l) => l.label === wanted.label);
  if (line?.amount === undefined) return undefined;
  return { amount: line.amount, unit: line.unit ?? null };
}

function sameUnit(a: Unit | null, b: Unit | null): boolean {
  return a === null || b === null ? a === b : a.name === b.name;
}

function row(
  id: string,
  text: { name: string; help: string },
  found: { amount: string; unit: Unit | null },
  group?: string,
): DisplayRow {
  const { amount, unit } = found;
  return group === undefined
    ? { id, name: text.name, help: text.help, amount, unit }
    : { id, name: text.name, help: text.help, amount, unit, group };
}

function adapt(response: ComputeTakeHomeCalculationResponse): AdaptedResult {
  const cppBase = find(response, LABELS.cppBase);
  const cppEnhancedFirst = find(response, LABELS.cppEnhancedFirst);
  const cpp2 = find(response, LABELS.cpp2);
  const ei = find(response, LABELS.ei);
  const federalTax = find(response, LABELS.federalTax);
  const ontarioTax = find(response, LABELS.ontarioTax);
  const totalTax = find(response, LABELS.totalTax);
  if (
    cppBase === undefined ||
    cppEnhancedFirst === undefined ||
    cpp2 === undefined ||
    ei === undefined ||
    federalTax === undefined ||
    ontarioTax === undefined ||
    totalTax === undefined
  ) {
    // A label we rely on is missing: show nothing half-right, keep the advanced view.
    return fallbackResult(response);
  }
  // Two lines in different units cannot be added: same rule as an unreadable amount.
  if (!sameUnit(cppBase.unit, cppEnhancedFirst.unit)) {
    return fallbackResult(response);
  }
  let cpp: string;
  let cpp2Exact: string;
  try {
    cpp = sumAmounts([cppBase.amount, cppEnhancedFirst.amount]);
    cpp2Exact = sumAmounts([cpp2.amount]);
  } catch {
    // An amount we cannot add exactly: same rule, show nothing half-right.
    return fallbackResult(response);
  }
  const text = strings.adapters.caOn;
  return {
    unit: responseUnit(response),
    rows: [
      row(
        'cpp',
        text.cpp,
        { amount: cpp, unit: cppBase.unit },
        text.groups.pension,
      ),
      row(
        'cpp2',
        text.cpp2,
        { amount: cpp2Exact, unit: cpp2.unit },
        text.groups.pension,
      ),
      row('ei', text.ei, ei, text.groups.ei),
      row('federal-tax', text.federalTax, federalTax, text.groups.incomeTax),
      row('ontario-tax', text.ontarioTax, ontarioTax, text.groups.incomeTax),
    ],
    totals: [
      row('total-tax', text.totalTax, totalTax, text.groups.incomeTax),
      row('total-taken-off', text.totalTakenOff, {
        amount: response.total_deductions,
        unit: responseUnit(response),
      }),
    ],
    advanced: advancedGroups(response),
  };
}

export const caOnAdapter: JurisdictionAdapter = {
  jurisdictionCode: 'CA-ON',
  adapt,
};
