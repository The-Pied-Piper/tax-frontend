import type { ComputeTakeHomeCalculationResponse } from '../api';
import { strings } from '../strings';
import type { AdaptedResult, AdvancedGroup } from './types';

/** Groups every trace line by form for the advanced view. Same for every jurisdiction. */
export function advancedGroups(
  response: ComputeTakeHomeCalculationResponse,
): AdvancedGroup[] {
  return (response.trace ?? []).flatMap((form) => {
    // Only lines the form prints a number for are shown.
    const lines = form.lines.flatMap((line) => {
      const reference = line.reference?.trim();
      if (!reference) return [];
      return [
        {
          label: line.name?.trim() || strings.advanced.lineNumber(reference),
          named: Boolean(line.name?.trim()),
          reference,
          amount: line.amount ?? null,
          detail: line.text.trim() ? line.text : strings.advanced.noDetail,
        },
      ];
    });
    if (lines.length === 0) return [];
    return [{ form: form.form, name: form.name.trim() || form.form, lines }];
  });
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
