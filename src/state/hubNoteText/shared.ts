import type { Note } from '../hubNoteTypes';

/** A bullet from its words and a pool of figures: it takes the ones its words use. */
export function note(text: string, pool: Record<string, string>): Note {
  const figures: Record<string, string> = {};
  for (const match of text.matchAll(/\{([a-zA-Z0-9]+)\}/g)) {
    const name = match[1] ?? '';
    const spec = pool[name];
    if (spec !== undefined) figures[name] = spec;
  }
  return { text, figures };
}

/** What differs between provinces in the wording every province shares. */
export type SharedFigures = {
  /** A sweep salary just below where the line turns straight (the top rate has begun). The engine's own figure is read from the data. */
  flatFrom: string;
};

/**
 * The figures several bullets share, as specs (see `hubNotes.ts`). A change of the marginal rate is named by a
 * salary near it (`e:` is where the new rate has taken hold, `o:` where the rate first moves); the figure shown
 * is the engine's.
 */
export const POOL = {
  // Employment Insurance as the Employment Insurance form sets it: nothing up to $2,000, then a dollar of
  // premium for every dollar earned, until the full premium applies.
  eiFloor: 'd:2000',
  eiEnd: 'f:ei_band_end',
  eiTop: 'f:ei_band_top',
  zero: 'r:marginal@1000',
  all: 'r:marginal@2020',
  eiCents: 't:ei_rate',
  eiAvgFrom: 'e:2020',
  eiAvg: 'r:average@2040',
  // Where federal income tax starts, and the rates either side of it.
  fedStart: 'e:19000',
  low: 'r:marginal@12000',
  fed: 'r:marginal@20000',
  // The Canada Pension Plan and Employment Insurance together.
  cpeCents: 'c:marginal@12000',
  cpeMax: 'm:cpe@85000',
  eiStop: 'f:ei_stop',
  cppStop: 'e:74000',
  cpeStop: 'e:84000',
  top: 'd:500000',
  topRate: 'r:marginal@300000',
  keepTop: 'k:marginal@300000',
  keepAll: 'q:takeHome@500000',
  perTen: 'u:marginal@300000',
  total70: 'm:total@70000',
  total100: 'm:total@100000',
  total500: 'm:total@500000',
  avg10: 'r:average@10000',
  avg20: 'r:average@20000',
  avg30: 'r:average@30000',
  avg50: 'r:average@50000',
  avg70: 'r:average@70000',
  avg100: 'r:average@100000',
  avgTop: 'r:average@500000',
  // The federal 20.5% bracket, and the rates once Employment Insurance and the Canada Pension Plan stop.
  fedBracket: 'e:59000',
  fedBracketRate: 'p:federal_second_rate',
  afterEi: 'r:marginal@69000',
  afterCpp: 'r:marginal@75000',
  afterCpe: 'r:marginal@85000',
} as const;

/** The bullets of the "take-home pay" chart, the same wording in every province. */
export function takeHomeNotes(f: SharedFigures): Note[] {
  const pool = { ...POOL, flatFrom: `e:${f.flatFrom}` };
  return [
    note(
      'Canada Pension Plan and Employment Insurance together stop growing at {cpeStop}, at most {cpeMax} a year. Employment Insurance stops growing at about {eiStop}, and the Canada Pension Plan at about {cppStop}. Above that, each extra dollar loses only income tax.',
      pool,
    ),
    note(
      'From {flatFrom} up, the line is straight: you keep {keepTop} of every extra dollar. At {top} you keep {keepAll} of your salary.',
      pool,
    ),
  ];
}

/** The bullets of the "average tax rate" chart. `second` is the bullet about where income tax starts, which Manitoba words for itself; `extra` follows the shared ones. */
export function averageRateNotes(
  second: Note[] = [
    note(
      'Up to about {fedStart} you pay no income tax, only Canada Pension Plan and Employment Insurance. The average is {avg10} at $10,000 and {avg20} at $20,000.',
      POOL,
    ),
  ],
  extra: Note[] = [],
): Note[] {
  return [
    note(
      'Up to {eiFloor} the average is {zero}. Employment Insurance starts just above {eiFloor} and counts for more as your salary rises, until the full rate applies by about {eiEnd}. The average is about {eiAvg} from about {eiAvgFrom}.',
      POOL,
    ),
    ...second,
    note(
      'After that the average climbs: {avg30} at $30,000, {avg50} at $50,000, {avg70} at $70,000 and {avg100} at $100,000.',
      POOL,
    ),
    note(
      'It climbs more slowly than the marginal rate, because each higher rate applies only to the dollars above its bracket. At {top} the average is {avgTop}, while the top marginal rate is {topRate}.',
      POOL,
    ),
    ...extra,
  ];
}

/**
 * The first bullets of the "marginal tax rate" chart: Employment Insurance up to and just above $2,000, the
 * rate where only the pension plan and insurance apply, and where they stop. `between` is the bullet about
 * the rate from $4,000 to where income tax starts, which Manitoba words for itself.
 */
export function marginalLowNotes(
  between: Note[] = [
    note(
      'From $4,000 to about {fedStart} the rate is {low}: Canada Pension Plan and Employment Insurance, with no income tax yet. It is {fed} from {fedStart}, when federal income tax starts.',
      POOL,
    ),
  ],
): Note[] {
  return [
    note(
      'Up to {eiFloor} the rate is {zero}. From {eiFloor} to about {eiEnd} the rate is {all}, because the Employment Insurance counted rises by $1 for every $1 of salary, until it reaches about {eiTop}. After that it takes {eiCents} of each extra dollar.',
      POOL,
    ),
    ...between,
    note(
      'Canada Pension Plan and Employment Insurance take about {cpeCents} of each dollar. Employment Insurance stops at about {eiStop}, and the main Canada Pension Plan amount at {cppStop}. A second Canada Pension Plan tier takes {tier} of each dollar from {cppStop} to {cpeStop}, so the rate falls less at {cppStop} than at {cpeStop}.',
      { ...POOL, tier: 'l:4 cents' },
    ),
  ];
}

/** The last bullet of the "marginal tax rate" chart: the line turns straight. */
export function straightLineNote(f: SharedFigures): Note {
  return note(
    'From {flatFrom} of salary the line is straight: the rate stops rising, and every extra dollar loses the top rate, {topRate}.',
    { ...POOL, flatFrom: `e:${f.flatFrom}` },
  );
}
