import { copyRules, everyString } from '../../test/copyRules';
import {
  longestSentence,
  pageOf,
  placeholdersIn,
  sectionOf,
  shownText,
} from '../../test/formText';

/** A section's paragraph, with each `{name}` shown as its figure. */
function paragraphOf(pageId: string, sectionId: string): string {
  const section = sectionOf(pageId, sectionId);
  return shownText(section, section.paragraph);
}

const ab428Wording = {
  income: {
    paragraph:
      'Taxable income is the part of your income that tax is charged on. This form does not work it out. It copies the number from the federal part of your return. Some things are taken off first, like part of your pension plan payments.',
    example:
      '{taken}, the extra part of your pension plan payments, is taken off first. That leaves a taxable income of {income}.',
  },
  brackets: {
    paragraph:
      "Alberta does not tax all of your income at one rate. It cuts your income into slices, called brackets, and each slice has its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice's rate on the rest of your income.",
    example:
      'Your income reaches the slice that starts at {start}. That slice is taxed at {rate}. The tax on the slices below it comes to {below}. The {above} of your income above {start} adds {added}. Alberta tax before credits: {tax}.',
  },
  credits: {
    paragraph:
      'A credit lowers your tax bill. The form starts with a list of amounts: the basic personal amount that everyone gets ({basic} in 2025), the main part of your pension plan payments, and your EI payments. It adds them up, then takes {rate} of the total. That is your discount.',
  },
  supplement: {
    paragraph:
      'If your credits are large, you can get an extra credit. A short worksheet works it out. It starts with the amounts added up earlier on the form and takes off any unused tuition amount. It then works out the credit on what is left, the same way the form did before. Credits for gifts to charity are not counted. The worksheet takes away a set amount ({set}). If your credit is less than that, you get nothing extra. If it is more, the extra credit is {rate} of the difference. We do not use tuition, so we skip that step.',
  },
};

describe('form page labels and copy', () => {
  it('ab428 names its supplement section "Alberta supplemental tax credit"', () => {
    const section = sectionOf('ab428', 'supplement');
    expect(section.heading).toMatch(/^Alberta supplemental tax credit$/i);
    expect(section.heading).not.toMatch(/extra credit/i);
  });

  it('ab428 supplement mentions the unused tuition amount', () => {
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

describe('ab428 copy', () => {
  it('income paragraph and example use the proposed wording', () => {
    const section = sectionOf('ab428', 'income');
    expect(section.paragraph).toBe(ab428Wording.income.paragraph);
    expect(section.example).toBe(ab428Wording.income.example);
  });

  it('brackets paragraph and example use the proposed wording', () => {
    const section = sectionOf('ab428', 'brackets');
    expect(section.paragraph).toBe(ab428Wording.brackets.paragraph);
    expect(section.example).toBe(ab428Wording.brackets.example);
  });

  it('credits paragraph uses the proposed wording', () => {
    const section = sectionOf('ab428', 'credits');
    expect(section.paragraph).toBe(ab428Wording.credits.paragraph);
  });

  it('supplement paragraph uses the proposed wording', () => {
    const section = sectionOf('ab428', 'supplement');
    expect(section.paragraph).toBe(ab428Wording.supplement.paragraph);
  });

  it('every placeholder in the proposed wording has a figure, and every figure is used', () => {
    const cases: Array<[string, string[]]> = [
      ['income', [ab428Wording.income.paragraph, ab428Wording.income.example]],
      [
        'brackets',
        [ab428Wording.brackets.paragraph, ab428Wording.brackets.example],
      ],
      [
        'credits',
        [ab428Wording.credits.paragraph, sectionOf('ab428', 'credits').example],
      ],
    ];
    for (const [id, texts] of cases) {
      const section = sectionOf('ab428', id);
      const used = new Set(placeholdersIn(...texts));
      expect([...used].sort(), id).toEqual(Object.keys(section.figures).sort());
    }
    const supplement = sectionOf('ab428', 'supplement');
    const usedInSupplement = new Set(
      placeholdersIn(ab428Wording.supplement.paragraph, supplement.example),
    );
    for (const name of usedInSupplement) {
      expect(supplement.figures[name], name).toBeDefined();
    }
    expect([...usedInSupplement].sort()).toEqual(
      Object.keys(supplement.figures).sort(),
    );
  });

  it('ab428 changed sections keep every sentence to 40 words or fewer', () => {
    for (const id of ['income', 'brackets', 'credits', 'supplement']) {
      const section = sectionOf('ab428', id);
      expect(longestSentence(section.paragraph), id).toBeLessThanOrEqual(40);
      expect(longestSentence(section.example), id).toBeLessThanOrEqual(40);
    }
  });

  it('supplement says unused tuition is taken off first', () => {
    const text = paragraphOf('ab428', 'supplement');
    expect(text).toMatch(/takes off any unused tuition amount/i);
    expect(text).toMatch(/starts with the amounts added up earlier/i);
  });

  it('supplement says credits for gifts to charity are not counted', () => {
    expect(paragraphOf('ab428', 'supplement')).toMatch(
      /credits for gifts to charity are not counted/i,
    );
  });

  it('supplement no longer uses the old confusing sentences', () => {
    const text = paragraphOf('ab428', 'supplement');
    expect(text).not.toContain('leaves out your tuition amount');
    expect(text).not.toContain('Line 2 of the printed worksheet');
  });
});
