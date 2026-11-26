import { fullHubCharts } from '../test/hubNotesData';
import { causeChip, ratesPageText, ratesPageView } from './ratesPage';
import { subtractAmounts } from '../money/amounts';
import { compareAmounts } from '../money/scale';

const sweep = () => {
  const found = fullHubCharts(['ca-nl']).provinces[0];
  if (!found) throw new Error('no sweep');
  return found;
};

const view = () => {
  const found = ratesPageView('ca-nl', sweep());
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

describe('the Newfoundland and Labrador rates page', () => {
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

  it('says where the reduction band is and where it would be if the amounts were not raised', () => {
    const text = everyWord().join(' ');
    expect(text).toContain('about $24,400 of salary');
    expect(text).toContain('$30,491');
    expect(text).toContain('about $24,878 and $30,429');
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
    const top = sweep().facts['fed_bracket_5_salary'] ?? '';
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
    const { facts, edges } = sweep();
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
