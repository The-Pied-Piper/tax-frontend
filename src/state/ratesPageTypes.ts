import type { Note } from './hubNoteTypes';

/** The forms a rates page note can name as its cause; each is the id of a form page. */
export type CauseForm =
  | 't1'
  | 'on428'
  | 'on428a'
  | 'ab428'
  | 'mb428'
  | 'mb428a'
  | 'nl428'
  | 't2204'
  | 'schedule8'
  | 'tp1'
  | 'scheduleU'
  | 'scheduleK'
  | 'workChart201'
  | 'workChart401';

/** One note of a rates page: its words with `{name}` where a figure goes, its figures by spec (see `hubNotes.ts`), and the forms that cause what it describes. */
export type RatesNote = Note & { forms: CauseForm[] };

/** The notes for one range of salary, under one heading. */
export type RatesGroup = { heading: string; notes: RatesNote[] };

/** A table of the page: a heading, the words before and after it, and cells that are words with `{name}` figures. */
export type RatesTable = {
  heading: string;
  before?: Note;
  caption: string;
  head: string[];
  /** Each cell is a bullet's words; the figures of the whole table are in `figures`. */
  rows: string[][];
  figures: Record<string, string>;
  after?: Note;
};

/** Everything one province's rates page says. Every figure is a spec resolved from the province's sweep, never typed. */
export type RatesPageText = {
  /** The tab title and share title; under 64 characters, so a long name shortens here and keeps its full form in `heading`. */
  title: string;
  description: string;
  /** The h1. */
  heading: string;
  /** The opening finding, the basis and the note that 2026 is provisional, each one paragraph. */
  intro: Note[];
  howToRead: Note[];
  groups: RatesGroup[];
  /** A sub-heading and its parts for each table section: brackets, surtax, premium, limits. */
  tables: RatesTable[];
};
