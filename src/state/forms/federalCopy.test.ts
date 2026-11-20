import { formPages } from '../formPages';
import {
  longestSentence,
  pageOf as page,
  sectionOf as section,
} from '../../test/formText';

const FEDERAL_IDS = ['t4', 't1', 'schedule-8', 't2204', 'schedule-6'];

const isFederal = (spec: ReturnType<typeof page>): boolean =>
  spec.federal === true;

/** Every field a visitor reads on a page: the description, intro, paragraphs and examples. */
function wordsOf(spec: ReturnType<typeof page>): string[] {
  return [
    spec.description,
    spec.intro,
    ...spec.sections.flatMap((s) => [s.paragraph, s.example]),
  ];
}

// The only ways Ontario may appear on a shared page: as a labelled example.
const LABELLED_ONTARIO = [
  /\bIn Ontario\b/g,
  /\bOntario's\b/g,
  /\bTake Ontario as the example\./g,
  /\bfederal tax plus Ontario tax\b/g,
];

function hasUnlabelledOntario(text: string): boolean {
  let rest = text;
  for (const label of LABELLED_ONTARIO) rest = rest.replace(label, '');
  return /Ontario/.test(rest);
}

describe('which pages are federal', () => {
  it('marks exactly the six federal pages', () => {
    expect(
      formPages
        .filter(isFederal)
        .map((spec) => spec.id)
        .sort(),
    ).toEqual([...FEDERAL_IDS].sort());
  });

  it.each(FEDERAL_IDS)('%s is marked federal', (id) => {
    expect(isFederal(page(id))).toBe(true);
  });

  it('leaves the other pages unmarked', () => {
    const others = formPages.filter((spec) => !FEDERAL_IDS.includes(spec.id));
    expect(others.length).toBeGreaterThan(0);
    for (const spec of others) {
      expect(isFederal(spec), spec.id).toBe(false);
    }
  });
});

describe('federal pages name Ontario only as a labelled example', () => {
  it.each(FEDERAL_IDS)('%s', (id) => {
    for (const text of wordsOf(page(id))) {
      expect(hasUnlabelledOntario(text), text).toBe(false);
    }
  });
});

describe('federal pages keep sentences to 40 words or fewer', () => {
  it.each(FEDERAL_IDS)('%s', (id) => {
    for (const text of wordsOf(page(id))) {
      expect(longestSentence(text), text).toBeLessThanOrEqual(40);
    }
  });
});

describe('t1-tax copy', () => {
  const spec = () => page('t1');

  it('does not say total tax in the description or intro', () => {
    expect(spec().description).not.toMatch(/total tax/i);
    expect(spec().intro).not.toMatch(/total tax/i);
  });

  it('says total payable in the description and intro', () => {
    expect(spec().description).toMatch(/total payable/i);
    expect(spec().intro).toMatch(/total payable/i);
  });

  it('says your provincial tax in the intro', () => {
    expect(spec().intro).toMatch(/your provincial tax/i);
  });

  it('titles the provincial section Your provincial tax', () => {
    expect(section('t1', 'provincial').heading).toBe('Your provincial tax');
  });

  it('says each province charges its own tax on its own form', () => {
    expect(section('t1', 'provincial').paragraph).toMatch(
      /each province charges its own tax on its own form/i,
    );
  });

  it("names Ontario's form as Form ON428 and line 42800 as the copy", () => {
    const { paragraph } = section('t1', 'provincial');
    expect(paragraph).toMatch(/Ontario's is Form ON428/);
    expect(paragraph).toMatch(/42800/);
  });

  it('gives the Ontario figure as a labelled example', () => {
    expect(section('t1', 'provincial').example).toBe(
      'In Ontario the provincial tax is {ontario}.',
    );
  });

  it('says your federal tax and your provincial tax in the balance paragraph', () => {
    expect(section('t1', 'balance').paragraph).toContain(
      'your federal tax and your provincial tax',
    );
  });

  it("opens the balance example with federal plus Ontario's provincial figure", () => {
    expect(section('t1', 'balance').example).toMatch(
      /^\{federal\} plus Ontario's \{ontario\} is a total payable of \{total\}/,
    );
  });
});

describe('t1-income taxable-income copy', () => {
  const { paragraph } = section('t1', 'taxable-income');

  it('says your federal tax and your provincial tax', () => {
    expect(paragraph).toContain('Your federal tax and your provincial tax');
  });

  it('does not say Ontario tax', () => {
    expect(paragraph).not.toMatch(/Ontario tax/);
  });
});

describe('t4 tax-deducted copy', () => {
  const { paragraph, example } = section('t4', 'tax-deducted');

  it('says the year tax is federal and provincial', () => {
    expect(paragraph).toMatch(/federal/i);
    expect(paragraph).toMatch(/provincial/i);
  });

  it('says the year tax depends on the province', () => {
    expect(paragraph).toMatch(/depends on[^.]*province/i);
  });

  it('takes Ontario as the example', () => {
    expect(example).toMatch(/^Take Ontario as the example\./);
    expect(example).toContain(
      'federal tax plus Ontario tax you owe for the year is {owed}',
    );
  });
});

describe('federal form page wording', () => {
  it('t4 pension paragraph', () => {
    expect(section('t4', 'pension').paragraph).toBe(
      'Box 16 shows what was taken off your pay for the Canada Pension Plan. It has two parts added together: a main part and an extra part. Box 16A shows a second, smaller payment. It only applies to pay above the main limit, so for most people it is blank. Box 26 shows the pay that pension plan payments are charged on. If box 26 is blank, use box 14. Two rates apply to the same pay: {rate} for the main part and {extraRate} for the extra part.',
    );
  });

  it('t4 tax-deducted paragraph', () => {
    expect(section('t4', 'tax-deducted').paragraph).toBe(
      'Your employer takes some income tax off each paycheque and sends it to the government. The slip shows the yearly total in the box called Income tax deducted. You copy it to line 43700 of your return, where it counts as tax you have already paid. Our calculator does not use it. Our number is the tax you owe for the whole year, not what your employer already took off. That is federal tax plus provincial tax, so it depends on which province you lived in on December 31.',
    );
  });

  it('t1-income total-income paragraph and example', () => {
    const { paragraph, example } = section('t1', 'total-income');
    expect(paragraph).toBe(
      'Total income is all the income you report for the year. For someone with only a salary, that is your pay. Your pay from your job goes on one line. Other work income goes on another. The form adds them together.',
    );
    expect(example).toBe(
      'Your pay plus other work income is {total}. Of that, {other} is other work income. Total income: {total}.',
    );
  });

  it('t1-income taxable-income paragraph', () => {
    expect(section('t1', 'taxable-income').paragraph).toBe(
      'Some people take off a few more amounts at this step. What is left is your taxable income, and it cannot be below zero. Your federal tax and your provincial tax are both worked out from it.',
    );
  });

  it('t1-tax federal-tax paragraph', () => {
    expect(section('t1', 'federal-tax').paragraph).toBe(
      "Federal tax is charged in slices of income, called brackets, each with its own rate. The form finds the top slice your income reaches. It adds up the tax on all the slices below that one, then charges the top slice's rate on the rest of your income.",
    );
  });

  it('t1-tax credits paragraph', () => {
    expect(section('t1', 'credits').paragraph).toBe(
      'A credit lowers your tax bill. The form starts with a list of amounts: the basic personal amount that everyone gets (it shrinks at high incomes), the base part of your pension plan payments, your Employment Insurance (EI) payments, and the Canada employment amount. That last one is a set amount, or your job income if that is less. The form adds them up and takes {rate} of the total. That is your discount.',
    );
  });

  it('t1-tax balance paragraph', () => {
    expect(section('t1', 'balance').paragraph).toBe(
      'Line 43500 mainly adds your federal tax and your provincial tax. That gives your total payable. The last step, line 167, takes away your total credits (line 48200) to show whether you owe money or get a refund. This page stops before that step. One of those credits is the tax your employer already took off your pay during the year (line 43700). We leave it out and count only the other credits.',
    );
  });

  it('schedule-8 second-contribution paragraph and higher figure', () => {
    const { paragraph, figures } = section('schedule-8', 'second-contribution');
    expect(paragraph).toBe(
      'Pay above the first limit of {limit}, up to the higher limit of {higher}, is charged a second payment at {rate}. Pay above the higher limit is not charged. If your pay is under the first limit, there is nothing to pay here.',
    );
    expect(figures.higher).toEqual({
      shown: '$81,200',
      trace: {
        form: 'ca/schedule_8',
        label: 'cpp_additional_maximum_pensionable_earnings',
      },
    });
  });
});
