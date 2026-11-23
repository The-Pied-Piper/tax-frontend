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
  /** Where the line of take-home pay turns straight (the top rate has begun). */
  flatFrom: string;
  /** The Canada workers benefit: what it builds up by a dollar, the salary it starts above, its most, and where it has built up fully. */
  cwbRate: string;
  cwbStart: string;
  cwbMax: string;
  cwbTo: string;
  /** The levels the average rate passes that the sweep reaches, as fractions: "0.10". */
  levels: string[];
};

const POOL = {
  cpeStop: 's:85000:cpe',
  cpeMax: 'm:cpe@85000',
  eiStop: 'd:69000',
  cppStop: 'e:74600:marginal',
  top: 'd:500000',
  keepTop: 'k:marginal@300000',
  keepAll: 'q:takeHome@500000',
  avgTop: 'r:average@500000',
  topRate: 'r:marginal@300000',
  half: 'h:average',
  eiRefund: 'm:cpe@2000',
  total70: 'm:total@70000',
  total100: 'm:total@100000',
  total500: 'm:total@500000',
  perTen: 'u:marginal@300000',
  eiBack: 'r:average@2040',
} as const;

/** The bullets of the "take-home pay" chart, the same wording in every province. */
export function takeHomeNotes(f: SharedFigures): Note[] {
  const pool = { ...POOL, flatFrom: `e:${f.flatFrom}:marginal` };
  return [
    note(
      'Canada Pension Plan and Employment Insurance together stop growing at {cpeStop}, at most {cpeMax} a year. Employment Insurance stops growing at about {eiStop}, and the Canada Pension Plan at about {cpeStop}. Above that, each extra dollar loses only income tax.',
      pool,
    ),
    note(
      'From {flatFrom} up, the line is straight: you keep {keepTop} of every extra dollar. At {top} you keep {keepAll} of your salary.',
      pool,
    ),
  ];
}

/** The low-salary bullets of the "average tax rate" chart, by kind of province. */
export const averageLow = {
  // Ontario, Saskatchewan, Newfoundland and Labrador.
  standard: (start: string): Note[] => [
    note(
      'Up to $2,000 the average is 0%. Employment Insurance is taken from your pay and refunded when you file, so the net is nothing. Just above $2,000 you lose that refund and the average is about {eiBack}.',
      POOL,
    ),
    note(
      'From about {start} the Canada workers benefit, which is paid when you file, is bigger than what you pay, so the average is below zero. It is lowest, {lowest}, at {lowAt}, and turns positive at {positive}.',
      {
        ...POOL,
        start: `e:${start}:average`,
        lowest: 'v:average',
        lowAt: 'w:average',
        positive: 'z:average',
      },
    ),
  ],
  alberta: (start: string): Note[] => [
    note(
      'Up to $2,000 the average is 0%, for the same Employment Insurance reason.',
      POOL,
    ),
    note(
      'From about {start} the Canada workers benefit is bigger than what you pay, so the average is below zero. It is lowest, about {lowest}, at {lowAt}, and turns positive at about {positive}.',
      {
        ...POOL,
        start: `e:${start}:average`,
        lowest: 'v:average',
        lowAt: 'w:average',
        positive: 'z:average',
      },
    ),
  ],
  // British Columbia and Manitoba: a provincial credit is paid from the first dollar.
  credit: (name: string, ending = '.', about = 'about '): Note[] => [
    note(
      `Your ${name} is paid from the first dollar, so the average is below zero at every salary up to about {positive}. It is lowest, ${about}{lowest}, at {lowAt}${ending}`,
      {
        ...POOL,
        lowest: 'v:average',
        lowAt: 'w:average',
        positive: 'z:average',
      },
    ),
  ],
};

/** The bullets of the "average tax rate" chart: the province's low-salary bullets, then the wording every province shares. */
export function averageRateNotes(f: SharedFigures, low: Note[]): Note[] {
  const pool: Record<string, string> = { ...POOL };
  const passes = f.levels.map((level) => {
    const name = `p${level.slice(2)}`;
    pool[name] = `x:average:${level}`;
    return `${level.slice(2)}% at {${name}}`;
  });
  const list =
    passes.length > 1
      ? `${passes.slice(0, -1).join(', ')} and ${passes[passes.length - 1] ?? ''}`
      : (passes[0] ?? '');
  return [
    ...low,
    note(`The average passes ${list}.`, pool),
    note(
      'It climbs more slowly than the marginal rate, because each higher rate applies only to the dollars above its bracket. At {top} the average is {avgTop}, while the top marginal rate is {topRate}. It reaches half of its {top} value at {half}.',
      pool,
    ),
  ];
}

/** The first three bullets of the "marginal tax rate" chart; `credit` provinces drop the first clause about the Employment Insurance refund below $2,000. */
export function marginalLowNotes(
  f: SharedFigures,
  credit = false,
  takes = 'l:7.6 cents',
): Note[] {
  const pool: Record<string, string> = {
    ...POOL,
    cwbTo: `e:${f.cwbTo}:marginal`,
    cwbRate: `l:${f.cwbRate}`,
    cwbStart: `d:${f.cwbStart}`,
    cwbMax: `d:${f.cwbMax}`,
    cwbFrom: 'e:3000:marginal',
    takes,
  };
  return [
    note(
      credit
        ? 'Employment Insurance is refunded when you file if you earn $2,000 or less. Earn a dollar more and you lose that refund, about {eiRefund} in all, so the rate spikes just past $2,000.'
        : 'Up to $2,000 the rate is 0%: Employment Insurance is refunded when you file. Earn a dollar more and you lose that refund, about {eiRefund} in all, so the rate spikes just past $2,000.',
      pool,
    ),
    note(
      'Then, from {cwbFrom} to about {cwbTo}, the rate is below zero. The Canada workers benefit is paid when you file. For a low salary it builds up by {cwbRate} for every dollar earned above {cwbStart}, to at most about {cwbMax}. Counting that benefit, each extra dollar of salary leaves you with more than a dollar, so the rate is below zero.',
      pool,
    ),
    note(
      'Canada Pension Plan and Employment Insurance take about {takes} of each dollar. The rate steps down where they stop: Employment Insurance at about {eiStop}, the main Canada Pension Plan amount at {cppStop} and its second tier at {cpeStop}.',
      pool,
    ),
  ];
}

/** The bullets of the "tax and contributions for the year" chart, the same wording in every province. */
export function yearTotalNotes(f: SharedFigures): Note[] {
  const pool: Record<string, string> = {
    ...POOL,
    flatFrom: `e:${f.flatFrom}:marginal`,
  };
  return [
    note(
      'This chart adds income tax, Canada Pension Plan and Employment Insurance, then takes off benefits paid to you when you file. At low salaries the total is below zero. It is {total70} at $70,000, and {total100} at $100,000.',
      pool,
    ),
    note(
      'The line bends upward at each new bracket, then goes straight. From {flatFrom} up, every extra dollar loses the top rate, {topRate}, so each extra $10,000 of salary adds {perTen}. At {top} the total is {total500}.',
      pool,
    ),
  ];
}
