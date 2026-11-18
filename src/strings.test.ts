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

  it('words the taken-off help verbatim and short', () => {
    const takenOff = strings.answer.takenOff;
    expect(takenOff.name).toBe('Taken off (tax and contributions)');
    expect(takenOff.help).toBe(
      'Income tax, Canada Pension Plan and Employment Insurance, less credits paid to you. A minus means you take home more than your salary.',
    );
    const total = strings.adapters.caFederal.totalTakenOff.help;
    expect(total).toBe(
      'Tax, Canada Pension Plan and Employment Insurance, less credits paid to you. Salary minus this is take-home. A minus means take-home is above salary.',
    );
    for (const text of [takenOff.help, total]) {
      expect(text.length).toBeLessThanOrEqual(150);
      expect(text).not.toMatch(/added together|CRA|checked/);
    }
  });
});
