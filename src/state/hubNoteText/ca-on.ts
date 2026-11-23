import type { ProvinceNotes } from '../hubNoteTypes';
import {
  averageLow,
  averageRateNotes,
  marginalLowNotes,
  note,
  takeHomeNotes,
  yearTotalNotes,
  type SharedFigures,
} from './shared';

const shared: SharedFigures = {
  flatFrom: '260000',
  cwbRate: '27 cents',
  cwbStart: '3000',
  cwbMax: '1700',
  cwbTo: '9000',
  levels: ['0.10', '0.20', '0.30', '0.40'],
};

const pool: Record<string, string> = {
  a1: 'e:9100:marginal',
  a2: 'e:19100:marginal',
  lowRate: 'r:marginal@12000',
  fedRate: 'r:marginal@20000',
  fedStart: 'e:19200:marginal',
  h1: 'e:20700:marginal',
  h2: 'e:25700:marginal',
  c1: 'e:27700:marginal',
  c2: 'e:38800:marginal',
  r70: 'r:marginal@70000',
  r28: 'r:marginal@28000',
  r33: 'r:marginal@33000',
  r37: 'r:marginal@37000',
  r40: 'r:marginal@40000',
  topRate: 'r:marginal@300000',
  p1: 'r:marginal@49000',
  p1a: 'e:48450:marginal',
  p1b: 'e:49050:marginal',
  p2: 'r:marginal@73000',
  p2a: 'e:72700:marginal',
  p2b: 'e:73290:marginal',
  p3: 'r:marginal@201200',
  p3a: 'e:201130:marginal',
  p3b: 'e:201720:marginal',
  s1: 'r:marginal@99000',
  s1a: 'e:99000:marginal',
  s2: 'r:marginal@116000',
  s2a: 'e:116000:marginal',
  flat: 'd:260000',
  lift: 'd:32500',
  prem1: 'd:36000',
  prem2: 'd:38500',
  liftEnd: 'd:50000',
  surtax1: 'd:5710',
  surtax2: 'd:7307',
  p1all: 'd:150',
  band: 'd:600',
};

export const ontario: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(shared, averageLow.standard('3200')),
  marginalRate: [
    ...marginalLowNotes(shared),
    note(
      'From about {a1} to {a2} the rate is {lowRate}: no income tax yet, only Canada Pension Plan and Employment Insurance. It is {fedRate} from {fedStart}, when federal income tax starts.',
      pool,
    ),
    note(
      'From about {h1} to {h2} of salary the Ontario Health Premium adds 6 cents for every dollar, up to $300 in all.',
      pool,
    ),
    note(
      'Between {c1} and {c2} of salary the rate is higher than at $70,000 ({r70}). It climbs to {r28} at $28,000, {r33} at $33,000 and {r37} from $36,400, then drops to {r40}. Three things cause this. The Canada workers benefit, which is paid when you file, shrinks by 15 cents for every dollar you earn above {c1}, and is gone by {c2}. The Ontario Low-income Individuals and Families Tax (LIFT) Credit lowers your Ontario tax. It shrinks by 5 cents for every dollar above {lift}, so more of each extra dollar goes to Ontario tax. The Ontario Health Premium adds 6 cents for every dollar from {prem1} to {prem2} of taxable income. The rate drops when the benefit and the premium step end. LIFT keeps shrinking until {liftEnd}.',
      pool,
    ),
    note(
      'Three short spikes push the rate above the top rate of {topRate}: {p1} from {p1a} to {p1b}, {p2} from {p2a} to {p2b}, and {p3} from {p3a} to {p3b} of salary. Each one is a step in the Ontario Health Premium. Across a band about {band} wide, the premium grows by 25 cents for every extra dollar, adding {p1all} in all. The rate falls back as soon as the band ends.',
      pool,
    ),
    note(
      'Ontario’s surtax raises the rate twice. A surtax is an extra tax on top of your Ontario tax, charged once that tax passes a set amount. It adds 20 cents for every dollar of Ontario tax above {surtax1}, and another 36 cents above {surtax2}. The rate rises to {s1} at {s1a}, and to {s2} at {s2a}.',
      pool,
    ),
    note(
      'Above the straight-line start ({flat} in Ontario) the rate stops rising. Every extra dollar is taxed at {topRate}, so the line is straight.',
      pool,
    ),
  ],
  yearTotal: yearTotalNotes(shared),
};
