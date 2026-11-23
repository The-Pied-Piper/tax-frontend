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
  low: 'r:marginal@12000',
  fed: 'r:marginal@20000',
  fedStart: 'e:19200:marginal',
  sk: 'r:marginal@22000',
  skStart: 'e:21900:marginal',
  c1: 'e:27700:marginal',
  c2: 'e:38800:marginal',
  cr: 'r:marginal@30000',
  r70: 'r:marginal@70000',
  back: 'r:marginal@39000',
  backAt: 'e:39000:marginal',
  b1: 'r:marginal@56000',
  b1a: 'e:55100:marginal',
  b2: 'r:marginal@60000',
  b2a: 'e:59100:marginal',
  top: 'r:marginal@300000',
  topFrom: 'e:260000:marginal',
};

export const saskatchewan: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(shared, averageLow.standard('3200')),
  marginalRate: [
    ...marginalLowNotes(shared),
    note(
      'From about {a1} to {a2} the rate is {low}: only Canada Pension Plan and Employment Insurance. It is {fed} from {fedStart}, when federal tax starts, and {sk} from {skStart}, when Saskatchewan’s tax starts.',
      pool,
    ),
    note(
      'From {c1} to {c2} the rate is {cr}, higher than at $70,000 ({r70}). The Canada workers benefit shrinks by 15 cents for every dollar above {c1}. It falls back to {back} at {backAt}.',
      pool,
    ),
    note(
      'It is {b1} from {b1a} (the second bracket) and {b2} at {b2a} (the federal 20.5% bracket). After the pension and insurance steps it climbs to a top rate of {top} from {topFrom}.',
      pool,
    ),
  ],
  yearTotal: yearTotalNotes(shared),
};
