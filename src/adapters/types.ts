import type { ComputeTakeHomeCalculationResponse } from '../api';

/** Money is always text, exactly as the API sent it. */
export type Amount = string;

/** One line of the simple breakdown: a name, its help text and an amount. */
export interface DisplayRow {
  /** Stable key within one result. */
  id: string;
  name: string;
  /** Explanation shown in the "?" bubble. */
  help: string;
  amount: Amount;
  /** Heading the row is listed under (for example "Pension"). Rows without one are listed last, unheaded. */
  group?: string;
}

/** One line of the advanced view, as the engine returned it. */
export interface AdvancedLine {
  /** The API's display name when it has one, otherwise a readable label. */
  label: string;
  /** What the form prints beside the figure; null for a step the form does not print. */
  reference: string | null;
  amount: Amount | null;
  /** The API's explanation of how the figure was worked out, as sent; null when it sent none. */
  detail: string | null;
}

/** All lines of one form, in the order the API returned them. */
export interface AdvancedGroup {
  /** Form identifier, as the API sent it. */
  form: string;
  /** The API's display name of the form. */
  name: string;
  lines: AdvancedLine[];
}

/** What the page shows for one calculation. */
export interface AdaptedResult {
  /** Simple breakdown rows, in display order. */
  rows: DisplayRow[];
  /** Summary rows shown after `rows` (for example the total taken off). */
  totals: DisplayRow[];
  /** Every trace line, grouped by form. */
  advanced: AdvancedGroup[];
}

/** Turns one jurisdiction's API response into display rows. */
export interface JurisdictionAdapter {
  /** The `jurisdiction_code` this adapter handles. */
  jurisdictionCode: string;
  /**
   * Years this adapter handles. Leave out when the same labels apply to every
   * year; set it when labels change between years.
   */
  years?: readonly number[];
  adapt(response: ComputeTakeHomeCalculationResponse): AdaptedResult;
}
