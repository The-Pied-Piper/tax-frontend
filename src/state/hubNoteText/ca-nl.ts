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
  flatFrom: '290000',
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
  fed: 'r:marginal@22000',
  until: 'e:25000:marginal',
  fade: 'd:25000',
  c1: 'e:27700:marginal',
  n1: 'r:marginal@26000',
  n1a: 'e:25100:marginal',
  n2: 'r:marginal@28000',
  n2b: 'e:30700:marginal',
  top: 'r:marginal@300000',
  n3: 'r:marginal@32000',
  n3a: 'e:30800:marginal',
  n4: 'r:marginal@39000',
  n4a: 'e:38900:marginal',
  o1: 'r:marginal@46000',
  o1a: 'e:45100:marginal',
  o2: 'r:marginal@60000',
  o2a: 'e:59100:marginal',
  topFrom: 'e:290000:marginal',
  more: 'd:564000',
};

export const newfoundlandAndLabrador: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(shared, averageLow.standard('3200')),
  marginalRate: [
    ...marginalLowNotes(shared),
    note(
      'From about {a1} to {a2} the rate is {low}: only Canada Pension Plan and Employment Insurance. It stays {fed} (federal tax only) until {until}, because Newfoundland and Labrador’s low-income tax reduction removes the provincial tax at low incomes.',
      pool,
    ),
    note(
      'The reduction fades out above about {fade}, and the Canada workers benefit shrinks by 15 cents for every dollar above {c1}. The rate is {n1} from {n1a}, and {n2} from {c1} to {n2b}, higher than the top rate of {top}. It eases to {n3} from {n3a}, and falls to {n4} at {n4a} once both are gone.',
      pool,
    ),
    note(
      'It steps up to {o1} from {o1a} (the second bracket) and {o2} from {o2a} (the federal 20.5% bracket), then down as pension and insurance stop. The top rate in this chart is {top}, from {topFrom}, where the line goes straight. The form adds higher rates above about {more}.',
      pool,
    ),
  ],
  yearTotal: yearTotalNotes(shared),
};
