import type { ProvinceNotes } from '../hubNotes';
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
  flatFrom: '270000',
  cwbRate: '27 cents',
  cwbStart: '3000',
  cwbMax: '1700',
  cwbTo: '9000',
  levels: ['0.10', '0.20', '0.30', '0.40'],
};

const pool: Record<string, string> = {
  a1: 'e:9100:marginal',
  a2: 'e:19100:marginal',
  lo: 'r:marginal@12000',
  hi: 'r:marginal@17000',
  b1: 'e:15200:marginal',
  b2: 'e:18800:marginal',
  b3: 'd:15000',
  fed: 'r:marginal@20000',
  fedStart: 'e:19200:marginal',
  red: 'd:25020',
  r1: 'r:marginal@27000',
  r1a: 'e:26800:marginal',
  c1: 'e:27700:marginal',
  c2: 'e:38800:marginal',
  cr: 'r:marginal@30000',
  r70: 'r:marginal@70000',
  again: 'r:marginal@40000',
  againAt: 'e:38900:marginal',
  redEnd: 'e:45300:marginal',
  dip: 'r:marginal@46000',
  dipAt: 'e:45400:marginal',
  s1: 'r:marginal@60000',
  s1a: 'e:59100:marginal',
  top: 'r:marginal@300000',
  topFrom: 'e:270000:marginal',
  step: 'r:marginal@51000',
};

export const britishColumbia: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(
    shared,
    averageLow.credit('BC sales tax credit'),
  ),
  marginalRate: [
    ...marginalLowNotes(shared, true),
    note(
      'From about {a1} to {a2} the rate is {lo} to {hi}: Canada Pension Plan and Employment Insurance, plus 2 cents more for every dollar from {b1} to {b2}, because the BC sales tax credit, which is paid when you file, shrinks by 2 cents for every dollar above {b3}. It is {fed} from {fedStart}, when federal tax starts.',
      pool,
    ),
    note(
      'The BC tax reduction shrinks by 3.56 cents for every dollar of net income above {red}, which lifts the rate to {r1} from {r1a}. From {c1} to {c2} the rate is {cr}, higher than at $70,000 ({r70}), because the Canada workers benefit shrinks too. It is {again} again from {againAt}, until the reduction is gone at about {redEnd} of salary.',
      pool,
    ),
    note(
      'The rate dips to {dip} at {dipAt}, then climbs: {s1} at {s1a}, and the top rate of {top} from {topFrom}, where the line goes straight. Steps through {step} come a step later than in the other provinces.',
      pool,
    ),
  ],
  yearTotal: yearTotalNotes(shared),
};
