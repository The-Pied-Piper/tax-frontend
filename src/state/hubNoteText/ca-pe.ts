import type { ProvinceNotes } from '../hubNoteTypes';
import {
  averageRateNotes,
  marginalLowNotes,
  note,
  POOL,
  takeHomeNotes,
  type SharedFigures,
} from './shared';

const shared: SharedFigures = { flatFrom: '255000' };

const pool: Record<string, string> = {
  ...POOL,
  fedOnly: 'h:marginal@19500',
  fedOnlyEnd: 'e:19992',
  n1: 'e:19992',
  first: 'h:marginal@21000',
  reductionStart: 'f:reduction_start',
  n2: 'e:22844',
  n3: 'e:29915',
  inside: 'h:marginal@25000',
  after: 'h:marginal@31000',
  second: 'h:marginal@35000',
  secondAt: 'e:34236',
  fedRate: 'h:marginal@60000',
};

export const princeEdwardIsland: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(),
  marginalRate: [
    ...marginalLowNotes([
      note(
        'From $4,000 to about {fedStart} the rate is {low}: Canada Pension Plan and Employment Insurance, with no income tax yet. It is {fedOnly} from {fedStart}, when federal income tax starts.',
        pool,
      ),
    ]),
    note(
      'The rate stays {fedOnly} until about {fedOnlyEnd}: it is the pension and insurance payments plus federal tax, because Prince Edward Island’s credits and low-income tax reduction cover the provincial tax at low incomes.',
      pool,
    ),
    note(
      'From {n1} the rate is {first}, as provincial tax starts. The reduction starts to shrink at an income of {reductionStart}, so from {n2} to about {n3} the rate is {inside}, because you also lose the reduction. It is gone at about {n3}, and the rate falls back to {after}.',
      pool,
    ),
    note(
      'It steps up to {second} from {secondAt} (the second bracket) and {fedRate} from {fedBracket} (the federal {fedBracketRate} bracket), then down as pension and insurance stop. The top rate in this chart is {topRate}, from {flatFrom}, where the line is straight.',
      { ...pool, flatFrom: `e:${shared.flatFrom}` },
    ),
  ],
};
