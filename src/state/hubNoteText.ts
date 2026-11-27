import type { FooterProvinceSlug } from './siteLinks';
import type { ProvinceNotes } from './hubNoteTypes';
import { alberta } from './hubNoteText/ca-ab';
import { britishColumbia } from './hubNoteText/ca-bc';
import { manitoba } from './hubNoteText/ca-mb';
import { newfoundlandAndLabrador } from './hubNoteText/ca-nl';
import { novaScotia } from './hubNoteText/ca-ns';
import { ontario } from './hubNoteText/ca-on';
import { quebec } from './hubNoteText/ca-qc';
import { saskatchewan } from './hubNoteText/ca-sk';

/** The text under each hub chart, by province slug. A province with none shows no notes. */
export const hubNoteText: Partial<Record<FooterProvinceSlug, ProvinceNotes>> = {
  'ca-on': ontario,
  'ca-ab': alberta,
  'ca-bc': britishColumbia,
  'ca-mb': manitoba,
  'ca-sk': saskatchewan,
  'ca-nl': newfoundlandAndLabrador,
  'ca-ns': novaScotia,
  'ca-qc': quebec,
};
