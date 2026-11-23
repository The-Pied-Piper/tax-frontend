import type { ProvinceNotes } from './hubNoteTypes';
import { alberta } from './hubNoteText/ca-ab';
import { britishColumbia } from './hubNoteText/ca-bc';
import { manitoba } from './hubNoteText/ca-mb';
import { newfoundlandAndLabrador } from './hubNoteText/ca-nl';
import { ontario } from './hubNoteText/ca-on';
import { saskatchewan } from './hubNoteText/ca-sk';

/** The text under each hub chart, by province slug. A province with none shows no notes. */
export const hubNoteText: Record<string, ProvinceNotes | undefined> = {
  'ca-on': ontario,
  'ca-ab': alberta,
  'ca-bc': britishColumbia,
  'ca-mb': manitoba,
  'ca-sk': saskatchewan,
  'ca-nl': newfoundlandAndLabrador,
};
