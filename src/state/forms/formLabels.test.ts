import { copyRules, everyString } from '../../test/copyRules';
import { pageOf, sectionOf, shownText } from '../../test/formText';

/** A section's paragraph, with each `{name}` shown as its figure. */
function paragraphOf(pageId: string, sectionId: string): string {
  const section = sectionOf(pageId, sectionId);
  return shownText(section, section.paragraph);
}

describe('form page labels and copy', () => {
  it('ab428 names its supplement section "Alberta supplemental tax credit"', () => {
    const section = sectionOf('ab428', 'supplement');
    expect(section.heading).toMatch(/^Alberta supplemental tax credit$/i);
    expect(section.heading).not.toMatch(/extra credit/i);
  });

  it('ab428 supplement says tuition is not counted in the credit total', () => {
    expect(paragraphOf('ab428', 'supplement')).toMatch(/tuition/i);
  });

  it('on428 credits says "main part of your pension plan payments"', () => {
    const text = paragraphOf('on428', 'credits');
    expect(text).toMatch(/main part of your pension plan payments/i);
    expect(text).not.toMatch(/the pension plan and EI payments/i);
  });

  it('t1-income deductions names line 22215 and says 23300 is the total', () => {
    const text = paragraphOf('t1-income', 'deductions');
    expect(text).toMatch(/22215/);
    expect(text).toMatch(/23300/);
    expect(text).toMatch(/total/i);
  });

  it('t1-income deductions label lists both 22215 and 23300', () => {
    const { lines } = sectionOf('t1-income', 'deductions');
    expect(lines).toMatch(/22215/);
    expect(lines).toMatch(/23300/);
    expect(lines).toMatch(/^Lines? [A-Z\d]/);
  });

  it('schedule-8 on-return mentions lines 30800 and 22215', () => {
    const text = paragraphOf('schedule-8', 'on-return');
    expect(text).toMatch(/30800/);
    expect(text).toMatch(/22215/);
  });

  it('t4 pension mentions box 16A', () => {
    expect(paragraphOf('t4', 'pension')).toMatch(/16A/);
  });

  it('t1-tax after-credits says "basic federal tax"', () => {
    const text = paragraphOf('t1-tax', 'after-credits');
    expect(text).toMatch(/basic federal tax/i);
    expect(text).not.toMatch(/is your federal tax\.?\s*$/i);
  });

  it('bc428 reduction says the reduction is zero once nothing is left', () => {
    const text = paragraphOf('bc428', 'reduction');
    expect(text).toMatch(/net income/i);
    expect(text).toMatch(/If nothing is left, the reduction is zero/i);
    expect(text).toMatch(/the higher your income, the smaller the reduction/i);
    expect(text).not.toMatch(/bigger than the starting amount/i);
  });

  describe.each([
    'ab428',
    'bc428',
    'on428',
    'schedule-8',
    't1-income',
    't1-tax',
    't4',
  ])('the %s page', (id) => {
    it.each(copyRules)('holds no %s in any field', (_what, pattern) => {
      expect(everyString(pageOf(id)).join('\n')).not.toMatch(pattern);
    });
  });
});
