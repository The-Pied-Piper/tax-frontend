import type { ProvinceNotes } from '../hubNoteTypes';
import {
  averageRateNotes,
  marginalLowNotes,
  note,
  POOL,
  takeHomeNotes,
  type SharedFigures,
} from './shared';

const shared: SharedFigures = { flatFrom: '400000' };

const pool: Record<string, string> = {
  ...POOL,
  mbStart: 'e:17000',
  mbRate: 'r:marginal@18000',
  fedJoins: 'e:19000',
  withFed: 'r:marginal@20000',
  afterBenefit: 'r:marginal@24000',
  benefitGone: 'e:23000',
  benefitRate: 't:benefit_rate',
  next: 'r:marginal@48000',
  nextAt: 'e:47000',
  fedRate: 'r:marginal@60000',
  v1: 'e:201100',
  v2: 'r:marginal@210000',
  v3: 'y:255000',
  v4: 'e:255000',
  v5: 'o:400000',
  v6: 'y:400000',
  bpa1: 'd:200000',
  bpa2: 'd:400000',
  flatAt: 'e:400000',
};

export const manitoba: ProvinceNotes = {
  takeHome: takeHomeNotes(shared),
  averageRate: averageRateNotes(
    [
      note(
        'Up to about {mbStart} you pay no income tax, only Canada Pension Plan and Employment Insurance. The average is {avg10} at $10,000.',
        pool,
      ),
    ],
    [
      note(
        'Manitoba’s own tax starts before federal tax does, so the average is {avg20} at $20,000, more than in provinces whose own tax starts later.',
        pool,
      ),
    ],
  ),
  marginalRate: [
    ...marginalLowNotes([
      note(
        'From $4,000 to about {mbStart} the rate is {low}: Canada Pension Plan and Employment Insurance, with no income tax yet.',
        pool,
      ),
    ]),
    note(
      'Manitoba’s own tax starts before the federal tax does. The rate is {mbRate} from {mbStart}: Manitoba tax, Canada Pension Plan and Employment Insurance. It is {withFed} from {fedJoins}, once federal tax joins in, then {afterBenefit} from {benefitGone}. The Manitoba Family Tax Benefit lowers your Manitoba tax and shrinks by {benefitRate} for every dollar of income. It is gone at about {benefitGone}, so the rate falls by about 1 point there.',
      pool,
    ),
    note(
      'It steps up to {next} at {nextAt} (Manitoba’s next bracket) and {fedRate} at {fedBracket} (the federal {fedBracketRate} bracket), then falls as Employment Insurance and the Canada Pension Plan stop: {afterEi} at {eiStop}, {afterCpp} at {cppStop} and {afterCpe} at {cpeStop}.',
      pool,
    ),
    note(
      'At {v1} of salary it steps up about 1 point to {v2}, and it reaches {v3} from {v4} to {v5}. Then it drops about 1 point, to {v6}. The cause is the Manitoba basic personal amount, which shrinks to zero as net income goes from {bpa1} to {bpa2}, so you lose a little tax saving on each extra dollar. The line is straight from {flatAt}.',
      pool,
    ),
  ],
};
