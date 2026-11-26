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
    expect(strings.comparePage.heading(2026)).toBe(
      'Compare take-home pay and tax across provinces, 2026',
    );
    expect(strings.comparePage.title(2026)).toBe(
      'Compare take-home pay and tax across provinces, 2026',
    );
    expect(strings.comparePage.intro).toBe(
      "Pick a salary and see how the provinces compare. The provinces are always listed with the lowest tax and contributions first, whichever of the three figures you compare. Every bar is this site's own estimate for a single person whose only income is a salary.",
    );
    expect(copy.table.note).toContain(
      'Tax and contributions is income tax, pension plan payments and Employment Insurance, and in Québec Québec Parental Insurance Plan premiums, added together. It is your salary minus your take-home pay. The average tax rate is that amount divided by your salary.',
    );
    expect(copy.toggleLabel).toBe('Compare by');
    expect(copy.measures).toEqual({
      takeHome: 'Take-home pay',
      takenOff: 'Tax and contributions',
      averageRate: 'Average tax rate',
    });
    expect(copy.measuresPhone).toEqual({
      takeHome: 'Take-home pay',
      takenOff: 'Tax and payments',
      averageRate: 'Average tax rate',
    });
    expect(copy.measureNotes.takeHome).toBe(
      'Your salary minus income tax, pension plan payments and Employment Insurance. Pension plan payments are Canada Pension Plan payments, or Québec Pension Plan payments in Québec, where Québec Parental Insurance Plan premiums and the drug insurance premium are taken off too. Tax cuts count, such as the Ontario LIFT Credit and the Québec abatement.',
    );
    expect(copy.measureNotes.takenOff).toBe(
      'Income tax, pension plan payments and Employment Insurance added together, which is your salary minus your take-home pay. In Québec the pension plan is the Québec Pension Plan, and Québec Parental Insurance Plan premiums are added too. Income tax includes the Ontario Health Premium in Ontario. In Québec it includes the prescription drug insurance premium, which we assume you pay because you have no drug plan at work, and the federal tax is after the Québec abatement.',
    );
    expect(copy.measureNotes.averageRate).toBe(
      'Tax and contributions divided by your salary.',
    );
    expect(copy.creditsNote).toBe(
      'Credits paid to you when you file are not counted.',
    );
    expect(copy.caption('$70,000', 2026)).toBe(
      'Bars are for a $70,000 salary in 2026, lowest tax and contributions first. Provinces with the same amount are listed in the usual order.',
    );
    expect(copy.tied).toBe(
      'At this salary no province takes any tax or contributions, so the provinces are not ranked.',
    );
    expect(copy.reordered('$30,000')).toBe(
      'Provinces re-ordered by tax and contributions, lowest first, for a $30,000 salary.',
    );
    expect(copy.reorderedTied('$1,000')).toBe(
      'No province takes any tax or contributions at $1,000, so the provinces are not ranked.',
    );
    expect(copy.chartLabel('Take-home pay', '$70,000', copy.tableToggle)).toBe(
      'Bar chart: Take-home pay for a $70,000 salary, by province. These figures, and every other salary, are in the table under “Show the figures as a table”.',
    );
  });

  it('is the approved wording of the salary controls, word for word', () => {
    expect(copy.salaryLabel).toBe('Salary a year');
    expect(copy.salaryValueText('$70,000')).toBe('$70,000 a year');
    expect(copy.hint).toBe(
      'Drag the slider, or use the arrow keys, to pick a salary. The bars and the order of the list change as you drag.',
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
      copy.chartLabel('Take-home pay', '$70,000', copy.tableToggle),
      copy.table.note,
      copy.table.caption(2026, 300),
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
