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

const shared: SharedFigures = { flatFrom: '255000' };

const pool: Record<string, string> = {
  ...POOL,
  // The Ontario Health Premium: its band of salary, the rates either side, and the amounts the form prints.
  h1: 'e:20170',
  h2: 'o:25220',
  inside: 'r:marginal@21000',
  after: 'r:marginal@26000',
  six: 'l:6 cents',
  most: 'd:300',
  // LIFT: the salary the rate reaches 30%, where it falls back, and the threshold of the dataset.
  c1: 'e:32800',
  c2: 'o:38000',
  atLeast: 'r:marginal@33000',
  before: 'r:marginal@26000',
  lift: 'f:lift_threshold',
  liftRate: 'l:5 cents',
  prem1: 'd:36000',
  prem2: 'd:38500',
  premRate: 'r:marginal@37000',
  liftEnd: 'e:50000',
  liftAfter: 'r:marginal@51000',
  // The three short spikes: the rate at each, and where it starts and ends.
  p1: 'y:48450',
  p1a: 'e:48450',
  p1b: 'o:49000',
  p2: 'y:72700',
  p2a: 'e:72700',
  p2b: 'o:73000',
  p3: 'y:201130',
  p3a: 'e:201130',
  p3b: 'o:201700',
  band: 'd:600',
  grows: 'l:25 cents',
  p1all: 'd:150',
  // The surtax: thresholds and rates from the engine's 2026 dataset, and the rate once each applies.
  surtax1: 'f:surtax_first',
  surtax2: 'f:surtax_second',
  surtaxRate1: 't:surtax_first_rate',
  surtaxRate2: 't:surtax_second_rate',
  s1: 'r:marginal@99000',
  s1a: 'e:98000',
  s2: 'r:marginal@116000',
  s2a: 'e:115000',
};

export const ontario: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(),
  marginalRate: [
    ...marginalLowNotes(),
    note(
      'From {h1} to {h2} of salary the Ontario Health Premium adds {six} for every dollar, up to {most} in all. The rate is {inside}, then {after} again.',
      pool,
    ),
    note(
      'From {c1} to {c2} the rate is {atLeast} or more, higher than the {before} before it. The Ontario Low-income Individuals and Families Tax (LIFT) Credit lowers your Ontario tax. It shrinks by {liftRate} for every dollar above {lift}, so more of each extra dollar goes to Ontario tax.',
      pool,
    ),
    note(
      'From {prem1} to {prem2} of taxable income the Ontario Health Premium adds {six} more, lifting the rate to {premRate}. LIFT keeps shrinking until about {liftEnd}, and the rate falls to {liftAfter} once it is gone.',
      pool,
    ),
    note(
      'Three short spikes push the rate above the top rate of {topRate}: {p1} from {p1a} to {p1b}, {p2} from {p2a} to {p2b}, and {p3} from {p3a} to {p3b} of salary. Each one is a step in the Ontario Health Premium. Across a band about {band} wide, the premium grows by {grows} for every extra dollar, adding {p1all} in all. The rate falls back as soon as the band ends.',
      pool,
    ),
    note(
      'Ontario’s surtax raises the rate twice. A surtax is an extra tax on top of your Ontario tax, charged once that tax passes a set amount. It adds {surtaxRate1} for every dollar of Ontario tax above {surtax1}, and another {surtaxRate2} above {surtax2}. The rate rises to {s1} at {s1a}, and to {s2} at {s2a}.',
      pool,
    ),
    straightLineNote(shared),
  ],
  yearTotal: yearTotalNotes(shared),
};
