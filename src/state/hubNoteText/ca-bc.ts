import type { ProvinceNotes } from '../hubNoteTypes';
import {
  averageRateNotes,
  marginalLowNotes,
  note,
  POOL,
  straightLineNote,
  takeHomeNotes,
  yearTotalNotes,
  type SharedFigures,
} from './shared';

const shared: SharedFigures = { flatFrom: '265000' };

const pool: Record<string, string> = {
  ...POOL,
  b1: 'e:26000',
  b2: 'o:45000',
  inside: 'r:marginal@30000',
  before: 'r:marginal@20000',
  reductionRate: 't:reduction_rate',
  reductionStart: 'f:reduction_start',
  gone: 'e:45000',
  after: 'r:marginal@46000',
  next: 'r:marginal@51000',
  nextAt: 'e:50000',
  fedRate: 'r:marginal@60000',
};

export const britishColumbia: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(),
  marginalRate: [
    ...marginalLowNotes(),
    note(
      'From {b1} to {b2} the rate is {inside}, higher than the {before} before it. BC tax starts here, and the BC tax reduction, which lowers your BC tax, shrinks by {reductionRate} for every dollar of income above {reductionStart}. So more of each extra dollar goes to BC tax. The reduction is gone at about {gone} of salary.',
      pool,
    ),
    note(
      'Once the reduction is gone, the rate falls to {after}. It is {next} from {nextAt} (the next BC bracket) and {fedRate} from {fedBracket} (the federal {fedBracketRate} bracket).',
      pool,
    ),
    note(
      'Then it falls as Employment Insurance and the Canada Pension Plan stop: {afterEi} at {eiStop}, {afterCpp} at {cppStop} and {afterCpe} at {cpeStop}. After that it climbs to a top rate of {topRate}, where the line is straight.',
      pool,
    ),
    straightLineNote(shared),
  ],
  yearTotal: yearTotalNotes(shared),
};
