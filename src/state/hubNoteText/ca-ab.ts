import type { ProvinceNotes } from '../hubNoteTypes';
import {
  averageRateNotes,
  marginalLowNotes,
  note,
  POOL,
  takeHomeNotes,
  type SharedFigures,
} from './shared';

const shared: SharedFigures = { flatFrom: '370000' };

const pool: Record<string, string> = {
  ...POOL,
  abStart: 'e:24000',
  abRate: 'l:8%',
  abMid: 'r:marginal@30000',
  abMidEnd: 'o:59000',
  t1: 'r:marginal@60000',
  t2: 'r:marginal@62000',
  t2a: 'e:61800',
  tenRate: 'l:10%',
  t3: 'r:marginal@119000',
  t3a: 'e:118000',
  t4: 'r:marginal@156000',
  t5: 'r:marginal@183000',
  t6: 'r:marginal@187000',
  t7: 'r:marginal@248000',
  t8: 'r:marginal@260000',
  t8a: 'e:255000',
  t9: 'r:marginal@375000',
  t9a: 'e:370000',
};

export const alberta: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(),
  marginalRate: [
    ...marginalLowNotes(),
    note(
      'Alberta’s {abRate} tax starts at about {abStart}. The rate is {abMid} from {abStart} to {abMidEnd}. Alberta has no tax reduction or premium that bends the line, so there are no spikes.',
      pool,
    ),
    note(
      'It steps up to {t1} at {fedBracket} (the federal {fedBracketRate} bracket). From there it falls as Employment Insurance and the Canada Pension Plan stop. It reaches {t2} from {t2a} (Alberta’s {tenRate} bracket), then {afterEi} at {eiStop}, {afterCpp} at {cppStop} and {afterCpe} at {cpeStop}.',
      pool,
    ),
    note(
      'After that it only climbs: {t3} from {t3a}, then {t4}, {t5}, {t6}, {t7}, {t8} from {t8a}, and {t9} from {t9a}, where the line is straight.',
      pool,
    ),
  ],
};
