import type { ComputeTakeHomeCalculationResponse } from '../api';
import type { AdaptedResult, AdvancedGroup } from './types';

/** Shows an unknown label readably: underscores become spaces. */
export function fallbackLabel(label: string | null | undefined): string {
  return (label ?? '').replaceAll('_', ' ').trim();
}

/** Groups every trace line by form for the advanced view. Same for every jurisdiction. */
export function advancedGroups(
  response: ComputeTakeHomeCalculationResponse,
): AdvancedGroup[] {
  return (response.trace ?? []).map((form) => ({
    form: form.form,
    lines: form.lines.map((line) => ({
      label: fallbackLabel(line.label) || fallbackLabel(line.text),
      amount: line.amount ?? null,
    })),
  }));
}

/**
 * Used when no adapter is registered for a jurisdiction: no simple rows,
 * every trace line still available in the advanced view.
 */
export function fallbackResult(
  response: ComputeTakeHomeCalculationResponse,
): AdaptedResult {
  return { rows: [], totals: [], advanced: advancedGroups(response) };
}
