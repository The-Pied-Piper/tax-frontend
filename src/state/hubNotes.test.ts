import { fullHubCharts } from '../test/hubNotesData';
import { copyRules, everyString } from '../test/copyRules';
import { HUB_CHART_IDS, type HubChartId } from './hubCharts';
import {
  chartNotes,
  figureText,
  noteWords,
  parseSpec,
  tokensOf,
} from './hubNotes';
import type { Note, ProvinceNotes } from './hubNoteTypes';
import { hubNoteText } from './hubNoteText';
import { FOOTER_PROVINCE_SLUGS } from './siteLinks';

function sweepOf(slug: string) {
  const found = fullHubCharts([slug]).provinces[0];
  if (!found) throw new Error(`no points for ${slug}`);
  return found;
}

const SLUGS = [...FOOTER_PROVINCE_SLUGS];
const CHARTS: HubChartId[] = [...HUB_CHART_IDS];

function everyNote(): { slug: string; chart: HubChartId; note: Note }[] {
  return SLUGS.flatMap((slug) =>
    CHARTS.flatMap((chart) =>
      (hubNoteText[slug]?.[chart] ?? []).map((note) => ({ slug, chart, note })),
    ),
  );
}

describe('the text of the hub charts', () => {
  it('has text for the take-home, average and marginal charts of every province', () => {
    for (const slug of SLUGS) {
      const text: ProvinceNotes = hubNoteText[slug] ?? {};
      for (const chart of CHARTS) {
        expect(text[chart]?.length, `${slug} ${chart}`).toBeGreaterThan(0);
      }
    }
  });

  it('gives every {name} a figure and every figure a {name}', () => {
    for (const { slug, note } of everyNote()) {
      expect(
        Object.keys(note.figures ?? {}).sort(),
        `${slug}: ${note.text}`,
      ).toEqual([...new Set(tokensOf(note.text))].sort());
    }
  });

  it('reads every change of rate a note names from the engine, and every fact from its data', () => {
    for (const { slug, note } of everyNote()) {
      const sweep = sweepOf(slug);
      for (const [name, spec] of Object.entries(note.figures ?? {})) {
        // Throws if the data holds no such change or fact.
        expect(
          figureText(parseSpec(spec), sweep),
          `${slug} {${name}} ${spec}`,
        ).not.toMatch(/undefined|NaN/);
      }
    }
  });

  it('fills every figure from the data and leaves no brace behind', () => {
    for (const slug of SLUGS) {
      const sweep = sweepOf(slug);
      for (const chart of CHARTS) {
        for (const words of chartNotes(slug, chart, sweep)) {
          expect(words, `${slug} ${chart}`).not.toMatch(/[{}]/);
          expect(words).not.toMatch(/undefined|NaN/);
        }
      }
    }
  });

  it('follows the copy rules and the project rulings', () => {
    const all = everyString(
      SLUGS.flatMap((slug) =>
        CHARTS.flatMap((chart) => hubNoteText[slug]?.[chart] ?? []),
      ),
    ).join('\n');
    for (const [name, rule] of copyRules) {
      expect(all, name).not.toMatch(rule);
    }
    // The rate text never says take-home; no province is ranked.
    for (const { slug, chart, note } of everyNote()) {
      if (chart === 'marginalRate' || chart === 'averageRate') {
        expect(note.text, `${slug} ${chart}`).not.toMatch(/take-home/i);
      }
      expect(note.text, `${slug} ${chart}`).not.toMatch(
        /\b(lowest|highest|best|worst)\b[^.]*\b(of the six|provinces)\b|\b\d(st|nd|rd|th) of\b|overtakes/i,
      );
    }
  });

  it('reads Ontario as the copy thread wrote it, with the engine’s figures', () => {
    const sweep = sweepOf('ca-on');
    expect(chartNotes('ca-on', 'averageRate', sweep)[0]).toBe(
      'Up to $2,000 the average is 0%. Employment Insurance starts just above $2,000 and counts for more as your salary rises, until the full rate applies by about $2,033. The average is about 1.6% from about $2,034.',
    );
    const marginal = chartNotes('ca-on', 'marginalRate', sweep).join(' ');
    // The three spikes, from the engine's edges and read to one decimal.
    expect(marginal).toContain(
      '54.9% from $48,450 to $49,055, 59.1% from $72,692 to $73,297, and 73.3% from $201,128 to $201,727',
    );
    // The surtax thresholds are the 2026 engine parameters, not the 2025 form's.
    expect(marginal).toContain(
      'above $5,818, and another 36 cents above $7,446',
    );
  });

  it('writes every province and chart as one reviewed text, so a change in wording or in a figure shows in review', () => {
    for (const slug of SLUGS) {
      const sweep = sweepOf(slug);
      const text = CHARTS.map(
        (chart) => `${chart}\n${chartNotes(slug, chart, sweep).join('\n')}`,
      ).join('\n\n');
      expect(text).toMatchSnapshot(slug);
    }
  });

  it('writes a rate as cents on the dollar, to the nearest half cent', () => {
    const sweep = sweepOf('ca-mb');
    expect(figureText(parseSpec('c:marginal@12000'), sweep)).toBe('7.5 cents');
  });

  it('writes the marginal rate to the nearest half point and any other rate to one decimal', () => {
    const sweep = sweepOf('ca-on');
    expect(figureText(parseSpec('r:marginal@12000'), sweep)).toBe('7.5%');
    expect(figureText(parseSpec('r:marginal@300000'), sweep)).toBe('53.5%');
    expect(figureText(parseSpec('r:average@70000'), sweep)).toBe('23.2%');
  });

  it('refuses a figure that is not a spec, and a name with no figure', () => {
    expect(() => parseSpec('nonsense')).toThrow();
    expect(() => parseSpec('m:nothing@70000')).toThrow();
    const sweep = sweepOf('ca-on');
    expect(() => noteWords({ text: 'A {gap}.' }, sweep)).toThrow(/no figure/);
    expect(() =>
      noteWords({ text: 'A.', figures: { x: 'd:1' } }, sweep),
    ).toThrow(/not used/);
  });

  it('writes a read figure from the data, not from the text', () => {
    const sweep = sweepOf('ca-on');
    expect(figureText(parseSpec('m:tax@500000'), sweep)).toBe('$221,153');
    expect(figureText(parseSpec('f:surtax_first'), sweep)).toBe('$5,818');
    expect(figureText(parseSpec('t:surtax_second_rate'), sweep)).toBe(
      '36 cents',
    );
  });

  it('names a change of rate by a salary near it and prints the engine’s figure', () => {
    const sweep = sweepOf('ca-on');
    // A band starts where the rate has settled and ends where it first moves.
    expect(figureText(parseSpec('e:20000'), sweep)).toBe('$20,167');
    expect(figureText(parseSpec('o:25000'), sweep)).toBe('$25,217');
    expect(figureText(parseSpec('y:48000'), sweep)).toBe('54.9%');
  });

  it('fails for a change of rate or a fact the data does not hold', () => {
    const sweep = sweepOf('ca-on');
    // The rate does not change between $150,000 and $151,000 on a note's say-so.
    expect(() => figureText(parseSpec('e:150500'), sweep)).toThrow(
      /no change of rate/,
    );
    expect(() => figureText(parseSpec('f:nothing'), sweep)).toThrow(
      /no figure/,
    );
  });
});
