import { fullHubCharts } from '../test/hubNotesData';
import { strings } from '../strings';
import { copyRules, everyString } from '../test/copyRules';
import { HUB_CHART_IDS, type HubChartId } from './hubCharts';
import {
  chartNotes,
  figureAgrees,
  figureText,
  noteWords,
  parseSpec,
  tokensOf,
} from './hubNotes';
import type { Note, ProvinceNotes } from './hubNoteTypes';
import { hubNoteText } from './hubNoteText';
import { FOOTER_PROVINCE_SLUGS } from './siteLinks';

const unit = strings.fallbackUnit;
const rateUnit = fullHubCharts(['ca-on']).provinces[0]?.rateUnit ?? unit;

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
  it('has text for the take-home, average, marginal and yearly charts of every province', () => {
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

  it('agrees with the sweep: every declared salary sits where the data changes', () => {
    const failures: string[] = [];
    for (const { slug, note } of everyNote()) {
      const { points } = sweepOf(slug);
      for (const [name, spec] of Object.entries(note.figures ?? {})) {
        if (!figureAgrees(parseSpec(spec), points)) {
          failures.push(`${slug} {${name}} ${spec}`);
        }
      }
    }
    expect(failures).toEqual([]);
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
    // The marginal and yearly-total text never says take-home; no province is ranked.
    for (const { slug, chart, note } of everyNote()) {
      if (
        chart === 'marginalRate' ||
        chart === 'yearTotal' ||
        chart === 'averageRate'
      ) {
        expect(note.text, `${slug} ${chart}`).not.toMatch(/take-home/i);
      }
      expect(note.text, `${slug} ${chart}`).not.toMatch(
        /\b(lowest|highest|best|worst)\b[^.]*\b(of the six|provinces)\b|\b\d(st|nd|rd|th) of\b|overtakes/i,
      );
    }
  });

  it('reads Ontario as the copy thread wrote it', () => {
    const sweep = sweepOf('ca-on');
    expect(chartNotes('ca-on', 'averageRate', sweep)[2]).toBe(
      'The average passes 10% at $33,000, 20% at $53,000, 30% at $145,000 and 40% at $305,000.',
    );
    expect(chartNotes('ca-on', 'yearTotal', sweep)[0]).toBe(
      'This chart adds income tax, Canada Pension Plan and Employment Insurance, then takes off benefits paid to you when you file. At low salaries the total is below zero. It is $16,214 at $70,000, and $25,794 at $100,000.',
    );
    expect(chartNotes('ca-on', 'marginalRate', sweep).join(' ')).toContain(
      '59.11% from $72,700 to $73,290, and 73.27% from $201,130 to $201,720',
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

  it('writes a rate as cents on the dollar', () => {
    const sweep = sweepOf('ca-mb');
    expect(
      figureText(parseSpec('c:marginal@12000'), sweep.points, unit, rateUnit),
    ).toBe('8.57 cents');
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
    const spec = parseSpec('r:marginal@300000');
    expect(figureText(spec, sweep.points, unit, rateUnit)).toBe('53.53%');
    expect(
      figureText(parseSpec('m:tax@500000'), sweep.points, unit, rateUnit),
    ).toBe('$221,153');
  });

  it('fails a declared salary the data does not support', () => {
    const { points } = sweepOf('ca-on');
    // Tax is already paid at $100,000: nothing changes there.
    expect(figureAgrees(parseSpec('e:150500:marginal'), points)).toBe(false);
    expect(figureAgrees(parseSpec('e:19300:tax'), points)).toBe(true);
  });
});
