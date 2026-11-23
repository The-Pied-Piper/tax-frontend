import type { HubChartId } from './hubCharts';

/** A figure's spec: see `hubNotes.ts` for the kinds. */
export type FigureSpec = string;

/** One bullet: its words, with `{name}` where a figure goes, and the figures by name. */
export type Note = { text: string; figures?: Record<string, FigureSpec> };

/** The bullets of each chart of one province. The after-credits chart is not drawn, so it has none. */
export type ProvinceNotes = Partial<Record<HubChartId, Note[]>>;
