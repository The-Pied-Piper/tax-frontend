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
  flatFrom: '375000',
  cwbRate: '21 cents',
  cwbStart: '2760',
  cwbMax: '1785',
  cwbTo: '11100',
  levels: ['0.10', '0.20', '0.30', '0.40'],
};

const pool: Record<string, string> = {
  a1: 'e:11100:marginal',
  a2: 'e:19100:marginal',
  low: 'r:marginal@12000',
  fed: 'r:marginal@20000',
  fedStart: 'e:19200:marginal',
  abr: 'r:marginal@25000',
  abStart: 'e:24500:marginal',
  c1: 'e:27000:marginal',
  c2: 'e:38900:marginal',
  cr: 'r:marginal@30000',
  cs: 'd:27000',
  back: 'r:marginal@39000',
  backAt: 'e:39000:marginal',
  r70: 'r:marginal@70000',
  t1: 'r:marginal@60000',
  t1a: 'e:59100:marginal',
  t2: 'r:marginal@62000',
  t2a: 'e:62000:marginal',
  t3: 'r:marginal@160000',
  t4: 'r:marginal@185000',
  t5: 'r:marginal@200000',
  t6: 'r:marginal@250000',
  t7: 'r:marginal@270000',
  t7a: 'e:260000:marginal',
  t8: 'r:marginal@400000',
  t8a: 'e:375000:marginal',
};

export const alberta: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(shared, averageLow.alberta('3000')),
  marginalRate: [
    ...marginalLowNotes(shared),
    note(
      'From about {a1} to {a2} the rate is {low}: only Canada Pension Plan and Employment Insurance. It is {fed} from {fedStart}, when federal tax starts, and about {abr} from {abStart}, when Alberta’s 8% tax starts.',
      pool,
    ),
    note(
      'From {c1} to {c2} the rate is {cr}, because the Canada workers benefit shrinks by 15 cents for every dollar above {cs} (the sweep\u2019s start), on top of 28 cents of Alberta and federal tax. It drops back to {back} at {backAt}, below its level at $70,000 ({r70}).',
      pool,
    ),
    note(
      'Alberta has no tax reduction or premium that bends the line, so there are no spikes. After the pension and insurance steps the rate only climbs: {t1} at {t1a} (the federal 20.5% bracket), {t2} from {t2a}, then {t3}, {t4}, {t5}, {t6}, {t7} from {t7a} and {t8} from {t8a}, where the line goes straight.',
      pool,
    ),
  ],
  yearTotal: yearTotalNotes(shared),
};
