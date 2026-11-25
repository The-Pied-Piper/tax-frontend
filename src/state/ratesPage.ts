import { formPages } from './formPages';
import { sweepSalaries, type ProvinceSweep } from './hubCharts';
import { noteWords } from './hubNotes';
import { ontarioRatesPage } from './ratesPageText/ca-on';
import type { CauseForm, RatesPageText } from './ratesPageTypes';
import { compareAmounts } from '../money/scale';
import { formSlug, type FooterProvinceSlug } from './siteLinks';
import { contentPath } from './siteLinks';

/** The last segment of every rates page address, below the province's hub: `/ca-on/tax-rates/`. No year, so links last across years. */
export const RATES_SEGMENT = 'tax-rates';

/** The slug of a province's rates page. */
export function ratesSlug(province: FooterProvinceSlug): string {
  return `${province}/${RATES_SEGMENT}`;
}

/** The text of the rates page of each province that has one. Adding a province is one file in `ratesPageText/` and one entry here. */
export const ratesPageText: Partial<Record<FooterProvinceSlug, RatesPageText>> =
  {
    'ca-on': ontarioRatesPage,
  };

/** The provinces that have a rates page, in the footer's order. */
export function ratesProvinces(): FooterProvinceSlug[] {
  return (Object.keys(ratesPageText) as FooterProvinceSlug[]).filter(
    (slug) => ratesPageText[slug] !== undefined,
  );
}

/** What a cause form is called on a chip, and the form page it is. */
const CAUSE: Record<CauseForm, { label: string; id: string }> = {
  t1: { label: 'Form T1', id: 't1' },
  on428: { label: 'Form ON428', id: 'on428' },
  on428a: { label: 'Schedule ON428-A', id: 'on428a' },
  t2204: { label: 'Form T2204', id: 't2204' },
  schedule8: { label: 'Schedule 8', id: 'schedule8' },
};

/** A chip: the form's name, and its page when this site has one. */
export type CauseChip = { label: string; href?: string };

export function causeChip(form: CauseForm): CauseChip {
  const { label, id } = CAUSE[form];
  return formPages.some((page) => page.id === id)
    ? { label, href: contentPath(formSlug(id)) }
    : { label };
}

/** A rates page's words with every figure filled from the sweep. */
export type RatesView = {
  intro: string[];
  howToRead: string[];
  groups: {
    heading: string;
    notes: { words: string; causes: CauseChip[] }[];
  }[];
  tables: {
    heading: string;
    before?: string;
    caption: string;
    head: string[];
    rows: string[][];
    after?: string;
  }[];
};

/** True when the sweep holds every salary the figures are read at; the build refuses any other. */
function isFullSweep(sweep: ProvinceSweep): boolean {
  const expected = sweepSalaries();
  return (
    sweep.points.length === expected.length &&
    sweep.points.every(
      (point, at) => compareAmounts(point[0], expected[at] ?? '') === 0,
    )
  );
}

function cellWords(
  cell: string,
  figures: Record<string, string>,
  sweep: ProvinceSweep,
): string {
  const used: Record<string, string> = {};
  for (const match of cell.matchAll(/\{([a-zA-Z0-9]+)\}/g)) {
    const name = match[1] ?? '';
    const spec = figures[name];
    if (spec !== undefined) used[name] = spec;
  }
  return noteWords({ text: cell, figures: used }, sweep);
}

/** The words of a province's rates page, or null when it has none or the sweep is not the full one. */
export function ratesPageView(
  province: FooterProvinceSlug,
  sweep: ProvinceSweep,
): RatesView | null {
  const text = ratesPageText[province];
  if (!text || !isFullSweep(sweep)) return null;
  return {
    intro: text.intro.map((note) => noteWords(note, sweep)),
    howToRead: text.howToRead.map((note) => noteWords(note, sweep)),
    groups: text.groups.map((group) => ({
      heading: group.heading,
      notes: group.notes.map((note) => ({
        words: noteWords(note, sweep),
        causes: note.forms.map(causeChip),
      })),
    })),
    tables: text.tables.map((table) => ({
      heading: table.heading,
      before: table.before && noteWords(table.before, sweep),
      caption: table.caption,
      head: table.head,
      rows: table.rows.map((row) =>
        row.map((cell) => cellWords(cell, table.figures, sweep)),
      ),
      after: table.after && noteWords(table.after, sweep),
    })),
  };
}
