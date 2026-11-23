import type { ProvinceNotes } from '../hubNoteTypes';
import {
  averageRateNotes,
  marginalLowNotes,
  note,
  POOL,
  takeHomeNotes,
  yearTotalNotes,
  type SharedFigures,
} from './shared';

const shared: SharedFigures = { flatFrom: '255000' };

const pool: Record<string, string> = {
  ...POOL,
  skStart: 'e:21000',
  skRate: 'r:marginal@30000',
  skEnd: 'o:55000',
  second: 'r:marginal@56000',
  secondAt: 'e:55000',
  fedRate: 'r:marginal@60000',
};

export const saskatchewan: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(),
  marginalRate: [
    ...marginalLowNotes(),
    note(
      'Saskatchewan’s tax starts at about {skStart}. The rate is {skRate} from {skStart} to {skEnd}.',
      pool,
    ),
    note(
      'It is {second} from {secondAt} (the second bracket) and {fedRate} from {fedBracket} (the federal {fedBracketRate} bracket), then falls as Employment Insurance and the Canada Pension Plan stop: {afterEi} at {eiStop}, {afterCpp} at {cppStop} and {afterCpe} at {cpeStop}.',
      pool,
    ),
    note(
      'After that it climbs to a top rate of {topRate} from {flatFrom}, where the line is straight.',
      { ...pool, flatFrom: `e:${shared.flatFrom}` },
    ),
  ],
  yearTotal: yearTotalNotes(shared),
};
