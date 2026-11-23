import type { ProvinceNotes } from '../hubNotes';
import { alberta } from './ca-ab';
import { britishColumbia } from './ca-bc';
import { manitoba } from './ca-mb';
import { newfoundlandAndLabrador } from './ca-nl';
import { ontario } from './ca-on';
import { saskatchewan } from './ca-sk';

/** The text under each hub chart, by province slug. A province with none shows no notes. */
export const hubNoteText: Record<string, ProvinceNotes | undefined> = {
  'ca-on': ontario,
  'ca-ab': alberta,
  'ca-bc': britishColumbia,
  'ca-mb': manitoba,
  'ca-sk': saskatchewan,
  'ca-nl': newfoundlandAndLabrador,
};
