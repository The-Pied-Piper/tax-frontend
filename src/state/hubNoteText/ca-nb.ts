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

/**
 * The New Brunswick marginal-rate notes (copy thread, CRA-reviewed): the take-home and average-rate notes are the shared
 * ones. Rates are read to one decimal (`h:`), because the wording names the engine's own figure, 32.2% and 29.2%, not
 * the half point. The province has four brackets, all inside the chart, so there is no sentence about higher rates.
 */
const pool: Record<string, string> = {
  ...POOL,
  flatFrom: `e:${shared.flatFrom}`,
  fedOnly: 'h:marginal@22000',
  fedOnlyEnd: 'e:23000',
  n1: 'e:23000',
  n2: 'o:49000',
  inside: 'h:marginal@30000',
  reductionRate: 'p:reduction_rate',
  reductionStart: 'f:reduction_start',
  gone: 'o:49000',
  after: 'h:marginal@50000',
  second: 'h:marginal@53000',
  secondAt: 'e:52000',
  fedRate: 'h:marginal@60000',
  topRate: 'h:marginal@300000',
};

export const newBrunswick: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(),
  marginalRate: [
    ...marginalLowNotes(),
    note(
      'The rate stays {fedOnly} until about {fedOnlyEnd}: it is the pension and insurance payments plus federal tax, because New Brunswick’s low-income tax reduction and credits cover the provincial tax at low incomes.',
      pool,
    ),
    note(
      'From {n1} to {n2} the rate is {inside}, much higher than before. The reduction shrinks by {reductionRate} for every dollar of income above {reductionStart}, but it covers all your provincial tax until {n1}. From then you pay provincial tax and lose the reduction at the same time. It is gone at about {gone}.',
      pool,
    ),
    note(
      'Once the reduction is gone the rate falls to {after} from about {gone}. It steps up to {second} from {secondAt} (the second bracket) and {fedRate} from {fedBracket} (the federal {fedBracketRate} bracket), then down as pension and insurance stop. The top rate in this chart is {topRate}, from {flatFrom}, where the line is straight.',
      pool,
    ),
  ],
};
