import { fullHubCharts } from '../test/hubNotesData';
import {
  causeChip,
  creditsLinked,
  ratesPageText,
  ratesPageView,
  ratesProvinces,
} from './ratesPage';
import { subtractAmounts } from '../money/amounts';
import { compareAmounts } from '../money/scale';
import { contentPath, METHODOLOGY_SLUG, ratesSlug } from './siteLinks';

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
    expect(ratesProvinces()).toEqual([
      'ca-on',
      'ca-ab',
      'ca-bc',
      'ca-mb',
      'ca-sk',
      'ca-nl',
      'ca-nb',
      'ca-ns',
      'ca-pe',
      'ca-qc',
    ]);
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
      'from about 7.6% once you pay into the Canada Pension Plan (from $3,500) to 48% above $371,347.',
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
    expect(top).toContain('straight at 48%');
    expect(top).toContain('rate, 15%, starts at a taxable income of $370,220');
    expect(top).toContain('you keep 52%');
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
  });

  it('gives one decimal for every computed rate in the opening finding', () => {
    const view = ratesPageView('ca-qc', quebec());
    expect(view?.intro[0]).toMatch(/about 8% once/);
    expect(view?.intro[0]).toMatch(/to 47% at/);
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

describe('the Nova Scotia rates page', () => {
  const novaScotiaSweep = () => {
    const found = fullHubCharts(['ca-ns']).provinces[0];
    if (!found) throw new Error('no sweep');
    return found;
  };

  const view = () => {
    const found = ratesPageView('ca-ns', novaScotiaSweep());
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
    expect(lead).toContain('7.6%');
    expect(lead).toContain('54%');
    expect(lead).toContain('$15,901 to $21,177');
    expect(lead).toContain('47.1%');
    expect(lead).not.toMatch(/\d+\.\d\d%/);
  });

  it('says where the reduction starts, where provincial tax shows and where it ends', () => {
    const text = everyWord().join(' ');
    expect(text).toContain('about $15,116 of salary');
    expect(text).toContain('about 8.1% for Nova Scotia tax');
    expect(text).toContain('about $116 higher at an income of $15,000');
    expect(text).toContain('an adjusted family income of $21,000');
    expect(text).toContain('about $21,177 of salary');
  });

  it('writes the three rates of the first provincial row and the five brackets', () => {
    const table = view().tables.find((t) => t.caption.includes('Nova Scotia'));
    expect(table?.rows).toHaveLength(5);
    expect(table?.rows[0]).toEqual([
      '$0',
      '8.79%',
      'tax starts at about $15,901',
      '20.7%, then 33.6% from $19,201, then 28.6% from $21,177',
    ]);
    expect(table?.rows[1]).toEqual(['$30,995', '14.95%', '$31,273', '34.7%']);
    expect(table?.rows[4]).toEqual(['$157,124', '21%', '$158,251', '47.0%']);
  });

  it('keeps the tab title under 64 characters, the full name in the heading', () => {
    const text = ratesPageText['ca-ns'];
    expect(text?.title).toBe(
      'Nova Scotia marginal and average tax rate by salary, 2026',
    );
    expect(text?.heading).toBe(
      'Nova Scotia marginal and average tax rate by salary, 2026',
    );
    expect(text?.title.length).toBeLessThan(64);
    expect(text?.description.length).toBeLessThan(160);
  });

  it('types no dollar figure or cents figure in a note or a table cell', () => {
    const text = ratesPageText['ca-ns'];
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
    const groups = ratesPageText['ca-ns']?.groups ?? [];
    const last = groups[groups.length - 1]?.heading ?? '';
    const top = novaScotiaSweep().facts['fed_bracket_5_salary'] ?? '';
    const gap = subtractAmounts(last.replace(/\D/g, ''), top);
    expect(compareAmounts(gap, '0')).toBeGreaterThanOrEqual(0);
    expect(compareAmounts(gap, '1000')).toBeLessThan(0);
  });

  it('names a cause form for every note and links NS428', () => {
    for (const group of ratesPageText['ca-ns']?.groups ?? []) {
      for (const note of group.notes) {
        expect(note.forms.length, note.text).toBeGreaterThan(0);
      }
    }
    expect(causeChip('ns428').label).toBe('Form NS428');
    expect(causeChip('ns428').href).toBe('/forms/ns428/');
  });

  it('agrees with the engine: each bracket salary is within a dollar of the engine edge that moves the rate', () => {
    const { facts, edges } = novaScotiaSweep();
    for (const name of [
      'fed_bracket_2_salary',
      'fed_bracket_3_salary',
      'fed_bracket_4_salary',
      'fed_bracket_5_salary',
      'ns_bracket_2_salary',
      'ns_bracket_3_salary',
      'ns_bracket_4_salary',
      'ns_bracket_5_salary',
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
});

const mbSweep = () => {
  const found = fullHubCharts(['ca-mb']).provinces[0];
  if (!found) throw new Error('no sweep');
  return found;
};

const mbView = () => {
  const found = ratesPageView('ca-mb', mbSweep());
  if (!found) throw new Error('no view');
  return found;
};

describe('the Manitoba rates page', () => {
  it('fills every figure and leaves no brace behind', () => {
    const page = mbView();
    const everyWord = [
      ...page.intro,
      ...page.howToRead,
      ...page.groups.flatMap((group) => group.notes.map((note) => note.words)),
      ...page.tables.flatMap((table) => [
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

  it('reads the peak and the top rate from the data: the peak is the highest marginal rate of the sweep, the top is the rate at the last salary', () => {
    const { points } = mbSweep();
    let highest = '0';
    for (const point of points) {
      // The $2,000 Employment Insurance band (100%) is a band of its own, left off the scale of the chart.
      if (compareAmounts(point[0], '3000') < 0) continue;
      if (compareAmounts(point[5], highest) > 0) highest = point[5];
    }
    // 51.3% is the highest rate (0.5125 to one decimal), 50.4% the rate from the end of the basic amount's shrinking up.
    expect(highest.startsWith('0.5125')).toBe(true);
    const intro = mbView().intro[0] ?? '';
    expect(intro).toContain('a peak of 51.3% between $259,609 and $401,127');
    expect(intro).toContain('then settles at 50.4%');
    expect(points[points.length - 1]?.[5]).toBe('0.504');
    expect(mbView().groups[4]?.notes[1]?.words).toContain('you keep 49.6%');
  });

  it('keeps every salary taken from a form threshold inside the engine edge it belongs to', () => {
    const { facts, edges } = mbSweep();
    const thresholds = [
      'mb_bracket_2_salary',
      'mb_bracket_3_salary',
      'mb_bpa_start_salary',
      'mb_bpa_end_salary',
      'ftb_end_salary',
      'fed_bracket_2_salary',
      'fed_bracket_3_salary',
      'fed_bracket_4_salary',
      'fed_bracket_5_salary',
      'cpp_ympe',
      'yampe',
      'ei_stop',
    ];
    for (const name of thresholds) {
      const salary = facts[name] ?? '';
      // The engine's edge: the last salary at the old rate (`moves`) to the first at the new one (`settled`); a derived
      // salary may sit on either side by a dollar (a threshold between two whole salaries).
      const near = edges.some(
        ([, moves, settled]) =>
          compareAmounts(salary, subtractAmounts(moves, '1')) >= 0 &&
          compareAmounts(salary, subtractAmounts(settled, '-1')) <= 0,
      );
      expect(near, `${name} ${salary}`).toBe(true);
    }
  });

  it('puts the start of Manitoba tax and of federal tax at the engine’s edges', () => {
    const [mbStart, fedStart] = ['mbStartSalary', 'fedStartSalary'].map(
      (name) => {
        const spec = ratesPageText['ca-mb']?.groups
          .flatMap((group) => group.notes)
          .find((note) => note.figures?.[name] !== undefined)?.figures?.[name];
        return spec;
      },
    );
    expect(mbStart).toBe('o:17000');
    expect(fedStart).toBe('o:19000');
    const text = mbView()
      .groups[0]?.notes.map((note) => note.words)
      .join(' ');
    expect(text).toContain('From about $17,402 the rate is 18.5%');
    expect(text).toContain('From about $19,200 the rate is 31.5%');
  });

  it('names a cause form for every note and a Manitoba page for the forms that are its own', () => {
    for (const group of ratesPageText['ca-mb']?.groups ?? []) {
      for (const note of group.notes) {
        expect(note.forms.length, note.text).toBeGreaterThan(0);
      }
    }
    const chips = mbView().groups.flatMap((group) =>
      group.notes.flatMap((note) => note.causes),
    );
    expect(chips.some((chip) => chip.label === 'Form MB428')).toBe(true);
    expect(chips.some((chip) => chip.href === '/forms/mb428-a/')).toBe(true);
  });

  it('types no dollar figure or cents figure in a note or a table cell', () => {
    const text = ratesPageText['ca-mb'];
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
    for (const line of words) expect(line).not.toMatch(/\$\d|\d cents/);
    expect(text?.title.length).toBeLessThan(64);
    expect(text?.description.length).toBeLessThan(160);
  });
});

describe('the British Columbia rates page', () => {
  const bcSweep = () => {
    const found = fullHubCharts(['ca-bc']).provinces[0];
    if (!found) throw new Error('no sweep');
    return found;
  };

  const words = () => {
    const view = ratesPageView('ca-bc', bcSweep());
    if (!view) throw new Error('no view');
    return [
      ...view.intro,
      ...view.howToRead,
      ...view.groups.flatMap((group) => group.notes.map((note) => note.words)),
      ...view.tables.flatMap((table) => [
        table.before ?? '',
        table.after ?? '',
        ...table.rows.flat(),
      ]),
    ];
  };

  it('fills every figure from the sweep and leaves no brace behind', () => {
    expect(words().length).toBeGreaterThan(30);
    for (const line of words()) {
      expect(line).not.toMatch(/[{}]|undefined|NaN/);
    }
  });

  it('reads the reviewed figures: the straight line, the reduction and every edge', () => {
    const all = words().join('\n');
    // The finding at the top: where the line turns straight, to the dollar, is not rounded to $270,000.
    expect(all).toContain('to 53.5% above $266,672');
    expect(all).toContain('from $26,753 to $45,371 while the BC tax reduction');
    expect(all).toContain('to 43.9% at $500,000');
    expect(all).toContain(
      'about $25,793 of salary, by 3.56% of every dollar of net income above that, about 3.5 cents of each extra dollar of salary',
    );
    expect(all).toContain('about $223 higher at a net income of $25,570');
    expect(all).toContain('about $474 higher at a taxable income of $50,363');
    expect(all).toContain(
      '(a net income of $44,952), and the rate falls to 25.7%',
    );
    for (const [salary, rate] of [
      ['$50,837', '27.8%'],
      ['$59,079', '34.2%'],
      ['$101,855', '31%'],
      ['$116,775', '32.8%'],
      ['$118,172', '38.3%'],
      ['$141,557', '40.7%'],
      ['$182,567', '44%'],
      ['$191,532', '46.1%'],
      ['$259,609', '49.8%'],
    ] as const) {
      expect(all, salary).toContain(`From about ${salary} the rate is ${rate}`);
    }
  });

  it('prints the statutory rates with the digits the form prints', () => {
    const all = words().join('\n');
    for (const rate of [
      '5.60%',
      '7.70%',
      '10.50%',
      '12.29%',
      '14.70%',
      '16.80%',
      '20.50%',
    ]) {
      expect(all, rate).toContain(rate);
    }
  });

  it('gives one decimal for every computed rate in the opening finding', () => {
    const view = ratesPageView('ca-bc', bcSweep());
    expect(view?.intro[0]).toMatch(/\d+\.\d%/);
    expect(view?.intro[0]).not.toMatch(/\d+\.\d\d%/);
  });

  it('puts the BC tax reduction table and seven British Columbia brackets on the page', () => {
    const view = ratesPageView('ca-bc', bcSweep());
    const brackets = view?.tables.find((table) =>
      table.heading.startsWith('British Columbia brackets'),
    );
    expect(brackets?.rows).toHaveLength(7);
    expect(brackets?.rows[0]).toEqual([
      '$0',
      '5.60%',
      'tax starts at about $26,753',
      '29.2%, then 25.7% from $45,371',
    ]);
    expect(
      view?.tables.some((table) =>
        table.heading.startsWith('BC tax reduction'),
      ),
    ).toBe(true);
  });

  it('puts every derived bracket salary inside the engine edge it falls on', () => {
    // The salary of a form threshold is worked out from the pension deduction; the engine's own edges (found by
    // bisection) must hold it: the old rate holds to `moves`, and the new one has settled by `settled`.
    const { facts, edges } = bcSweep();
    const names = [
      ...[2, 3, 4, 5, 6, 7].map((n) => `bc_bracket_${n.toString()}_salary`),
      ...[2, 3, 4, 5].map((n) => `fed_bracket_${n.toString()}_salary`),
    ];
    for (const name of names) {
      const salary = facts[name] ?? '';
      const edge = edges.find(
        (found) =>
          compareAmounts(found[1], salary) <= 0 &&
          compareAmounts(salary, found[2]) <= 0,
      );
      expect(edge, name).toBeDefined();
    }
  });

  it('names a cause form for every note, links the BC428 page, and keeps the notes free of typed figures', () => {
    const text = ratesPageText['ca-bc'];
    for (const group of text?.groups ?? []) {
      for (const note of group.notes) {
        expect(note.forms.length, note.text).toBeGreaterThan(0);
        expect(note.text).not.toMatch(/\$\d|\d cents/);
      }
    }
    expect(causeChip('bc428').label).toBe('Form BC428');
    expect(causeChip('bc428').href).toBe('/forms/bc428/');
  });

  it('draws every change of the rate as a step: the next sample point after each edge is within $2 of it', () => {
    const { points, edges } = bcSweep();
    for (const [, moves] of edges) {
      const at = points.findIndex((point) => point[0] === `${moves}.00`);
      expect(at, moves).toBeGreaterThanOrEqual(0);
      const next = points[at + 1]?.[0] ?? '0';
      expect(
        compareAmounts(subtractAmounts(next, moves), '2'),
        `${moves} then ${next}`,
      ).toBeLessThanOrEqual(0);
    }
  });

  it('links the cause forms that have a page in this build', () => {
    for (const form of ['t1', 'bc428', 't2204', 'schedule8'] as const) {
      expect(causeChip(form).href, form).toMatch(/^\/forms\/[a-z0-9-]+\/$/);
    }
  });

  it('puts the last group heading at the salary the data says the top federal bracket starts at', () => {
    const groups = ratesPageText['ca-bc']?.groups ?? [];
    const last = groups[groups.length - 1]?.heading ?? '';
    const top = bcSweep().facts['fed_bracket_5_salary'] ?? '';
    const gap = subtractAmounts(last.replace(/\D/g, ''), top);
    expect(compareAmounts(gap, '0')).toBeGreaterThanOrEqual(0);
    expect(compareAmounts(gap, '1000')).toBeLessThan(0);
  });

  it('types no dollar figure or cents figure in a note or a table cell', () => {
    const text = ratesPageText['ca-bc'];
    const typed = [
      ...(text?.intro ?? []).map((note) => note.text),
      ...(text?.howToRead ?? []).map((note) => note.text),
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
    const text = ratesPageText['ca-bc'];
    expect(text?.title.length).toBeLessThan(64);
    expect(text?.description.length).toBeLessThan(160);
  });
});

describe('creditsLinked', () => {
  const phrase = 'credits paid to you when you file';
  const href = contentPath(METHODOLOGY_SLUG);

  it('links the phrase wherever it falls in a paragraph', () => {
    expect(creditsLinked(`Not counted: ${phrase} are left out.`)).toEqual([
      'Not counted: ',
      { label: phrase, href },
      ' are left out.',
    ]);
  });

  it('keeps the capital C of a sentence start in the link text', () => {
    expect(
      creditsLinked(`Credits paid to you when you file are not counted.`),
    ).toEqual([
      { label: 'Credits paid to you when you file', href },
      ' are not counted.',
    ]);
  });

  it('gives a paragraph without the phrase back as its words', () => {
    expect(creditsLinked('Nothing to link here.')).toEqual([
      'Nothing to link here.',
    ]);
  });

  it('finds the phrase in the basis of every province, so a rewording cannot drop the link', () => {
    for (const province of ratesProvinces()) {
      const found = fullHubCharts([province]).provinces[0];
      if (!found) continue;
      const view = ratesPageView(province, found);
      const basis = view?.intro.slice(1).map((words) => creditsLinked(words));
      expect(
        basis?.some((parts) => parts.some((part) => typeof part !== 'string')),
        province,
      ).toBe(true);
    }
  });
});

describe('the Ontario lead', () => {
  it('names exactly three spikes, as many as the sentence lists', () => {
    const facts = sweep().facts;
    expect(facts['ohp_spike_count']).toBe('3');
    expect(facts['ohp_step_count']).toBe('2');
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
    expect(all).toContain('33% at $85,000');
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

  it('draws every change of the rate as a step: the next sample point after each edge is within $2 of it', () => {
    const points = skSweep().points;
    for (const [, moves] of skSweep().edges) {
      const at = points.findIndex((point) => point[0] === `${moves}.00`);
      expect(at, moves).toBeGreaterThanOrEqual(0);
      const next = points[at + 1]?.[0] ?? '0';
      expect(
        compareAmounts(subtractAmounts(next, moves), '2'),
        `${moves} then ${next}`,
      ).toBeLessThanOrEqual(0);
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

describe('the Prince Edward Island rates page', () => {
  const peSweep = () => {
    const found = fullHubCharts(['ca-pe']).provinces[0];
    if (!found) throw new Error('no sweep');
    return found;
  };
  const view = () => {
    const found = ratesPageView('ca-pe', peSweep());
    if (!found) throw new Error('no view');
    return found;
  };

  it('fills every figure from the Prince Edward Island sweep and leaves no brace behind', () => {
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
    expect(view().intro[0]).toContain('to 53% above $259,609');
    expect(view().intro[0]).toContain('provincial tax starts at about $19,992');
    expect(view().intro[0]).toContain('46.2% at $500,000');
    expect(all).toContain('It is 20.5% from about $19,201');
    expect(all).toContain('From about $19,992 the rate is 29.3%');
    expect(all).toContain('From then the rate is 34.2%');
    expect(all).toContain('gone at about $29,915 of salary');
    expect(all).toContain('the rate falls to 29.3%');
    expect(all).toContain('From about $34,236 the rate is 33.2%');
    expect(all).toContain('From about $59,079 the rate is 39.7%');
    expect(all).toContain('From about $66,450 the rate is 42.8%');
    expect(all).toContain('From about $108,017 the rate is 38.1%');
    expect(all).toContain('From about $118,172 the rate is 43.6%');
    expect(all).toContain('From about $143,647 the rate is 45%');
    expect(all).toContain('From about $182,567 the rate is 48.3%');
    expect(all).toContain('From about $201,127 the rate is 49.3%');
    expect(view().howToRead.join(' ')).toContain('about $193 higher');
    expect(view().howToRead.join(' ')).toContain('about $307 higher');
  });

  it('has the Prince Edward Island and federal bracket rows, with tax starting at the engine’s salary', () => {
    const [federal, island] = view().tables;
    expect(federal?.rows[0]).toEqual([
      '$0',
      '14%',
      'tax starts at about $19,201',
      '20.5%',
    ]);
    expect(federal?.rows[1]).toEqual(['$58,523', '20.5%', '$59,079', '39.7%']);
    expect(federal?.rows[4]).toEqual(['$258,482', '33%', '$259,609', '53.0%']);
    expect(island?.rows[0]).toEqual([
      '$0',
      '9.5%',
      'tax starts at about $19,992',
      '29.3%, then 34.2% from $22,844, then 29.3% from $29,915',
    ]);
    expect(island?.rows[1]).toEqual(['$33,928', '13.47%', '$34,236', '33.2%']);
    expect(island?.rows[5]).toEqual(['$200,000', '20%', '$201,127', '49.3%']);
    expect(island?.rows).toHaveLength(6);
  });

  it('names a cause form for every note and links the Prince Edward Island form', () => {
    for (const group of ratesPageText['ca-pe']?.groups ?? []) {
      for (const n of group.notes)
        expect(n.forms.length, n.text).toBeGreaterThan(0);
    }
    expect(causeChip('pe428').href).toBe('/forms/pe428/');
    expect(causeChip('pe428').label).toBe('Form PE428');
  });

  it('puts each bracket salary derived from its taxable income where the engine’s own search finds the rate change', () => {
    const { facts, edges } = peSweep();
    const names = [
      'fed_bracket_2_salary',
      'fed_bracket_3_salary',
      'fed_bracket_4_salary',
      'fed_bracket_5_salary',
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

  it('draws every change of the rate as a step: the next sample point after each edge is within $2 of it', () => {
    const points = peSweep().points;
    for (const [, moves] of peSweep().edges) {
      const at = points.findIndex((point) => point[0] === `${moves}.00`);
      expect(at, moves).toBeGreaterThanOrEqual(0);
      const next = points[at + 1]?.[0] ?? '0';
      expect(
        compareAmounts(subtractAmounts(next, moves), '2'),
        `${moves} then ${next}`,
      ).toBeLessThanOrEqual(0);
    }
  });

  it('puts the last group heading at the salary the data says the top bracket starts at', () => {
    const groups = ratesPageText['ca-pe']?.groups ?? [];
    const last = groups[groups.length - 1]?.heading ?? '';
    const top = peSweep().facts['fed_bracket_5_salary'] ?? '';
    const gap = subtractAmounts(last.replace(/\D/g, ''), top);
    expect(compareAmounts(gap, '0')).toBeGreaterThanOrEqual(0);
    expect(compareAmounts(gap, '1000')).toBeLessThan(0);
  });

  it('types no dollar or cents figure in a note or a table cell', () => {
    const text = ratesPageText['ca-pe'];
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

describe('the New Brunswick rates page', () => {
  const newBrunswickSweep = () => {
    const found = fullHubCharts(['ca-nb']).provinces[0];
    if (!found) throw new Error('no sweep');
    return found;
  };

  const view = () => {
    const found = ratesPageView('ca-nb', newBrunswickSweep());
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

  it('gives the lead its figures to one decimal, from the engine', () => {
    const [lead] = view().intro;
    expect(lead).toContain('about 7.6%');
    expect(lead).toContain('from $3,500');
    expect(lead).toContain('52.5% above $259,609');
    expect(lead).toContain('from $23,362 to $49,109');
    expect(lead).toContain('45.1% at $500,000');
  });

  it('says the reduction starts, shows provincial tax and ends at the edges the engine found', () => {
    const notes = view().groups.flatMap((group) =>
      group.notes.map((note) => note.words),
    );
    const text = notes.join(' ');
    expect(text).toContain('by up to $802 for a single person');
    expect(text).toContain(
      'starts to shrink at $21,920, about $22,106 of salary',
    );
    expect(text).toContain('Until about $23,362');
    expect(text).toContain('the rate is 32.2%');
    expect(text).toContain('plus about 8.7% for New Brunswick tax (9.4%');
    expect(text).toContain(
      'gone at about $49,109 of salary (a net income of $48,653)',
    );
    expect(text).toContain('the rate falls to 29.2%');
    expect(text).toContain('From about $52,826 the rate is 33.8%');
  });

  it('prints the first whole salary in the tables and "about" in the words', () => {
    const federal = view().tables.find(
      (t) => t.caption === 'Federal brackets, 2026',
    );
    expect(federal?.rows[0]).toEqual([
      '$0',
      '14%',
      'tax begins at $19,201',
      '20.5%',
    ]);
    const table = view().tables.find((t) =>
      t.caption.includes('New Brunswick'),
    );
    expect(table?.rows).toEqual([
      [
        '$0',
        '9.4%',
        'tax starts at about $23,362',
        '32.2%, then 29.2% from $49,110',
      ],
      ['$52,333', '14%', '$52,827', '33.8%'],
      ['$104,666', '16%', '$105,793', '36.5%'],
      ['$193,861', '19.5%', '$194,988', '48.8%'],
    ]);
  });

  it('shows the pension deduction shifts of the form thresholds', () => {
    const second = view().howToRead[1] ?? '';
    expect(second).toContain('about $186 higher at an income of $21,920');
    expect(second).toContain(
      'about $493 higher at a taxable income of $52,333',
    );
  });

  it('keeps the tab title under 64 characters, the full name in the heading', () => {
    const text = ratesPageText['ca-nb'];
    expect(text?.title).toBe(
      'New Brunswick marginal and average tax rate by salary, 2026',
    );
    expect(text?.title.length).toBeLessThan(64);
    expect(text?.description.length).toBeLessThan(160);
  });

  it('types no dollar figure or cents figure in a note or a table cell', () => {
    const text = ratesPageText['ca-nb'];
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
    const groups = ratesPageText['ca-nb']?.groups ?? [];
    const last = groups[groups.length - 1]?.heading ?? '';
    const top = newBrunswickSweep().facts['fed_bracket_5_salary'] ?? '';
    const gap = subtractAmounts(last.replace(/\D/g, ''), top);
    expect(compareAmounts(gap, '0')).toBeGreaterThanOrEqual(0);
    expect(compareAmounts(gap, '1000')).toBeLessThan(0);
  });

  it('names a cause form for every note and links NB428', () => {
    for (const group of ratesPageText['ca-nb']?.groups ?? []) {
      for (const note of group.notes) {
        expect(note.forms.length, note.text).toBeGreaterThan(0);
      }
    }
    expect(causeChip('nb428').label).toBe('Form NB428');
    expect(causeChip('nb428').href).toBe('/forms/nb428/');
  });

  it('agrees with the engine: each bracket salary is within a dollar of the engine edge that moves the rate', () => {
    const { facts, edges } = newBrunswickSweep();
    for (const name of [
      'fed_bracket_2_salary',
      'fed_bracket_3_salary',
      'fed_bracket_4_salary',
      'fed_bracket_5_salary',
      'nb_bracket_2_salary',
      'nb_bracket_3_salary',
      'nb_bracket_4_salary',
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
});
