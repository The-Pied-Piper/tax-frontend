import { formPages } from '../formPages';
import { pageOf as page, sectionOf as section } from '../../test/formText';

const FEDERAL_IDS = [
  't4',
  't1-income',
  't1-tax',
  'schedule-8',
  't2204',
  'schedule-6',
];

// Read the flag without naming it on the type, so the file compiles before the
// field exists on FormPageSpec.
const isFederal = (spec: object): boolean =>
  (spec as { federal?: unknown }).federal === true;

function longestSentence(text: string): number {
  return Math.max(
    0,
    ...text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.split(/\s+/).filter(Boolean).length),
  );
}

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
  const spec = () => page('t1-tax');

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
    expect(section('t1-tax', 'provincial').heading).toBe('Your provincial tax');
  });

  it('says each province charges its own tax on its own form', () => {
    expect(section('t1-tax', 'provincial').paragraph).toMatch(
      /each province charges its own tax on its own form/i,
    );
  });

  it("names Ontario's form as Form ON428 and line 42800 as the copy", () => {
    const { paragraph } = section('t1-tax', 'provincial');
    expect(paragraph).toMatch(/Ontario's is Form ON428/);
    expect(paragraph).toMatch(/42800/);
  });

  it('gives the Ontario figure as a labelled example', () => {
    expect(section('t1-tax', 'provincial').example).toBe(
      'In Ontario the provincial tax is {ontario}.',
    );
  });

  it('says your federal tax and your provincial tax in the balance paragraph', () => {
    expect(section('t1-tax', 'balance').paragraph).toContain(
      'your federal tax and your provincial tax',
    );
  });

  it("opens the balance example with federal plus Ontario's provincial figure", () => {
    expect(section('t1-tax', 'balance').example).toMatch(
      /^\{federal\} plus Ontario's \{ontario\} is a total payable of \{total\}/,
    );
  });
});

describe('t1-income taxable-income copy', () => {
  const { paragraph } = section('t1-income', 'taxable-income');

  it('says your federal tax and your provincial tax', () => {
    expect(paragraph).toContain('your federal tax and your provincial tax');
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
