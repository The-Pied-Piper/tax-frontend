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

const shared: SharedFigures = { flatFrom: '285000' };

const pool: Record<string, string> = {
  ...POOL,
  fedOnly: 'r:marginal@22000',
  fedOnlyEnd: 'o:25000',
  n1: 'e:25000',
  n2: 'o:30000',
  inside: 'r:marginal@28000',
  reductionRate: 't:reduction_rate',
  reductionStart: 'f:reduction_start',
  gone: 'e:30000',
  after: 'r:marginal@31000',
  second: 'r:marginal@46000',
  secondAt: 'e:45000',
  fedRate: 'r:marginal@60000',
  higher: 'd:564000',
};

export const newfoundlandAndLabrador: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(),
  marginalRate: [
    ...marginalLowNotes(),
    note(
      'The rate stays {fedOnly} (federal tax only) until about {fedOnlyEnd}, because Newfoundland and Labrador’s low-income tax reduction removes the provincial tax at low incomes.',
      pool,
    ),
    note(
      'From {n1} to {n2} the rate is {inside}, much higher than before. The reduction shrinks by {reductionRate} for every dollar of income above {reductionStart}, so you start paying the provincial tax and lose the reduction at the same time. It is gone at about {gone}.',
      pool,
    ),
    note(
      'Once the reduction is gone the rate falls to {after} from {gone}. It steps up to {second} from {secondAt} (the second bracket) and {fedRate} from {fedBracket} (the federal {fedBracketRate} bracket), then down as pension and insurance stop. The top rate in this chart is {topRate}, from {flatFrom}, where the line is straight. The form adds higher rates above about {higher}.',
      { ...pool, flatFrom: `e:${shared.flatFrom}` },
    ),
  ],
  yearTotal: yearTotalNotes(shared),
};
