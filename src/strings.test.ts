import { copyRules, everyString } from './test/copyRules';
import { longestSentence } from './test/formText';
import { strings } from './strings';

describe('the shared site copy', () => {
  it('words the form page notice in plain English, keeping year and salary', () => {
    expect(strings.formPage.notice(2025, '$70,000')).toBe(
      'Our calculator follows the published form. It is made for a single person whose only income is a salary. This page covers only the lines it uses, with figures from the 2025 form. Examples use a $70,000 salary. This is an estimate, not tax advice.',
    );
    expect(strings.formPage.notice(2026, '$55,000')).toContain(
      'figures from the 2026 form. Examples use a $55,000 salary.',
    );
  });

  it('spells out Employment Insurance in the intro', () => {
    expect(strings.intro).toBe(
      'Estimate your yearly take-home from a salary before tax. We work out the pension, Employment Insurance (EI) and income tax for a single person and show every step.',
    );
  });

  it('keeps every sentence of the notice and intro to 40 words or fewer', () => {
    for (const text of [
      strings.formPage.notice(2025, '$70,000'),
      strings.intro,
    ]) {
      expect(longestSentence(text), text).toBeLessThanOrEqual(40);
    }
  });
});

describe('the province comparison copy', () => {
  const copy = strings.hubCharts.comparison;

  it('is the approved wording, word for word', () => {
    expect(copy.heading).toBe('Compare provinces at one salary');
    expect(copy.intro).toBe(
      "Pick a salary and see how the provinces compare. Every bar is the calculator's own estimate for a single person whose only income is a salary.",
    );
    expect(copy.toggleLabel).toBe('Compare by');
    expect(copy.measures).toEqual({
      takeHome: 'Take-home pay',
      incomeTax: 'Income tax',
      averageRate: 'Average income tax rate',
    });
    expect(copy.measureNotes).toEqual({
      takeHome:
        'Your salary minus income tax, pension plan payments and Employment Insurance, before any credits paid to you when you file.',
      incomeTax:
        'The federal and provincial income tax you owe for the year, before any credits paid to you.',
      averageRate:
        'Income tax divided by salary, before any credits paid to you.',
    });
    expect(copy.caption('$70,000', 2026)).toBe(
      'Bars are for a $70,000 salary in 2026, from highest to lowest.',
    );
    expect(copy.provisional(2026)).toBe('The 2026 figures are provisional.');
    expect(copy.chartLabel('Take-home pay', '$70,000')).toBe(
      'Bar chart: Take-home pay for a $70,000 salary, by province. The same figures are in the table below.',
    );
  });

  it('is the approved wording of the salary controls, word for word', () => {
    expect(copy.salaryLabel).toBe('Salary a year');
    expect(copy.salaryValueText('$70,000')).toBe('$70,000 a year');
    expect(copy.hint).toBe(
      'Drag the slider, or use the arrow keys, to pick a salary.',
    );
    expect(copy.stepNote).toBe(
      'The slider moves in steps of $1,000 up to $250,000, and $5,000 above that.',
    );
    expect(copy.typedLabel).toBe('Or type a salary');
    expect(copy.typedNote).toBe(
      'A salary you type is shown at the nearest point we have.',
    );
    expect(copy.salaryError('$1,000', '$500,000')).toBe(
      'Enter a salary from $1,000 to $500,000.',
    );
  });

  it('breaks no copy rule and keeps every sentence to 40 words or fewer', () => {
    const words = [
      ...everyString(copy),
      copy.caption('$70,000', 2026),
      copy.provisional(2026),
      copy.chartLabel('Take-home pay', '$70,000'),
      copy.salaryError('$1,000', '$500,000'),
    ];
    for (const text of words) {
      for (const [name, rule] of copyRules) {
        expect(text, name).not.toMatch(rule);
      }
      expect(longestSentence(text), text).toBeLessThanOrEqual(40);
    }
  });
});
