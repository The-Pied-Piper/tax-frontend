import type { ProvinceNotes } from '../hubNoteTypes';
import { note, POOL } from './shared';

const pool: Record<string, string> = {
  ...POOL,
  eiStop: 'e:68000',
  qppStop: 'e:74000',
  qppTwo: 'e:84000',
  qpipStop: 'd:103000',
  eiMax: 'l:$895.70',
  qpipMax: 'l:$442.90',
  qpipFull: 'l:$8.60',
  flatFrom: 'e:259610',
  eiCents: 'c:marginal@2040',
  taxFrom: 'e:19000',
  qcFrom: 'e:20000',
  qcRate: 'y:20000',
  fedRate: 'y:19000',
  drugFrom: 'e:21000',
  drugRate: 'y:21000',
  workStop: 'e:24000',
  workRate: 'y:24000',
  drugTop: 'e:26000',
  drugTopRate: 'y:26000',
  drugEnd: 'e:29000',
  drugEndRate: 'y:29000',
  second: 'e:56000',
  secondRate: 'y:56000',
  fedBracket: 'e:59000',
  fedBracketRate: 'y:59000',
  afterEiRate: 'y:68000',
  afterQppRate: 'y:74000',
  afterTwoRate: 'y:84000',
  third: 'e:111000',
  thirdRate: 'y:111000',
  fed26: 'e:118000',
  fed26Rate: 'y:118000',
  topBr: 'e:134000',
  topBrRate: 'y:134000',
  fed29: 'e:182000',
  fed29Rate: 'y:182000',
  topRate2: 'y:255000',
  three: 'e:3000',
  threeRate: 'y:3000',
};

export const quebec: ProvinceNotes = {
  takeHome: [
    note(
      'Quebec Pension Plan, Employment Insurance and QPIP stop growing at different salaries. Employment Insurance stops at {eiStop}, at most {eiMax} a year. The main QPP amount stops at {qppStop}, and its second tier at {qppTwo}. QPIP stops at {qpipStop}, at most {qpipMax}.',
      pool,
    ),
    note(
      'From {flatFrom} up, the line is straight: you keep {keepTop} of every extra dollar. At {top} you keep {keepAll} of your salary.',
      { ...pool, keepTop: 'k:marginal@300000', keepAll: 'q:takeHome@500000' },
    ),
  ],
  averageRate: [
    note(
      'Up to {eiFloor} the average is {zero}. At {eiFloor} QPIP starts, and the average is {avg2}. Employment Insurance counts from just above {eiFloor}.',
      { ...pool, avg2: 'r:average@2000' },
    ),
    note(
      'The average is {avg10} at $10,000, {avg20} at $20,000 and {avg30} at $30,000. It passes {avg50} at $50,000, {avg70} at $70,000 and {avg100} at $100,000.',
      pool,
    ),
    note(
      'It climbs more slowly than the marginal rate, because each higher rate applies only to the dollars above its bracket. At {top} the average is {avgTop}, while the top marginal rate is {topRate}.',
      pool,
    ),
  ],
  marginalRate: [
    note(
      'Up to {eiFloor} the rate is {zero}. At {eiFloor} QPIP starts and its whole {qpipFull} counts at once. From {eiFloor} to about {eiEnd} the rate is {all}, because the Employment Insurance counted rises by $1 for every $1 of salary, until it reaches {eiTop}. After that Employment Insurance and QPIP take {eiCents} of each extra dollar.',
      pool,
    ),
    note(
      'From {three} the rate is {threeRate}: Quebec Pension Plan, Employment Insurance and QPIP, with no income tax yet.',
      pool,
    ),
    note(
      'It is {fedRate} from {taxFrom}, when federal income tax starts, and {qcRate} from {qcFrom}, when Quebec income tax starts.',
      pool,
    ),
    note(
      'The rate then reaches {drugRate} from {drugFrom}, {workRate} from {workStop} and {drugTopRate} from {drugTop}. Two things cause this. The drug insurance premium grows by {pa} for every dollar of income, then {pb}, until it reaches its maximum at {drugEnd}. And the deduction for workers stops growing at {workStop}. Then the rate falls to {drugEndRate}.',
      { ...pool, pa: 'l:7.84 cents', pb: 'l:11.76 cents' },
    ),
    note(
      'It is {secondRate} from {second} (Quebec’s second bracket) and {fedBracketRate} from {fedBracket} (the federal 20.5% bracket).',
      pool,
    ),
    note(
      'Then it falls as payments stop: Employment Insurance at {eiStop} ({afterEiRate}), the main QPP amount at {qppStop} ({afterQppRate}, with a second QPP tier of 4 cents of each dollar up to {qppTwo}, then {afterTwoRate}), and QPIP at {qpipStop}.',
      pool,
    ),
    note(
      'After that it only climbs: {thirdRate} from {third} (Quebec’s third bracket), {fed26Rate} from {fed26} (the federal 26% bracket), {topBrRate} from {topBr} (Quebec’s top bracket), {fed29Rate} from {fed29} (the federal 29% bracket), and {topRate2} from {flatFrom}, where the line is straight.',
      pool,
    ),
  ],
};
