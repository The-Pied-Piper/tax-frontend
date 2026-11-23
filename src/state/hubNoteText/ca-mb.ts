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
  flatFrom: '405000',
  cwbRate: '27 cents',
  cwbStart: '3000',
  cwbMax: '1700',
  cwbTo: '9000',
  levels: ['0.10', '0.20', '0.30', '0.40'],
};

const pool: Record<string, string> = {
  m1: 'e:17500:marginal',
  m2: 'r:marginal@18000',
  fed: 'r:marginal@20000',
  fedStart: 'e:19200:marginal',
  c1: 'e:27700:marginal',
  c2: 'e:38800:marginal',
  cr: 'r:marginal@30000',
  r70: 'r:marginal@70000',
  back: 'r:marginal@39000',
  backAt: 'e:39000:marginal',
  u1: 'r:marginal@60000',
  u1a: 'e:59100:marginal',
  u2: 'r:marginal@69000',
  u2a: 'e:69000:marginal',
  u3: 'r:marginal@75000',
  u3a: 'e:75000:marginal',
  u4: 'r:marginal@85000',
  u4a: 'e:85000:marginal',
  v1: 'e:201200:marginal',
  v2: 'r:marginal@201200',
  v3: 'r:marginal@300000',
  v4: 'e:260000:marginal',
  v5: 'e:400000:marginal',
  v6: 'e:405000:marginal',
};

export const manitoba: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(
    shared,
    averageLow.credit('Manitoba personal tax credit'),
  ),
  marginalRate: [
    ...marginalLowNotes(shared, true, 'c:marginal@12000'),
    note(
      'Manitoba’s own tax starts before the federal tax does. From {m1} the rate is {m2}: Manitoba tax, Canada Pension Plan and Employment Insurance, and 1 cent more for every dollar, because the Manitoba personal tax credit, which is paid when you file, shrinks by 1 cent for every dollar of income. It is {fed} from {fedStart}, once federal tax joins in.',
      pool,
    ),
    note(
      'From {c1} to {c2} the rate is {cr}, higher than at $70,000 ({r70}). The Canada workers benefit shrinks by 15 cents for every dollar above {c1}. It falls back to {back} at {backAt}.',
      pool,
    ),
    note(
      'It steps up to {u1} at {u1a} (the federal 20.5% bracket), then falls as Employment Insurance and the Canada Pension Plan stop: {u2} at {u2a}, {u3} at {u3a} and {u4} at {u4a}.',
      pool,
    ),
    note(
      'At {v1} of salary it steps up about 1 point to {v2}, and it reaches {v3} from {v4} to {v5}. Then it drops about 1 point from {v6}, where the line goes straight. The cause is the Manitoba basic personal amount. It shrinks to zero as net income goes from $200,000 to $400,000, so you lose a little of the credit on each extra dollar.',
      pool,
    ),
  ],
  yearTotal: yearTotalNotes(shared),
};
