import { formPageLink } from './formLinks';
import type { ProvinceSweep } from './hubCharts';
import { isFullSweep, noteWords } from './hubNotes';
import { albertaRatesPage } from './ratesPageText/ca-ab';
import { britishColumbiaRatesPage } from './ratesPageText/ca-bc';
import { manitobaRatesPage } from './ratesPageText/ca-mb';
import { newBrunswickRatesPage } from './ratesPageText/ca-nb';
import { newfoundlandAndLabradorRatesPage } from './ratesPageText/ca-nl';
import { ontarioRatesPage } from './ratesPageText/ca-on';
import { saskatchewanRatesPage } from './ratesPageText/ca-sk';
import { quebecRatesPage } from './ratesPageText/ca-qc';
import type { CauseForm, RatesPageText } from './ratesPageTypes';
import type { Inline } from './contentPages';
import {
  contentPath,
  FOOTER_PROVINCE_SLUGS,
  METHODOLOGY_SLUG,
  type FooterProvinceSlug,
} from './siteLinks';
import { strings } from '../strings';

/** The text of the rates page of each province that has one. Adding a province is one file in `ratesPageText/` and one entry here. */
export const ratesPageText: Partial<Record<FooterProvinceSlug, RatesPageText>> =
  {
    'ca-on': ontarioRatesPage,
    'ca-ab': albertaRatesPage,
    'ca-sk': saskatchewanRatesPage,
    'ca-bc': britishColumbiaRatesPage,
    'ca-mb': manitobaRatesPage,
    'ca-nl': newfoundlandAndLabradorRatesPage,
    'ca-nb': newBrunswickRatesPage,
    'ca-qc': quebecRatesPage,
  };

/** The provinces that have a rates page, in the footer's order. */
export function ratesProvinces(): FooterProvinceSlug[] {
  return FOOTER_PROVINCE_SLUGS.filter(
    (slug) => ratesPageText[slug] !== undefined,
  );
}

/** The form page each cause form is, by the page's id. */
const CAUSE_PAGE: Record<CauseForm, string> = {
  t1: 't1',
  on428: 'on428',
  on428a: 'on428-a',
  ab428: 'ab428',
  sk428: 'sk428',
  bc428: 'bc428',
  mb428: 'mb428',
  mb428a: 'mb428-a',
  nl428: 'nl428',
  nb428: 'nb428',
  t2204: 't2204',
  schedule8: 'schedule-8',
  tp1: 'tp1',
  scheduleU: 'schedule-u',
  scheduleK: 'schedule-k',
  // The work charts are sections of the TP-1 page.
  workChart201: 'tp1',
  workChart401: 'tp1',
};

/** A chip: the form's name, and its page when this build writes one. */
export type CauseChip = { label: string; href?: string };

export function causeChip(form: CauseForm): CauseChip {
  const label = strings.ratesPage.causes[form];
  const href = formPageLink(CAUSE_PAGE[form]);
  return href === null ? { label } : { label, href };
}

/** A rates page's words with every figure filled from the sweep. */
export type RatesView = {
  intro: string[];
  howToRead: string[];
  groups: {
    heading: string;
    /** The anchor of the range: `salary-range-1`. */
    id: string;
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
    groups: text.groups.map((group, at) => ({
      heading: group.heading,
      id: `salary-range-${(at + 1).toString()}`,
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

/**
 * A paragraph of the basis as words and links: the phrase "credits paid to you when you file" links to the
 * Methodology page, which says what those credits are and why they are left out. Any other paragraph is its words.
 */
export function creditsLinked(words: string): Inline[] {
  const phrase = strings.ratesPage.creditsPhrase;
  const at = words.toLowerCase().indexOf(phrase);
  if (at < 0) return [words];
  const end = at + phrase.length;
  return [
    words.slice(0, at),
    {
      label: words.slice(at, end),
      href: contentPath(METHODOLOGY_SLUG),
    },
    words.slice(end),
  ].filter((part) => part !== '');
}
