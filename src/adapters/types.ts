import type { ComputeTakeHomeCalculationResponse, Unit } from '../api';

/** Money is always text, exactly as the API sent it. */
export type Amount = string;

export type { Unit };

/** One line of the simple breakdown: a name, its help text and an amount. */
export interface DisplayRow {
  /** Stable key within one result. */
  id: string;
  name: string;
  /** Explanation shown in the "?" bubble. */
  help: string;
  amount: Amount;
  /** The unit the API sent for the amount; null for a bare number. */
  unit: Unit | null;
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
  /** The unit the API sent for this line; null for a bare number. */
  unit: Unit | null;
  /** The API's explanation of how the figure was worked out, as sent. */
  detail: string;
  /** True when the API gave the line its own name; false when the label is "Line N". */
  named: boolean;
}

/** All lines of the forms that share one title, in the order the API returned them. */
export interface AdvancedGroup {
  /** Form identifier, as the API sent it. */
  form: string;
  /** The API's title of the form; parts with the same title are one group. */
  name: string;
  /** The id of the form's page, or null for a form with no page. */
  page: string | null;
  lines: AdvancedLine[];
}

/** Sentences a jurisdiction words itself where the shared ones name the Canada Pension Plan. */
export interface Wording {
  /** Help text of the three answer-card rows; the row names stay shared. */
  answer: { takenOff: string; averageRate: string; marginalRate: string };
  pageText: {
    description(
      salary: string,
      place: string,
      year: number,
      takeHome: string,
    ): string;
    paragraph(
      salary: string,
      place: string,
      year: number,
      takeHome: string,
      takenOff: string,
      averageRate: string,
      marginalRate: string,
    ): string;
  };
}

/** What the page shows for one calculation. */
export interface AdaptedResult {
  /** The response's top-level unit, for salary, deductions and take-home. */
  unit: Unit;
  /** Simple breakdown rows, in display order. */
  rows: DisplayRow[];
  /** Summary rows shown after `rows` (for example the total taken off). */
  totals: DisplayRow[];
  /** Every trace line, grouped by form. */
  advanced: AdvancedGroup[];
  /** The jurisdiction's own sentences; left out, the shared wording is used. */
  wording?: Wording;
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
