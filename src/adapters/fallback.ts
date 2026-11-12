import type { ComputeTakeHomeCalculationResponse } from '../api';
import { strings } from '../strings';
import type { AdaptedResult, AdvancedGroup, Unit } from './types';

/**
 * A trace line's unit as the API sent it. The API types it loosely (a unit or
 * an empty object or null), so anything that is not a whole unit reads as none.
 */
export function readUnit(raw: unknown): Unit | null {
  if (typeof raw !== 'object' || raw === null) return null;
  if (!('name' in raw) || typeof raw.name !== 'string') return null;
  if (!('placement' in raw)) return null;
  const { placement } = raw;
  if (placement !== 'before' && placement !== 'after') return null;
  if (!('singular' in raw) || typeof raw.singular !== 'string') return null;
  if (!('plural' in raw) || typeof raw.plural !== 'string') return null;
  if (!('spaced' in raw) || typeof raw.spaced !== 'boolean') return null;
  return {
    name: raw.name,
    placement,
    singular: raw.singular,
    plural: raw.plural,
    spaced: raw.spaced,
  };
}

/** The response's unit; an older API sends none, then the fallback unit stands in. */
export function responseUnit(response: { unit?: Unit | null }): Unit {
  return response.unit ?? strings.fallbackUnit;
}

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
          unit: readUnit(line.unit),
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
  return {
    unit: responseUnit(response),
    rows: [],
    totals: [],
    advanced: advancedGroups(response),
  };
}
