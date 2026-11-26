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
    expect(ratesProvinces()).toEqual(['ca-on', 'ca-ab', 'ca-sk', 'ca-qc']);
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

describe('the Québec rates page', () => {
  const quebec = () => {
    const found = fullHubCharts(['ca-qc']).provinces[0];
    if (!found) throw new Error('no sweep');
    return found;
  };
  const text = ratesPageText['ca-qc'];

  it('fills every figure from the sweep and leaves no brace behind', () => {
    const view = ratesPageView('ca-qc', quebec());
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
    expect(everyWord.length).toBeGreaterThan(30);
    for (const words of everyWord) {
      expect(words).not.toMatch(/[{}]|undefined|NaN/);
      // The accent is on every Québec the page shows; the name is never typed without it.
      expect(words).not.toMatch(/Quebec/);
      expect(words).not.toMatch(/Canada Pension Plan|CPP/);
    }
  });

  it('says what the copy thread reviewed at the steps that matter', () => {
    const view = ratesPageView('ca-qc', quebec());
    const notes = view?.groups.flatMap((g) => g.notes.map((n) => n.words));
    const joined = notes?.join('\n') ?? '';
    // Employment Insurance at Québec's rate and the full amount of the $2,000 band computed from it.
    expect(joined).toContain('Employment Insurance at 1.30%');
    expect(joined).toContain('until it reaches about $26.34');
    expect(joined).toContain('at most $895.70 a year');
    expect(joined).toContain('Employment Insurance 100 cents plus QPIP');
    expect(view?.intro[0]).toMatch(/to 53\.3% above \$259,609/);
    expect(view?.intro[2]).toContain('$777.50');
  });

  it('gives one decimal for every computed rate in the opening finding', () => {
    const view = ratesPageView('ca-qc', quebec());
    expect(view?.intro[0]).toMatch(/about 8\.0% once/);
    expect(view?.intro[0]).toMatch(/to 47\.0% at/);
  });

  it('names a cause form for every note and links the ones that have a page', () => {
    for (const group of text?.groups ?? []) {
      for (const note of group.notes) {
        expect(note.forms.length, note.text).toBeGreaterThan(0);
      }
    }
    for (const form of [
      'tp1',
      'scheduleU',
      'scheduleK',
      'workChart401',
    ] as const) {
      expect(causeChip(form).href, form).toMatch(/^\/forms\/[a-z0-9-]+\/$/);
    }
    expect(causeChip('workChart201').label).toBe('Work Chart 201');
  });

  it('types no dollar figure or cents figure in a note or a table cell', () => {
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

  it('puts the last group heading at the salary the data says the top bracket starts at', () => {
    const groups = text?.groups ?? [];
    const last = groups[groups.length - 1]?.heading ?? '';
    const top = quebec().facts['fed_bracket_5_salary'] ?? '';
    const gap = subtractAmounts(last.replace(/\D/g, ''), top);
    expect(compareAmounts(gap, '0')).toBeGreaterThanOrEqual(0);
    expect(compareAmounts(gap, '1000')).toBeLessThan(0);
  });

  it('agrees with the engine on every salary worked out from a form threshold', () => {
    // Each salary the build works out from a taxable income (a fact) is the first whole salary of an edge the engine found by
    // bisection, or one dollar below it where the engine reads the wrong rate at the exact threshold (74,600 and 259,609).
    const { facts, edges } = quebec();
    const names = [
      'fed_bracket_2_salary',
      'fed_bracket_3_salary',
      'fed_bracket_4_salary',
      'fed_bracket_5_salary',
      'qc_bracket_2_salary',
      'qc_bracket_3_salary',
      'qc_bracket_4_salary',
      'drug_start_salary',
      'drug_step_salary',
      'drug_max_salary',
    ];
    for (const name of names) {
      const salary = facts[name] ?? '';
      const near = edges.find(
        (edge) =>
          compareAmounts(subtractAmounts(edge[2], salary), '0') >= 0 &&
          compareAmounts(subtractAmounts(edge[2], salary), '2') < 0,
      );
      expect(near, name).toBeDefined();
    }
  });

  it('keeps the title under 64 characters and the description under 160', () => {
    expect(text?.title.length).toBeLessThan(64);
    expect(text?.description.length).toBeLessThan(160);
  });
});

describe('the Saskatchewan rates page', () => {
  const skSweep = () => {
    const found = fullHubCharts(['ca-sk']).provinces[0];
    if (!found) throw new Error('no sweep');
    return found;
  };
  const view = () => {
    const found = ratesPageView('ca-sk', skSweep());
    if (!found) throw new Error('no view');
    return found;
  };

  it('fills every figure from the Saskatchewan sweep and leaves no brace behind', () => {
    const found = view();
    const everyWord = [
      ...found.intro,
      ...found.howToRead,
      ...found.groups.flatMap((group) => group.notes.map((n) => n.words)),
      ...found.tables.flatMap((table) => [
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

  it('gives the engine’s salaries and one-decimal rates at each step', () => {
    const notes = view().groups.flatMap((group) =>
      group.notes.map((n) => n.words),
    );
    const all = notes.join('\n');
    expect(view().intro[0]).toContain('from about 7.6%');
    expect(view().intro[0]).toContain('to 47.5% above $259,609');
    expect(view().intro[0]).toContain('41.4% at $500,000');
    expect(all).toContain('From about $21,828 the rate is 30.2%');
    expect(all).toContain('From about $55,048 the rate is 32.2%');
    expect(all).toContain('From about $59,079 the rate is 38.6%');
    expect(all).toContain('falls to 37.4%');
    expect(all).toContain('35.7%');
    expect(all).toContain('33.0% at $85,000');
    expect(all).toContain('From about $118,172 the rate is 38.5%');
    expect(all).toContain('From about $156,932 the rate is 40.5%');
    expect(all).toContain('From about $182,567 the rate is 43.8%');
  });

  it('has the Saskatchewan and federal bracket rows, with tax starting at the engine’s salary', () => {
    const [federal, saskatchewan] = view().tables;
    expect(federal?.rows[1]).toEqual(['$58,523', '20.5%', '$59,079', '38.6%']);
    expect(federal?.rows[4]).toEqual(['$258,482', '33%', '$259,609', '47.5%']);
    expect(saskatchewan?.rows[0]).toEqual([
      '$0',
      '10.5%',
      'tax starts at about $21,828',
      '30.2%',
    ]);
    expect(saskatchewan?.rows[2]).toEqual([
      '$155,805',
      '14.5%',
      '$156,932',
      '40.5%',
    ]);
  });

  it('names a cause form for every note and links the Saskatchewan form', () => {
    for (const group of ratesPageText['ca-sk']?.groups ?? []) {
      for (const n of group.notes)
        expect(n.forms.length, n.text).toBeGreaterThan(0);
    }
    expect(causeChip('sk428').href).toBe('/forms/sk428/');
    expect(causeChip('sk428').label).toBe('Form SK428');
  });

  it('puts each bracket salary derived from its taxable income where the engine’s own search finds the rate change', () => {
    const { facts, edges } = skSweep();
    const names = [
      'fed_bracket_2_salary',
      'fed_bracket_3_salary',
      'fed_bracket_4_salary',
      'fed_bracket_5_salary',
      'sk_bracket_2_salary',
      'sk_bracket_3_salary',
    ];
    for (const name of names) {
      const salary = facts[name] ?? '';
      // An edge is [sweep salary below, last salary at the old rate, first salary settled at the new one, rate]:
      // the derived salary is the first whole dollar past the threshold, so it lies inside that window.
      const near = edges.filter(
        (edge) =>
          compareAmounts(edge[1], salary) <= 0 &&
          compareAmounts(salary, edge[2]) <= 0,
      );
      expect(near.length, name).toBe(1);
    }
  });

  it('puts the last group heading at the salary the data says the top bracket starts at', () => {
    const groups = ratesPageText['ca-sk']?.groups ?? [];
    const last = groups[groups.length - 1]?.heading ?? '';
    const top = skSweep().facts['fed_bracket_5_salary'] ?? '';
    const gap = subtractAmounts(last.replace(/\D/g, ''), top);
    expect(compareAmounts(gap, '0')).toBeGreaterThanOrEqual(0);
    expect(compareAmounts(gap, '1000')).toBeLessThan(0);
  });

  it('types no dollar or cents figure in a note or a table cell', () => {
    const text = ratesPageText['ca-sk'];
    const lines = [
      ...(text?.intro ?? []).map((n) => n.text),
      ...(text?.howToRead ?? []).map((n) => n.text),
      ...(text?.groups ?? []).flatMap((g) => g.notes.map((n) => n.text)),
      ...(text?.tables ?? []).flatMap((t) => [
        t.before?.text ?? '',
        t.after?.text ?? '',
        ...t.rows.flat(),
      ]),
    ];
    for (const line of lines) expect(line).not.toMatch(/\$\d|\d cents/);
    expect(text?.title.length).toBeLessThan(64);
    expect(text?.description.length).toBeLessThan(160);
  });
});
