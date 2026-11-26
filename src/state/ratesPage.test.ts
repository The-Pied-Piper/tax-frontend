import { fullHubCharts } from '../test/hubNotesData';
import {
  causeChip,
  ratesPageText,
  ratesPageView,
  ratesProvinces,
} from './ratesPage';
import { subtractAmounts } from '../money/amounts';
import { compareAmounts } from '../money/scale';
import { ratesSlug } from './siteLinks';

const sweep = () => {
  const found = fullHubCharts(['ca-on']).provinces[0];
  if (!found) throw new Error('no sweep');
  return found;
};

describe('ratesPageView', () => {
  it('has an address with no year', () => {
    expect(ratesSlug('ca-on')).toBe('ca-on/tax-rates');
  });

  it('lists the provinces that have wording', () => {
    expect(ratesProvinces()).toEqual(['ca-on', 'ca-ab', 'ca-nl']);
  });

  it('fills every figure from the sweep and leaves no brace behind', () => {
    const view = ratesPageView('ca-on', sweep());
    if (!view) throw new Error('no view');
    const everyWord = [
      ...view.intro,
      ...view.howToRead,
      ...view.groups.flatMap((group) => group.notes.map((note) => note.words)),
      ...view.tables.flatMap((table) => [
        table.before ?? '',
        table.after ?? '',
        ...table.rows.flat(),
      ]),
    ];
    expect(everyWord.length).toBeGreaterThan(20);
    for (const words of everyWord) {
      expect(words).not.toMatch(/[{}]|undefined|NaN/);
    }
  });

  it('gives one decimal for every rate in the opening finding', () => {
    const view = ratesPageView('ca-on', sweep());
    expect(view?.intro[0]).toMatch(/\d+\.\d%/);
    expect(view?.intro[0]).not.toMatch(/\d+\.\d\d%/);
  });

  it('draws nothing from a sweep that is not the full one', () => {
    const partial = { ...sweep(), points: sweep().points.slice(0, 10) };
    expect(ratesPageView('ca-on', partial)).toBeNull();
  });

  it('draws nothing for a province with no wording', () => {
    expect(ratesPageView('ca-bc', sweep())).toBeNull();
  });

  it('names a cause form for every note and links the forms that have a page', () => {
    const text = ratesPageText['ca-on'];
    for (const group of text?.groups ?? []) {
      for (const note of group.notes) {
        expect(note.forms.length, note.text).toBeGreaterThan(0);
      }
    }
    expect(causeChip('t2204').href).toBe('/forms/t2204/');
    expect(causeChip('on428a').label).toBe('Schedule ON428-A');
  });

  it('links the cause forms that have a page in this build, and names the rest without a link', () => {
    // The vitest define lists the form pages the app has; ids must be the real page ids.
    for (const form of [
      't1',
      'on428',
      'on428a',
      't2204',
      'schedule8',
    ] as const) {
      const chip = causeChip(form);
      expect(chip.href, form).toMatch(/^\/forms\/[a-z0-9-]+\/$/);
    }
    expect(causeChip('on428a').href).toBe('/forms/on428-a/');
    expect(causeChip('schedule8').href).toBe('/forms/schedule-8/');
  });

  it('puts the last group heading at the salary the data says the top bracket starts at', () => {
    const groups = ratesPageText['ca-on']?.groups ?? [];
    const last = groups[groups.length - 1]?.heading ?? '';
    const top = sweep().facts['fed_bracket_5_salary'] ?? '';
    // "Above $260,000": the heading's round figure is within $1,000 above the data's.
    const heading = last.replace(/\D/g, '');
    const gap = subtractAmounts(heading, top);
    expect(compareAmounts(gap, '0')).toBeGreaterThanOrEqual(0);
    expect(compareAmounts(gap, '1000')).toBeLessThan(0);
  });

  it('types no dollar figure or cents figure in a note or a table cell', () => {
    const text = ratesPageText['ca-on'];
    const words = [
      ...(text?.intro ?? []).map((note) => note.text),
      ...(text?.howToRead ?? []).map((note) => note.text),
      ...(text?.groups ?? []).flatMap((group) =>
        group.notes.map((note) => note.text),
      ),
      ...(text?.tables ?? []).flatMap((table) => [
        table.before?.text ?? '',
        table.after?.text ?? '',
        ...table.rows.flat(),
      ]),
    ];
    for (const line of words) {
      expect(line).not.toMatch(/\$\d|\d cents/);
    }
  });

  it('keeps the tab title under 64 characters and the description under 160', () => {
    const text = ratesPageText['ca-on'];
    expect(text?.title.length).toBeLessThan(64);
    expect(text?.description.length).toBeLessThan(160);
  });
});

describe('the Alberta rates page', () => {
  const albertaSweep = () => {
    const found = fullHubCharts(['ca-ab']).provinces[0];
    if (!found) throw new Error('no sweep');
    return found;
  };
  const view = () => {
    const found = ratesPageView('ca-ab', albertaSweep());
    if (!found) throw new Error('no view');
    return found;
  };
  const everyWord = () => [
    ...view().intro,
    ...view().howToRead,
    ...view().groups.flatMap((group) => group.notes.map((note) => note.words)),
    ...view().tables.flatMap((table) => [
      table.before ?? '',
      table.after ?? '',
      ...table.rows.flat(),
    ]),
  ];

  it('fills every figure from the sweep and leaves no brace behind', () => {
    expect(everyWord().length).toBeGreaterThan(20);
    for (const words of everyWord()) {
      expect(words).not.toMatch(/[{}]|undefined|NaN/);
    }
  });

  it('opens with the figures the CRA review gives', () => {
    expect(view().intro[0]).toContain(
      'from about 7.6% once you pay into the Canada Pension Plan (from $3,500) to 48.0% above $371,347.',
    );
    expect(view().intro[0]).toContain('to 40.3% at $500,000');
  });

  it('says where tax starts in the first row of each bracket table', () => {
    const [federal, alberta] = view().tables;
    expect(federal?.rows[0]).toEqual([
      '$0',
      '14%',
      'tax starts at about $19,201',
      '20.5%',
    ]);
    expect(alberta?.rows[0]).toEqual([
      '$0',
      '8%',
      'tax starts at about $24,412',
      '27.9%',
    ]);
  });

  it('reads the top rate at the top bracket, and what you keep from it', () => {
    const last = view().groups[view().groups.length - 1];
    const top = last?.notes[last.notes.length - 1]?.words ?? '';
    expect(top).toContain('straight at 48.0%');
    expect(top).toContain('rate, 15%, starts at a taxable income of $370,220');
    expect(top).toContain('you keep 52.0%');
  });

  it('rounds each computed rate once, from the unrounded value', () => {
    const words = view().groups.flatMap((group) =>
      group.notes.map((note) => note.words),
    );
    // 0.343474 is 34.3%, not 34.4% from a four-place 0.3435; 0.4034898 is 40.3%.
    expect(words.join(' ')).toContain('the rate is 34.3%');
    expect(view().intro[0]).not.toContain('40.4%');
  });

  it('takes every bracket salary from the data and agrees with the engine edges to the dollar', () => {
    const data = albertaSweep();
    const salaryOf = (name: string) => data.facts[name] ?? '';
    for (const name of [
      'fed_bracket_2_salary',
      'fed_bracket_3_salary',
      'fed_bracket_4_salary',
      'fed_bracket_5_salary',
      'ab_bracket_2_salary',
      'ab_bracket_3_salary',
      'ab_bracket_4_salary',
      'ab_bracket_5_salary',
      'ab_bracket_6_salary',
    ]) {
      const salary = salaryOf(name);
      // The edge where the rate changes: the last salary at the old rate is just below, the new rate has settled by `settled`.
      const edge = data.edges.find(
        (found) =>
          compareAmounts(found[1], salary) <= 0 &&
          compareAmounts(salary, found[2]) <= 0,
      );
      expect(edge, name).toBeDefined();
    }
  });

  it('draws every change of the rate as a step: the next sample point after each edge is within $2 of it', () => {
    const points = albertaSweep().points;
    for (const [, moves] of albertaSweep().edges) {
      const at = points.findIndex((point) => point[0] === `${moves}.00`);
      expect(at, moves).toBeGreaterThanOrEqual(0);
      const next = points[at + 1]?.[0] ?? '0';
      expect(
        compareAmounts(subtractAmounts(next, moves), '2'),
        `${moves} then ${next}`,
      ).toBeLessThanOrEqual(0);
    }
  });

  it('puts the last group heading at the salary the federal top bracket starts at', () => {
    const groups = ratesPageText['ca-ab']?.groups ?? [];
    const heading = (groups[groups.length - 1]?.heading ?? '').replace(
      /\D/g,
      '',
    );
    const top = albertaSweep().facts['fed_bracket_5_salary'] ?? '';
    const gap = subtractAmounts(heading, top);
    expect(compareAmounts(gap, '0')).toBeGreaterThanOrEqual(0);
    expect(compareAmounts(gap, '1000')).toBeLessThan(0);
  });

  it('names a cause form for every note, and links the Alberta form page', () => {
    for (const group of ratesPageText['ca-ab']?.groups ?? []) {
      for (const note of group.notes) {
        expect(note.forms.length, note.text).toBeGreaterThan(0);
      }
    }
    expect(causeChip('ab428').label).toBe('Form AB428');
    expect(causeChip('ab428').href).toBe('/forms/ab428/');
  });

  it('types no dollar figure or cents figure in a note or a table cell', () => {
    const text = ratesPageText['ca-ab'];
    const typed = [
      ...(text?.intro ?? []).map((note) => note.text),
      ...(text?.howToRead ?? []).map((note) => note.text),
      ...(text?.groups ?? []).flatMap((group) =>
        group.notes.map((note) => note.text),
      ),
      ...(text?.tables ?? []).flatMap((table) => [
        table.before?.text ?? '',
        table.after?.text ?? '',
        ...table.rows.flat(),
      ]),
    ];
    for (const line of typed) {
      expect(line).not.toMatch(/\$\d|\d cents/);
    }
  });

  it('keeps the tab title under 64 characters and the description under 160', () => {
    const text = ratesPageText['ca-ab'];
    expect(text?.title.length).toBeLessThan(64);
    expect(text?.description.length).toBeLessThan(160);
  });
});

describe('the Newfoundland and Labrador rates page', () => {
  const newfoundlandSweep = () => {
    const found = fullHubCharts(['ca-nl']).provinces[0];
    if (!found) throw new Error('no sweep');
    return found;
  };

  const view = () => {
    const found = ratesPageView('ca-nl', newfoundlandSweep());
    if (!found) throw new Error('no view');
    return found;
  };

  const everyWord = () => [
    ...view().intro,
    ...view().howToRead,
    ...view().groups.flatMap((group) => group.notes.map((note) => note.words)),
    ...view().tables.flatMap((table) => [
      table.before ?? '',
      table.after ?? '',
      ...table.rows.flat(),
    ]),
  ];

  it('fills every figure from the sweep and leaves no brace behind', () => {
    expect(everyWord().length).toBeGreaterThan(20);
    for (const words of everyWord()) {
      expect(words).not.toMatch(/[{}]|undefined|NaN/);
    }
  });

  it('gives one decimal for every rate in the opening finding', () => {
    const [lead] = view().intro;
    expect(lead).toMatch(/\d+\.\d%/);
    expect(lead).not.toMatch(/\d+\.\d\d%/);
    expect(lead).toContain('7.6%');
    expect(lead).toContain('53.8%');
    expect(lead).toContain('44.4%');
  });

  it('says where the reduction starts and ends', () => {
    const text = everyWord().join(' ');
    expect(text).toContain('about $24,400 of salary');
    expect(text).toContain('$30,491');
    expect(text).not.toContain('not raised');
  });

  it('keeps the tab title under 64 characters, the full name in the heading', () => {
    const text = ratesPageText['ca-nl'];
    expect(text?.title).toBe(
      'Newfoundland and Labrador marginal and average tax rate, 2026',
    );
    expect(text?.heading).toBe(
      'Newfoundland and Labrador marginal and average tax rate by salary, 2026',
    );
    expect(text?.title.length).toBeLessThan(64);
    expect(text?.description.length).toBeLessThan(160);
  });

  it('types no dollar figure or cents figure in a note or a table cell', () => {
    const text = ratesPageText['ca-nl'];
    const words = [
      ...(text?.intro ?? []).map((note) => note.text),
      ...(text?.howToRead ?? []).map((note) => note.text),
      ...(text?.groups ?? []).flatMap((group) =>
        group.notes.map((note) => note.text),
      ),
      ...(text?.tables ?? []).flatMap((table) => [
        table.before?.text ?? '',
        table.after?.text ?? '',
        ...table.rows.flat(),
      ]),
    ];
    for (const line of words) {
      expect(line).not.toMatch(/\$\d|\d cents/);
    }
  });

  it('puts the last group heading just above the federal top bracket salary', () => {
    const groups = ratesPageText['ca-nl']?.groups ?? [];
    const last = groups[groups.length - 1]?.heading ?? '';
    const top = newfoundlandSweep().facts['fed_bracket_5_salary'] ?? '';
    const gap = subtractAmounts(last.replace(/\D/g, ''), top);
    expect(compareAmounts(gap, '0')).toBeGreaterThanOrEqual(0);
    expect(compareAmounts(gap, '1000')).toBeLessThan(0);
  });

  it('names a cause form for every note and links NL428', () => {
    for (const group of ratesPageText['ca-nl']?.groups ?? []) {
      for (const note of group.notes) {
        expect(note.forms.length, note.text).toBeGreaterThan(0);
      }
    }
    expect(causeChip('nl428').label).toBe('Form NL428');
    expect(causeChip('nl428').href).toBe('/forms/nl428/');
  });

  it('agrees with the engine: each bracket salary is within a dollar of the engine edge that moves the rate', () => {
    const { facts, edges } = newfoundlandSweep();
    for (const name of [
      'fed_bracket_2_salary',
      'fed_bracket_3_salary',
      'fed_bracket_4_salary',
      'fed_bracket_5_salary',
      'nl_bracket_2_salary',
      'nl_bracket_3_salary',
      'nl_bracket_4_salary',
      'nl_bracket_5_salary',
      'nl_bracket_6_salary',
    ]) {
      const salary = facts[name] ?? '';
      const within = (edgeSalary: string) => {
        const gap = subtractAmounts(edgeSalary, salary);
        return compareAmounts(gap.replace('-', ''), '1') <= 0;
      };
      const near = edges.some((edge) => within(edge[1]) || within(edge[2]));
      expect(near, name).toBe(true);
    }
  });

  it('lists eight provincial brackets, the last two past the chart', () => {
    const table = view().tables.find((t) => t.caption.includes('Newfoundland'));
    expect(table?.rows).toHaveLength(8);
    const [seventh, eighth] = table?.rows.slice(6) ?? [];
    expect(seventh?.[2]).toBe('$571,765 (past this chart)');
    expect(seventh?.[3]).toBe('54.3%');
    expect(eighth?.[2]).toBe('$1,142,402 (past this chart)');
    expect(eighth?.[3]).toBe('54.8%');
  });
});
