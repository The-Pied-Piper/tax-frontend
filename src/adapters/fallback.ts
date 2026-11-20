import type { ComputeTakeHomeCalculationResponse } from '../api';
import { strings } from '../strings';
import { pageOfForm } from './formPages';
import type { AdaptedResult, AdvancedGroup, Unit } from './types';

/**
 * The API names the Canadian dollar "CA$"; visitors read and search "$". This
 * is the one place that changes it, for every unit and every line of text.
 */
export function dollarSign(text: string): string {
  return text.replaceAll('CA$', '$');
}

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
    singular: dollarSign(raw.singular),
    plural: dollarSign(raw.plural),
    spaced: raw.spaced,
    as_percentage: 'as_percentage' in raw && raw.as_percentage === true,
  };
}

/** The response's unit; an older API sends none, then the fallback unit stands in. */
export function responseUnit(response: { unit?: Unit | null }): Unit {
  return readUnit(response.unit) ?? strings.fallbackUnit;
}

/**
 * Joins the groups of forms that share one page (a province's main form and
 * its credits worksheet) into one group, so the form is listed once. The
 * joined group keeps the position, form key and page of the first.
 */
function mergeSharedPages(groups: AdvancedGroup[]): AdvancedGroup[] {
  const merged: AdvancedGroup[] = [];
  for (const group of groups) {
    const first =
      group.page === null
        ? undefined
        : merged.find((g) => g.page === group.page);
    if (first) first.lines.push(...group.lines);
    else merged.push({ ...group, lines: [...group.lines] });
  }
  return merged;
}

/** Groups every trace line by form for the advanced view. Same for every jurisdiction. */
export function advancedGroups(
  response: ComputeTakeHomeCalculationResponse,
): AdvancedGroup[] {
  const groups = (response.trace ?? []).flatMap((form) => {
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
          detail: line.text.trim()
            ? dollarSign(line.text)
            : strings.advanced.noDetail,
        },
      ];
    });
    if (lines.length === 0) return [];
    return [
      {
        form: form.form,
        name: form.name.trim() || form.form,
        page: pageOfForm(form.form),
        lines,
      },
    ];
  });
  return mergeSharedPages(groups);
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
