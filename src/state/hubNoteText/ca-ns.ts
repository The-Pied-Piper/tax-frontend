import type { ProvinceNotes } from '../hubNoteTypes';
import {
  averageRateNotes,
  marginalLowNotes,
  note,
  POOL,
  takeHomeNotes,
  type SharedFigures,
} from './shared';

const shared: SharedFigures = { flatFrom: '259609' };

const pool: Record<string, string> = {
  ...POOL,
  low: 'h:marginal@10000',
  n1: 'e:15000',
  n2: 'e:21000',
  inside: 'h:marginal@17000',
  insideFed: 'h:marginal@20000',
  fedStart: 'e:19000',
  reductionRate: 't:reduction_rate',
  reductionStart: 'f:reduction_start',
  gone: 'e:21000',
  after: 'h:marginal@25000',
  second: 'h:marginal@32000',
  secondAt: 'e:31000',
  fedRate: 'h:marginal@60000',
};

export const novaScotia: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(),
  marginalRate: [
    ...marginalLowNotes([
      note(
        'The rate is {low} (pension and insurance payments only) until about {n1}, because Nova Scotia’s low-income tax reduction and credits cover the provincial tax at low incomes.',
        pool,
      ),
    ]),
    note(
      'From {n1} to about {n2} the rate is higher. Provincial tax starts while the reduction is still shrinking ({reductionRate} off it for every dollar of income above {reductionStart}). The rate is {inside} from {n1}, and {insideFed} once federal tax starts at {fedStart}. The reduction is gone at about {gone}.',
      pool,
    ),
    note(
      'Once the reduction is gone the rate falls to {after} from {gone}. It steps up to {second} from {secondAt} (the second bracket) and {fedRate} from {fedBracket} (the federal {fedBracketRate} bracket), then down as pension and insurance stop. The top rate in this chart is {topRate}, from {flatFrom}, where the line is straight.',
      { ...pool, flatFrom: `e:${shared.flatFrom}` },
    ),
  ],
};
