import { displayMoney } from '../money/format';
import { isPositive, isZero } from '../money/sign';
import { subtractAmounts } from '../money/amounts';
import { sumAmounts } from '../money/sum';
import { strings } from '../strings';
import { find, row, sameUnit, type Found, type Wanted } from './ca-federal';
import { advancedGroups, fallbackResult, responseUnit } from './fallback';
import type { AdaptedResult, JurisdictionAdapter } from './types';

/**
 * Exact trace labels read from the real engine answers for 2025 and 2026. Quebec has its own pension
 * plan, parental insurance and drug premium, and the federal tax shown is after the Quebec abatement
 * (the take-home basis), so it does not share `adaptCanadian`.
 */
const LABELS = {
  // Schedule U line 17: base plus first additional contribution; line 17.4: second additional contribution.
  qpp: { form: 'ca-qc/tp1_schedule_u', label: 'schedule_u_line_17' },
  qpp2: { form: 'ca-qc/tp1_schedule_u', label: 'schedule_u_line_17_4' },
  qpip: { form: 'ca-qc/ppip_premium', label: 'ppip_premiums_paid' },
  ei: { form: 'ca-qc/t1_tax_and_credits', label: 'ei_premiums_line_89' },
  federalTax: {
    form: 'ca-qc/t1_tax_and_credits',
    label: 'net_federal_tax_line_146',
  },
  // Line 156: 16.5% of the basic federal tax, taken off the federal tax of a Quebec resident.
  abatement: {
    form: 'ca-qc/t1_tax_and_credits',
    label: 'refundable_quebec_abatement_line_156',
  },
  quebecTax: { form: 'ca-qc/tp1_tax', label: 'tp1_line_432' },
  drugPremium: {
    form: 'ca-qc/tp1_totals',
    label: 'tp1_drug_insurance_premium_line_447',
  },
} as const satisfies Record<string, Wanted>;

const GROUPS = strings.adapters.caQc.groups;

export const caQcAdapter: JurisdictionAdapter = {
  jurisdictionCode: 'CA-QC',
  adapt(response): AdaptedResult {
    const found: Record<keyof typeof LABELS, Found | undefined> = {
      qpp: find(response, LABELS.qpp),
      qpp2: find(response, LABELS.qpp2),
      qpip: find(response, LABELS.qpip),
      ei: find(response, LABELS.ei),
      federalTax: find(response, LABELS.federalTax),
      abatement: find(response, LABELS.abatement),
      quebecTax: find(response, LABELS.quebecTax),
      drugPremium: find(response, LABELS.drugPremium),
    };
    const {
      qpp,
      qpp2,
      qpip,
      ei,
      federalTax,
      abatement,
      quebecTax,
      drugPremium,
    } = found;
    if (
      qpp === undefined ||
      qpp2 === undefined ||
      qpip === undefined ||
      ei === undefined ||
      federalTax === undefined ||
      abatement === undefined ||
      quebecTax === undefined ||
      drugPremium === undefined
    ) {
      // A label we rely on is missing: show nothing half-right, keep the advanced view.
      return fallbackResult(response);
    }
    const text = strings.adapters.caQc;
    let federalAfterAbatement: string;
    let totalTax: string;
    let eiHelp = text.ei.help;
    // Two lines in different units cannot be added.
    if (
      !sameUnit(federalTax.unit, abatement.unit) ||
      !sameUnit(federalTax.unit, quebecTax.unit)
    ) {
      return fallbackResult(response);
    }
    try {
      federalAfterAbatement = subtractAmounts(
        federalTax.amount,
        abatement.amount,
      );
      totalTax = sumAmounts([federalAfterAbatement, quebecTax.amount]);
      // No premium counted on a real salary: say why, since a pay slip shows one.
      if (isZero(ei.amount) && isPositive(response.salary)) {
        eiHelp = `${eiHelp} ${strings.adapters.caFederal.eiRefundedNote(displayMoney(response.salary, 'annually', responseUnit(response)))}`;
      }
    } catch {
      // An amount we cannot add exactly: show nothing half-right.
      return fallbackResult(response);
    }
    return {
      unit: responseUnit(response),
      rows: [
        row('qpp', text.qpp, qpp, GROUPS.pension),
        row(
          'qpp2',
          { name: text.qpp2.name, help: text.qpp2.help(text.zero) },
          qpp2,
          GROUPS.pension,
        ),
        row('ei', { name: text.ei.name, help: eiHelp }, ei, GROUPS.ei),
        row('qpip', text.qpip, qpip, GROUPS.parentalInsurance),
        row(
          'federal-tax',
          text.federalTax,
          { amount: federalAfterAbatement, unit: federalTax.unit },
          GROUPS.incomeTax,
        ),
        row('quebec-tax', text.quebecTax, quebecTax, GROUPS.incomeTax),
        row('drug-premium', text.drugPremium, drugPremium, GROUPS.drugPremium),
      ],
      totals: [
        row(
          'total-tax',
          // Federal plus Quebec tax; the engine's own total payable also holds the drug premium, which has its own row.
          text.totalTax,
          { amount: totalTax, unit: federalTax.unit },
          GROUPS.incomeTax,
        ),
        row('total-taken-off', text.totalTakenOff, {
          amount: response.total_deductions,
          unit: responseUnit(response),
        }),
      ],
      advanced: advancedGroups(response),
      wording: text.wording,
    };
  },
};
